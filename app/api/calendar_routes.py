from datetime import date, datetime, time, timedelta
import secrets

from flask import Blueprint, abort, make_response, request, url_for
from flask_login import current_user, login_required

from app.models import UserSupportState, db

calendar_routes = Blueprint('calendar', __name__)

DEFAULT_CALENDAR_SETTINGS = {
    'includeTasks': True,
    'includeMeds': True,
    'includeRoutines': False,
}

ROUTINE_EVENTS = [
    ('morning', 'Morning Launch', time(8, 0), 30),
    ('reset', 'Midday Reset', time(12, 30), 20),
    ('evening', 'Evening Landing', time(20, 30), 30),
]


def get_or_create_support_state_for_user(user):
    support_state = UserSupportState.query.filter_by(user_id=user.id).first()
    if support_state:
        return support_state

    support_state = UserSupportState(user_id=user.id)
    support_state.set_data({})
    db.session.add(support_state)
    db.session.commit()
    return support_state


def get_support_data(support_state):
    return support_state.to_dict().get('data', {})


def save_support_data(support_state, data):
    support_state.set_data(data)
    db.session.add(support_state)
    db.session.commit()


def ensure_calendar_settings(support_state):
    data = get_support_data(support_state)
    calendar = {
        **DEFAULT_CALENDAR_SETTINGS,
        **(data.get('calendar') or {}),
    }

    if not calendar.get('feedToken'):
        calendar['feedToken'] = secrets.token_urlsafe(24)
        data['calendar'] = calendar
        save_support_data(support_state, data)

    return data, calendar


def rotate_calendar_token(support_state):
    data = get_support_data(support_state)
    calendar = {
        **DEFAULT_CALENDAR_SETTINGS,
        **(data.get('calendar') or {}),
        'feedToken': secrets.token_urlsafe(24),
    }
    data['calendar'] = calendar
    save_support_data(support_state, data)
    return data, calendar


def find_support_state_by_token(token):
    for support_state in UserSupportState.query.all():
        data = get_support_data(support_state)
        calendar = data.get('calendar') or {}
        if calendar.get('feedToken') == token:
            return support_state, data, calendar

    return None, None, None


def calendar_links(token):
    feed_url = url_for('calendar.calendar_ics_feed', token=token, _external=True)
    download_url = url_for('calendar.calendar_ics_download', token=token, _external=True)
    webcal_url = feed_url.replace('https://', 'webcal://', 1).replace('http://', 'webcal://', 1)

    return {
        'feedUrl': feed_url,
        'webcalUrl': webcal_url,
        'downloadUrl': download_url,
        'googleUrl': 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl',
        'outlookUrl': 'https://outlook.live.com/calendar/0/addcalendar',
    }


def escape_ical_text(value):
    return str(value or '').replace('\\', '\\\\').replace('\n', '\\n').replace(';', '\\;').replace(',', '\\,')


def fold_ical_line(line):
    if len(line) <= 74:
        return [line]

    lines = []
    current = line
    while len(current) > 74:
        lines.append(current[:74])
        current = f' {current[74:]}'
    lines.append(current)
    return lines


def format_all_day(value):
    return value.strftime('%Y%m%d')


def format_datetime(value):
    return value.strftime('%Y%m%dT%H%M%S')


def parse_model_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(str(value)).date()
    except ValueError:
        return None


def med_start_time(frequency):
    normalized = (frequency or '').lower()
    if 'night' in normalized or 'bed' in normalized:
        return time(21, 0)
    if 'evening' in normalized or 'dinner' in normalized or 'pm' in normalized:
        return time(19, 0)
    if 'afternoon' in normalized or 'lunch' in normalized or 'noon' in normalized:
        return time(13, 0)
    return time(9, 0)


def event_lines(uid, summary, description, start, end=None, all_day=False, rrule=None, alarm=False):
    stamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    lines = [
        'BEGIN:VEVENT',
        f'UID:{uid}',
        f'DTSTAMP:{stamp}',
        f'SUMMARY:{escape_ical_text(summary)}',
        f'DESCRIPTION:{escape_ical_text(description)}',
    ]

    if all_day:
        lines.append(f'DTSTART;VALUE=DATE:{format_all_day(start)}')
        lines.append(f'DTEND;VALUE=DATE:{format_all_day(end or (start + timedelta(days=1)))}')
    else:
        lines.append(f'DTSTART:{format_datetime(start)}')
        lines.append(f'DTEND:{format_datetime(end or (start + timedelta(minutes=15)))}')

    if rrule:
        lines.append(f'RRULE:{rrule}')

    if alarm:
        lines.extend([
            'BEGIN:VALARM',
            'TRIGGER:-PT10M',
            'ACTION:DISPLAY',
            f'DESCRIPTION:{escape_ical_text(summary)}',
            'END:VALARM',
        ])

    lines.append('END:VEVENT')
    return lines


def build_calendar_events(user, support_data, calendar_settings):
    events = []
    today = date.today()

    if calendar_settings.get('includeTasks'):
        task_steps = support_data.get('taskSteps') or {}
        task_energy = support_data.get('taskEnergy') or {}

        for task in user.active_tasks:
            goal_date = parse_model_date(task.due_date_1)
            latest_date = parse_model_date(task.due_date_2)
            steps = task_steps.get(str(task.id)) or task_steps.get(task.id) or []
            done_steps = len([step for step in steps if step.get('done')])
            description = (
                f'Energy: {task_energy.get(str(task.id), "medium")}. '
                f'Steps complete: {done_steps}/{len(steps) or 1}. '
                'Created in Squirrel.'
            )

            if goal_date:
                events.append(event_lines(
                    f'squirrel-task-{task.id}-goal@squirrel-app',
                    f'Squirrel Task: {task.task_name}',
                    description,
                    goal_date,
                    all_day=True,
                ))

            if latest_date and latest_date != goal_date:
                events.append(event_lines(
                    f'squirrel-task-{task.id}-latest@squirrel-app',
                    f'Latest: {task.task_name}',
                    description,
                    latest_date,
                    all_day=True,
                ))

    if calendar_settings.get('includeMeds'):
        for med in user.meds_list:
            start_at = datetime.combine(today, med_start_time(med.frequency))
            dosage = f' {med.dosage_mg}mg' if med.dosage_mg else ''
            description = f'{med.frequency}. {med.med_info or "Medication reminder from Squirrel."}'
            events.append(event_lines(
                f'squirrel-med-{med.id}@squirrel-app',
                f'Take {med.med_name}{dosage}',
                description,
                start_at,
                start_at + timedelta(minutes=15),
                rrule='FREQ=DAILY;COUNT=90',
                alarm=True,
            ))

    if calendar_settings.get('includeRoutines'):
        for routine_id, label, start_time, minutes in ROUTINE_EVENTS:
            start_at = datetime.combine(today, start_time)
            events.append(event_lines(
                f'squirrel-routine-{routine_id}@squirrel-app',
                f'Squirrel: {label}',
                'Gentle routine anchor from Squirrel.',
                start_at,
                start_at + timedelta(minutes=minutes),
                rrule='FREQ=DAILY;COUNT=90',
            ))

    return events


def render_ics_calendar(user, support_data, calendar_settings):
    event_groups = build_calendar_events(user, support_data, calendar_settings)
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Squirrel App//Calendar Feed//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Squirrel Support',
        'X-WR-CALDESC:Task due dates and gentle medication reminders from Squirrel.',
    ]

    for event_group in event_groups:
        lines.extend(event_group)

    lines.append('END:VCALENDAR')

    folded = []
    for line in lines:
        folded.extend(fold_ical_line(line))

    return '\r\n'.join(folded) + '\r\n'


def calendar_response(ics_content, filename=None):
    response = make_response(ics_content)
    response.headers['Content-Type'] = 'text/calendar; charset=utf-8'
    response.headers['Cache-Control'] = 'private, max-age=300'
    if filename:
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def feed_metadata(user, support_data, calendar_settings, token):
    links = calendar_links(token)
    events = build_calendar_events(user, support_data, calendar_settings)

    return {
        **links,
        'eventCount': len(events),
        'includes': [
            {
                'id': 'tasks',
                'label': 'Task Due Dates',
                'enabled': bool(calendar_settings.get('includeTasks')),
                'count': len([task for task in user.active_tasks if task.due_date_1 or task.due_date_2]),
            },
            {
                'id': 'meds',
                'label': 'Medication Reminders',
                'enabled': bool(calendar_settings.get('includeMeds')),
                'count': len(user.meds_list),
            },
            {
                'id': 'routines',
                'label': 'Routine Anchors',
                'enabled': bool(calendar_settings.get('includeRoutines')),
                'count': len(ROUTINE_EVENTS),
            },
        ],
        'notes': [
            'Google, Outlook, and Apple Calendar can subscribe to the private Squirrel calendar link.',
            'Subscribed calendars refresh on each provider’s schedule.',
            'Resetting the private link stops future access from the previous link.',
        ],
    }


@calendar_routes.route('/feed', methods=['GET'])
@login_required
def get_calendar_feed():
    support_state = get_or_create_support_state_for_user(current_user)
    support_data, calendar_settings = ensure_calendar_settings(support_state)
    return feed_metadata(current_user, support_data, calendar_settings, calendar_settings['feedToken'])


@calendar_routes.route('/feed/reset', methods=['POST'])
@login_required
def reset_calendar_feed():
    support_state = get_or_create_support_state_for_user(current_user)
    support_data, calendar_settings = rotate_calendar_token(support_state)
    return feed_metadata(current_user, support_data, calendar_settings, calendar_settings['feedToken'])


@calendar_routes.route('/feed/<token>.ics', methods=['GET'])
def calendar_ics_feed(token):
    support_state, support_data, calendar_settings = find_support_state_by_token(token)
    if not support_state:
        abort(404)

    return calendar_response(render_ics_calendar(support_state.user, support_data, calendar_settings))


@calendar_routes.route('/feed/<token>/download.ics', methods=['GET'])
def calendar_ics_download(token):
    support_state, support_data, calendar_settings = find_support_state_by_token(token)
    if not support_state:
        abort(404)

    return calendar_response(
        render_ics_calendar(support_state.user, support_data, calendar_settings),
        filename='squirrel-calendar.ics',
    )
