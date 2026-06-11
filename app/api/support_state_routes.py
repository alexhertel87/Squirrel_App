from flask import Blueprint, request
from flask_login import login_required, current_user

from app.models import UserSupportState, db

support_state_routes = Blueprint('support_state', __name__)


def get_or_create_support_state():
    support_state = UserSupportState.query.filter_by(user_id=current_user.id).first()
    if support_state:
        return support_state

    support_state = UserSupportState(user_id=current_user.id)
    support_state.set_data({})
    db.session.add(support_state)
    db.session.commit()
    return support_state


@support_state_routes.route('/', methods=['GET'])
@login_required
def get_support_state():
    return get_or_create_support_state().to_dict()


@support_state_routes.route('/', methods=['PUT'])
@login_required
def update_support_state():
    data = request.get_json(silent=True) or {}
    support_state = get_or_create_support_state()
    next_data = data.get('data', data)
    current_data = support_state.to_dict().get('data', {})
    current_calendar = current_data.get('calendar') or {}
    next_calendar = next_data.get('calendar') or {}

    if current_calendar.get('feedToken') and not next_calendar.get('feedToken'):
        next_data = {
            **next_data,
            'calendar': {
                **next_calendar,
                'feedToken': current_calendar.get('feedToken'),
            },
        }

    support_state.set_data(next_data)
    db.session.add(support_state)
    db.session.commit()
    return support_state.to_dict()
