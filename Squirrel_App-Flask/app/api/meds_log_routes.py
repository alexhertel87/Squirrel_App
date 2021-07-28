from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.models import User_Comment, User, db
from app.forms.comments_form import CommentForm
from app.api.auth_routes import validation_errors_to_error_messages

meds_log_routes = Blueprint('meds_log_route', __name__)
