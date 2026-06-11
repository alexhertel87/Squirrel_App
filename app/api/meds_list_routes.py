from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Meds_List, Meds_Log, User, db
from app.forms.new_meds_form import MedsForm

meds_list_routes = Blueprint('meds_list', __name__)


def get_medication_for_user(id):
    return Meds_List.query.filter_by(id=id, user_id=current_user.id).first()

#* *-*-*-*-*-*-* All Active Meds List Route [GET] *-*-*-*-*-*-*
#! ----- IT WORKS -----

@meds_list_routes.route('/active', methods=['GET'])
@login_required
def meds_list():
    return {med.id: med.to_dict() for med in current_user.meds_list}


#* *-*-*-*-*-*-* New Active Meds Route [POST] *-*-*-*-*-*-*
#! ----- IT WORKS -----


@meds_list_routes.route('/new', methods=['POST'])
@login_required
def new_active_meds():
    data = request.get_json(silent=True) or request.form
    medication = Meds_List(
        user_id=current_user.id,
        med_name=data.get('med_name'),
        dosage_mg=data.get('dosage_mg'),
        frequency=data.get('frequency'),
        taken=data.get('taken', False),
        med_info=data.get('med_info'))
    db.session.add(medication)
    db.session.commit()
    print("""

        Successfully added medication to Database

        """)
    return medication.to_dict()


#* *-*-*-*-*-*-* Update Active Meds Route [PUT] *-*-*-*-*-*-*
#! ----- IT WORKS -----

@meds_list_routes.route('/<int:id>/update', methods=['PUT'])
@login_required
def update_active_meds(id):
    data = request.get_json(silent=True) or request.form
    medication = get_medication_for_user(id)
    if not medication:
        return {'errors': ['Medication not found']}, 404

    medication.med_name = data.get('med_name', medication.med_name)
    medication.dosage_mg = data.get('dosage_mg', medication.dosage_mg)
    medication.frequency = data.get('frequency', medication.frequency)
    medication.taken = data.get('taken', medication.taken)
    medication.med_info = data.get('med_info', medication.med_info)
    db.session.add(medication)
    db.session.commit()
    print("""

        Medication data successfully updated

        """)
    return medication.to_dict()


#* *-*-*-*-*-*-* Delete Active Meds Route [DELETE] *-*-*-*-*-*-*
#! ----- IT WORKS -----


@meds_list_routes.route('/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_active_meds(id):
    medication = get_medication_for_user(id)
    if not medication:
        return {'errors': ['Medication not found']}, 404

    db.session.delete(medication)
    db.session.commit()
    print("""

    Successfully deleted medication from Database

    """)
    return {'message': 'Medication deleted', 'id': id}
