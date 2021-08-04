from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Meds_List, Meds_Log, User, db
from app.forms.new_meds_form import MedsForm

meds_list_routes = Blueprint('task_list', __name__)
