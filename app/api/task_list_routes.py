from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Active_Tasks, User, db
from app.forms.task_list_form import TaskForm

task_list_routes = Blueprint('task_list', __name__)

#!------------ GET Works ------------#
@task_list_routes.route('/all', methods=['GET'])
# @login_required
def task_list():
    return {task.id: task.to_dict() for task in current_user.active_tasks}


@task_list_routes.route('/new', methods=['POST'])
# @login_required
def new_task():
    print("""

        POST ROUTE GOT HIT

    """)
    form = TaskForm()
    # form['csrf_token'].data = request.cookies['csrf_token']
    data = request.get_json(force=True)
    print("DATA ----> ", data["task_name"])
    task_item = Active_Tasks(
    user_id = current_user.id,
    task_name = data["task_name"],
    due_date_1 = data["due_date_1"],
    due_date_2 = data["due_date_2"])
    db.session.add(task_item)
    db.session.commit()
    print("TASK ITEMSSSS", task_item)
    # task_items = Active_Tasks.query.filter_by(user_id=current_user.id)
    print("""

    Task created successfully.

    """)
    return task_item.to_dict()


@task_list_routes.route('/<int:id>/update', methods=['PUT'])
@login_required
def update_task(id):
    form = TaskForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    if form.validate_on_submit():
        task_item = Active_Tasks.query.get(int(id))
        task_item.task_name = form.task_name.data
        task_item.due_date_1 = form.due_date_1.data
        task_item.due_date_2 = form.due_date_2.data
        task_item.completed = form.completed.data
        task_item.completed_at = form.completed_at.data
        db.session.add(task_item)
        db.session.commit()
        print("""

        Task Item Successfully Updated

        """)
        return task_item.to_dict()


@task_list_routes.route('/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_task(id):
    task_item = Active_Tasks.query.get(id)
    db.session.delete(task_item)
    db.session.commit()
    print("""

    Task Item Successfully Deleted

    """)
