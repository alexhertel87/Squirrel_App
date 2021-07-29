from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Meds_List, Meds_Log, User, db

meds_log_routes = Blueprint('meds_log_route', __name__)

#* *-*-*-*-*-*-* All Logged Meds Route [GET] *-*-*-*-*-*-*

@meds_log_routes.route('/medications/log', methods=['GET'])
@login_required
def meds_log():
    logged_meds = Meds_Log.query.filter_by(user_id=current_user.id).all()
    return {'logged_meds': [logged.to_dict() for logged in logged_meds]}


#* *-*-*-*-*-*-* Add Meds to Logged Route [POST] *-*-*-*-*-*-*

#! Need help here

