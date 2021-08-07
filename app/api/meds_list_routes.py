from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Meds_List, Meds_Log, User, db
from app.forms.new_meds_form import MedsForm

meds_list_routes = Blueprint('meds_list', __name__)

#* *-*-*-*-*-*-* All Active Meds List Route [GET] *-*-*-*-*-*-*
#! ----- IT WORKS -----

@meds_list_routes.route('/active', methods=['GET'])
# @login_required
def meds_list():
    return {med.id: med.to_dict() for med in current_user.meds_list}


#* *-*-*-*-*-*-* New Active Meds Route [POST] *-*-*-*-*-*-*
#! ----- IT WORKS -----


@meds_list_routes.route('/new', methods=['POST'])
@login_required
def new_active_meds():
    form = MedsForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    # if form.validate_on_submit():
    data = request.get_json()
    medication = Meds_List(
    user_id = current_user.id,
    med_name = form.med_name.data,
    dosage_mg = form.dosage_mg.data,
    frequency = form.frequency.data,
    taken = form.taken.data,
    med_info = form.med_info.data)
    # form.populate_obj(medication)
    db.session.add(medication)
    db.session.commit()
    medications = Meds_List.query.filter_by(user_id=current_user.id)
    print("""

        Successfully added medication to Database

        """)
    return medication.to_dict()
    # else:
    #     return jsonify({"errors": form.errors})


#* *-*-*-*-*-*-* Update Active Meds Route [PUT] *-*-*-*-*-*-*
#! ----- IT WORKS -----

@meds_list_routes.route('/<int:id>/update', methods=['PUT'])
# @login_required
def update_active_meds(id):
    form = MedsForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    if form.validate_on_submit():
        medication = Meds_List.query.get(int(id))
        medication.med_name = form.med_name.data
        medication.dosage_mg = form.dosage_mg.data
        medication.frequency = form.frequency.data
        medication.taken = form.taken.data
        medication.med_info = form.med_info.data
        db.session.add(medication)
        db.session.commit()
        print("""

        Medication data successfully updated

        """)
        return medication.to_dict()


#* *-*-*-*-*-*-* Delete Active Meds Route [DELETE] *-*-*-*-*-*-*
#! ----- IT WORKS -----


@meds_list_routes.route('/<int:id>/delete', methods=['DELETE'])
# @login_required
def delete_active_meds(id):
    medication = Meds_List.query.get(id)
    db.session.delete(medication)
    db.session.commit()
    print("""

    Successfully deleted medication from Database

    """)
