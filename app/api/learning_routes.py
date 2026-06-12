from datetime import datetime
import os
from pathlib import Path
from uuid import uuid4

from flask import Blueprint, abort, current_app, request, send_from_directory
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename

from app.models import UserSupportState, db

learning_routes = Blueprint('learning', __name__)

DEFAULT_LEARNING_STATE = {
    'areas': [],
    'planner': [],
    'materials': [],
}


def get_or_create_support_state():
    support_state = UserSupportState.query.filter_by(user_id=current_user.id).first()
    if support_state:
        return support_state

    support_state = UserSupportState(user_id=current_user.id)
    support_state.set_data({})
    db.session.add(support_state)
    db.session.commit()
    return support_state


def normalize_learning_state(learning_state=None):
    learning_state = learning_state or {}
    return {
        'areas': list(learning_state.get('areas') or []),
        'planner': list(learning_state.get('planner') or []),
        'materials': list(learning_state.get('materials') or []),
    }


def get_support_data(support_state):
    return support_state.to_dict().get('data', {})


def save_learning_state(support_state, learning_state):
    data = get_support_data(support_state)
    data['learning'] = normalize_learning_state(learning_state)
    support_state.set_data(data)
    db.session.add(support_state)
    db.session.commit()
    return data['learning']


def material_upload_dir():
    upload_dir = Path(current_app.root_path) / 'uploads' / 'learning_materials' / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def material_for_current_user(material_id):
    support_state = get_or_create_support_state()
    learning_state = normalize_learning_state(get_support_data(support_state).get('learning'))

    for material in learning_state['materials']:
        if material.get('id') == material_id:
            return material, learning_state

    return None, learning_state


@learning_routes.route('/', methods=['GET'])
@login_required
def get_learning_state():
    support_state = get_or_create_support_state()
    learning_state = normalize_learning_state(get_support_data(support_state).get('learning'))
    return {'learning': learning_state}


@learning_routes.route('/', methods=['PUT'])
@login_required
def update_learning_state():
    payload = request.get_json(silent=True) or {}
    next_learning = normalize_learning_state(payload.get('learning') or payload)
    support_state = get_or_create_support_state()
    learning_state = save_learning_state(support_state, next_learning)
    return {'learning': learning_state}


@learning_routes.route('/materials', methods=['POST'])
@login_required
def upload_learning_material():
    uploaded_file = request.files.get('file')
    if not uploaded_file or not uploaded_file.filename:
        return {'errors': ['Choose a file to upload.']}, 400

    support_state = get_or_create_support_state()
    learning_state = normalize_learning_state(get_support_data(support_state).get('learning'))
    original_filename = secure_filename(uploaded_file.filename) or 'learning-material'
    material_id = uuid4().hex
    stored_filename = f'{material_id}-{original_filename}'
    upload_dir = material_upload_dir()
    file_path = upload_dir / stored_filename
    uploaded_file.save(file_path)

    material = {
        'id': material_id,
        'title': request.form.get('title') or original_filename,
        'fileName': original_filename,
        'storedName': stored_filename,
        'mimeType': uploaded_file.mimetype,
        'size': os.path.getsize(file_path),
        'course': request.form.get('course') or request.form.get('area') or 'Unsorted',
        'area': request.form.get('area') or request.form.get('course') or 'Unsorted',
        'term': request.form.get('term') or 'No Term',
        'year': request.form.get('year') or str(datetime.utcnow().year),
        'kind': request.form.get('kind') or 'Document',
        'uploadedAt': datetime.utcnow().isoformat(),
    }

    learning_state['materials'].insert(0, material)
    learning_state = save_learning_state(support_state, learning_state)
    return {'learning': learning_state, 'material': material}


@learning_routes.route('/materials/<material_id>/download', methods=['GET'])
@login_required
def download_learning_material(material_id):
    material, _learning_state = material_for_current_user(material_id)
    if not material:
        abort(404)

    upload_dir = material_upload_dir()
    stored_filename = secure_filename(material.get('storedName') or '')
    if not stored_filename or not (upload_dir / stored_filename).exists():
        abort(404)

    return send_from_directory(
        upload_dir,
        stored_filename,
        as_attachment=True,
        download_name=material.get('fileName') or stored_filename,
    )


@learning_routes.route('/materials/<material_id>', methods=['DELETE'])
@login_required
def delete_learning_material(material_id):
    material, learning_state = material_for_current_user(material_id)
    if not material:
        return {'errors': ['Material not found.']}, 404

    stored_filename = secure_filename(material.get('storedName') or '')
    if stored_filename:
        try:
            (material_upload_dir() / stored_filename).unlink()
        except FileNotFoundError:
            pass

    support_state = get_or_create_support_state()
    learning_state['materials'] = [
        existing for existing in learning_state['materials']
        if existing.get('id') != material_id
    ]
    learning_state = save_learning_state(support_state, learning_state)
    return {'learning': learning_state, 'deletedId': material_id}
