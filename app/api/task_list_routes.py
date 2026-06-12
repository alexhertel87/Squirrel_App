from datetime import datetime

from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Active_Tasks, User, db
from app.forms.task_list_form import TaskForm

task_list_routes = Blueprint('task_list', __name__)


def parse_task_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def get_task_for_user(id):
    return Active_Tasks.query.filter_by(id=id, user_id=current_user.id).first()

#!------------ GET Works ------------#
@task_list_routes.route('/all', methods=['GET'])
@login_required
def task_list():
    return {task.id: task.to_dict() for task in current_user.active_tasks}


@task_list_routes.route('/new', methods=['POST'])
@login_required
def new_task():
    print("""

        POST ROUTE GOT HIT

    """)
    form = TaskForm()
    # form['csrf_token'].data = request.cookies['csrf_token']
    data = request.get_json(force=True)
    print("DATA ----> ", data["task_name"])
    task_item = Active_Tasks(
        user_id=current_user.id,
        task_name=data["task_name"],
        due_date_1=parse_task_date(data.get("due_date_1")),
        due_date_2=parse_task_date(data.get("due_date_2")))
    db.session.add(task_item)
    db.session.commit()
    print("TASK ITEMSSSS", task_item)
    # task_items = Active_Tasks.query.filter_by(user_id=current_user.id)
    print("""

    Task created successfully.

    """)
    return task_item.to_dict()


@task_list_routes.route('/update/<int:id>/', methods=['PUT'])
@login_required
def update_task(id):
    data = request.get_json(silent=True) or request.form
    task_item = get_task_for_user(id)
    if not task_item:
        return {'errors': ['Task not found']}, 404

    task_item.task_name = data.get('task_name', task_item.task_name)
    if 'due_date_1' in data:
        task_item.due_date_1 = parse_task_date(data.get('due_date_1'))
    if 'due_date_2' in data:
        task_item.due_date_2 = parse_task_date(data.get('due_date_2'))
    db.session.add(task_item)
    db.session.commit()
    print("""

    Task Item Successfully Updated

    """)
    return task_item.to_dict()


@task_list_routes.route('/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_task(id):
    task_item = get_task_for_user(id)
    if not task_item:
        return {'errors': ['Task not found']}, 404

    db.session.delete(task_item)
    db.session.commit()
    print("""

    Task Item Successfully Deleted

    """)
    return {'message': 'Task deleted', 'id': id}
