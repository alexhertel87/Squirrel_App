import re
from collections import Counter

from flask import Blueprint, request
from flask_login import current_user, login_required

from app.models import UserSupportState

search_routes = Blueprint('search', __name__)

STOPWORDS = {
    'a', 'about', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be',
    'been', 'but', 'by', 'can', 'did', 'do', 'does', 'ever', 'find', 'for',
    'from', 'had', 'has', 'have', 'how', 'i', 'in', 'into', 'is', 'it',
    'last', 'me', 'my', 'of', 'on', 'or', 'show', 'that', 'the', 'this',
    'to', 'was', 'were', 'what', 'when', 'where', 'with', 'year',
}

SENSITIVE_KEY_PARTS = (
    'account', 'bank', 'card', 'email', 'feedtoken', 'filename', 'id',
    'mimetype', 'password', 'routing', 'secret', 'ssn', 'storedname',
    'token', 'user_id', 'username',
)

FINANCIAL_CONTEXT_RE = re.compile(
    r'\b(account|acct|bank|card|credit|debit|routing|ssn|social security)\b',
    re.IGNORECASE,
)
FINANCIAL_NUMBER_RE = re.compile(
    r'\b(account|acct|bank|card|credit|debit|routing|ssn|social security)\b'
    r'[^.\n,;]{0,42}\d[\d -]{3,}',
    re.IGNORECASE,
)
LONG_NUMBER_RE = re.compile(r'\b\d{8,19}\b')
GROUPED_NUMBER_RE = re.compile(r'\b(?:\d{4}[ -]){2,4}\d{4}\b')
TOKEN_RE = re.compile(r'[a-z0-9]+')


def status_label(status):
    if status == 'taken':
        return 'Taken'
    if status == 'skipped':
        return 'Skipped'
    if status == 'unsure':
        return 'Not sure'
    return 'Check-in'


def get_support_data():
    support_state = UserSupportState.query.filter_by(user_id=current_user.id).first()
    if not support_state:
        return {}
    return support_state.to_dict().get('data', {})


def key_is_sensitive(key):
    normalized = str(key or '').replace('_', '').lower()
    return any(part in normalized for part in SENSITIVE_KEY_PARTS)


def sanitize_text(value):
    if value is None:
        return ''

    text = str(value)
    text = FINANCIAL_NUMBER_RE.sub('[redacted]', text)
    text = GROUPED_NUMBER_RE.sub('[redacted]', text)
    text = LONG_NUMBER_RE.sub('[redacted]', text)
    return ' '.join(text.split())


def query_is_sensitive(query):
    if not query:
        return False

    return (
        bool(FINANCIAL_CONTEXT_RE.search(query) and re.search(r'\d{4,}', query))
        or bool(GROUPED_NUMBER_RE.search(query))
        or bool(LONG_NUMBER_RE.search(query))
    )


def tokenize(value):
    return TOKEN_RE.findall(sanitize_text(value).lower())


def query_terms(query):
    terms = [term for term in tokenize(query) if term not in STOPWORDS]
    return terms or tokenize(query)


def safe_join(parts):
    return ' '.join(filter(None, (sanitize_text(part) for part in parts)))


def excerpt_for_match(text, terms):
    sanitized = sanitize_text(text)
    lower_text = sanitized.lower()
    match_positions = [lower_text.find(term) for term in terms if term in lower_text]

    if not match_positions:
        return sanitized[:150]

    start = max(0, min(match_positions) - 48)
    end = min(len(sanitized), start + 170)
    prefix = '...' if start else ''
    suffix = '...' if end < len(sanitized) else ''
    return f'{prefix}{sanitized[start:end]}{suffix}'


def add_record(records, kind, title, detail='', body='', url='/dashboard', date_label=''):
    searchable = safe_join([kind, title, detail, body, date_label])
    if not searchable:
        return

    records.append({
        'id': f'{kind}-{len(records)}',
        'type': kind,
        'title': sanitize_text(title),
        'detail': sanitize_text(detail),
        'body': sanitize_text(body),
        'url': url,
        'dateLabel': sanitize_text(date_label),
        'searchText': searchable,
    })


def add_support_values(records, value, path=None):
    path = path or []

    if isinstance(value, dict):
        for key, nested_value in value.items():
            if key_is_sensitive(key):
                continue
            add_support_values(records, nested_value, [*path, str(key)])
        return

    if isinstance(value, list):
        for index, nested_value in enumerate(value):
            add_support_values(records, nested_value, [*path, str(index + 1)])
        return

    if isinstance(value, bool) or value is None:
        return

    text = sanitize_text(value)
    if len(text) < 3 or text in {'true', 'false'}:
        return

    add_record(
        records,
        'Saved Detail',
        path[-1].replace('_', ' ').title() if path else 'Saved Detail',
        'Saved app detail',
        text,
        '/dashboard',
    )


def build_search_records():
    records = []
    support_data = get_support_data()
    meds_by_id = {str(med.id): med for med in current_user.meds_list}
    tasks_by_id = {str(task.id): task for task in current_user.active_tasks}

    for med in current_user.meds_list:
        add_record(
            records,
            'Medication',
            med.med_name,
            f'Dosage: {med.dosage_mg}mg. Frequency: {med.frequency}.',
            med.med_info,
            '/dashboard/current_meds',
            med.updated_at,
        )

    checkins = support_data.get('checkins') or {}
    for date_key, daily_checkins in checkins.items():
        if not isinstance(daily_checkins, dict):
            continue
        for med_id, checkin in daily_checkins.items():
            med = meds_by_id.get(str(med_id))
            status = checkin.get('status') if isinstance(checkin, dict) else checkin
            dosage = f'Dosage: {med.dosage_mg}mg.' if med else ''
            add_record(
                records,
                'Medication Log',
                f'{med.med_name if med else "Medication"} {status_label(status)}',
                f'{status_label(status)} on {date_key}. {dosage}',
                '',
                '/dashboard/current_meds',
                date_key,
            )

    task_steps = support_data.get('taskSteps') or {}
    for task in current_user.active_tasks:
        add_record(
            records,
            'Task',
            task.task_name,
            f'Goal: {task.due_date_1 or "Flexible"}. Deadline: {task.due_date_2 or "Flexible"}.',
            '',
            '/dashboard/task_list',
            task.updated_at,
        )

        for step in task_steps.get(str(task.id), []):
            if not isinstance(step, dict):
                continue
            step_title = step.get('text') or step.get('title') or step.get('label')
            add_record(
                records,
                'Task Step',
                step_title or 'Task step',
                f'Step for {task.task_name}. {"Done" if step.get("done") else "Open"}.',
                '',
                '/dashboard/task_list',
            )

    for task_id, steps in task_steps.items():
        if str(task_id) in tasks_by_id or not isinstance(steps, list):
            continue
        for step in steps:
            if isinstance(step, dict):
                add_record(
                    records,
                    'Task Step',
                    step.get('text') or step.get('title') or step.get('label') or 'Task step',
                    'Saved task step',
                    '',
                    '/dashboard/task_list',
                )

    routines = support_data.get('routines') or {}
    for routine_key, is_done in routines.items():
        routine_label = str(routine_key).replace(':', ': ')
        add_record(
            records,
            'Reminder',
            routine_label,
            'Routine reminder. Done today.' if is_done else 'Routine reminder. Still open.',
            '',
            '/dashboard',
        )

    learning = support_data.get('learning') or {}
    for area in learning.get('areas') or []:
        if isinstance(area, dict):
            add_record(
                records,
                'School Course',
                area.get('name') or 'Course',
                area.get('type') or '',
                '',
                '/dashboard/school',
            )

    for item in learning.get('planner') or []:
        if isinstance(item, dict):
            add_record(
                records,
                'School Planner',
                item.get('title') or 'School item',
                safe_join([item.get('area'), item.get('type'), item.get('dueDate')]),
                safe_join([item.get('term'), item.get('year'), item.get('status')]),
                '/dashboard/school',
                item.get('dueDate'),
            )

    for material in learning.get('materials') or []:
        if isinstance(material, dict):
            add_record(
                records,
                'Course Material',
                material.get('title') or 'Course material',
                safe_join([material.get('course'), material.get('term'), material.get('year')]),
                material.get('kind') or '',
                '/dashboard/school',
                material.get('uploadedAt'),
            )

    add_support_values(records, {
        'comfort': support_data.get('comfort'),
        'taskEnergy': support_data.get('taskEnergy'),
    })

    return records


def build_suggestions(records, query):
    counts = Counter()
    for record in records:
        for token in tokenize(record['searchText']):
            if token not in STOPWORDS and len(token) > 2:
                counts[token] += 1

        for phrase in [record.get('title'), record.get('detail')]:
            phrase = sanitize_text(phrase)
            if phrase and len(phrase) <= 64:
                counts[phrase.lower()] += 2

    normalized_query = sanitize_text(query).lower().strip()
    if normalized_query:
        suggestions = [
            suggestion for suggestion, _count in counts.most_common()
            if suggestion.startswith(normalized_query) or normalized_query in suggestion
        ]
    else:
        suggestions = [suggestion for suggestion, _count in counts.most_common()]

    return suggestions[:10]


def search_records(records, query):
    terms = query_terms(query)
    normalized_query = sanitize_text(query).lower().strip()
    results = []

    if not terms:
        return []

    for record in records:
        haystack = record['searchText'].lower()
        matches = [term for term in terms if term in haystack]
        if not matches:
            continue

        score = len(matches) * 10
        score += sum(haystack.count(term) for term in matches)
        if normalized_query and normalized_query in haystack:
            score += 30

        results.append({
            'id': record['id'],
            'type': record['type'],
            'title': record['title'],
            'detail': record['detail'],
            'matchedText': excerpt_for_match(record['searchText'], matches),
            'url': record['url'],
            'score': score,
        })

    return sorted(results, key=lambda result: result['score'], reverse=True)[:12]


@search_routes.route('/', methods=['GET'])
@login_required
def search():
    query = request.args.get('q', '').strip()

    if query_is_sensitive(query):
        return {
            'query': query,
            'results': [],
            'suggestions': [],
            'sensitive': True,
            'message': 'Sensitive financial identifiers are intentionally not searchable.',
        }

    records = build_search_records()
    suggestions = build_suggestions(records, query)
    results = search_records(records, query) if query else []

    return {
        'query': query,
        'results': results,
        'suggestions': suggestions,
        'sensitive': False,
    }
