from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Meds_List, Meds_Log, User, db

meds_list_routes = Blueprint('meds_list_route', __name__)

#* *-*-*-*-*-*-* All Active Meds List Route [GET] *-*-*-*-*-*-*

@meds_list_routes.route('/medications/active', methods=['GET'])
@login_required
def meds_list():
    active_meds = Meds_List.query.filter_by(user_id=current_user.id, active=True).all()
    return {'active_meds': [meds.to_dict() for meds in active_meds]}


#* *-*-*-*-*-*-* New Active Meds Route [POST] *-*-*-*-*-*-*

@meds_list_routes.route('/medications/new', methods=['POST'])

#* *-*-*-*-*-*-* Update Active Meds Route [PUT] *-*-*-*-*-*-*



#* *-*-*-*-*-*-* Delete Active Meds Route [DELETE] *-*-*-*-*-*-*
