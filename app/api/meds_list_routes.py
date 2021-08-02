from flask import Blueprint, jsonify, session, request, render_template, redirect
from flask_login import login_required, current_user
from app.api.auth_routes import validation_errors_to_error_messages
from app.models import Meds_List, Meds_Log, User, db
from app.forms.new_meds_form import MedsForm

meds_list_routes = Blueprint('meds_list', __name__)

#* *-*-*-*-*-*-* All Active Meds List Route [GET] *-*-*-*-*-*-*

@meds_list_routes.route('/active', methods=['GET'])
# @login_required
def meds_list():
    active_meds = Meds_List.query.filter_by(user_id=current_user.id, active=True).all()
    # active_meds = Meds_List.query.filter_by(user_id=1).all()
    return {'active_meds': [meds.to_dict() for meds in active_meds]}
    # return {"Hello"}

#* *-*-*-*-*-*-* New Active Meds Route [POST] *-*-*-*-*-*-*

@meds_list_routes.route('/new', methods=['POST'])
# @login_required
def new_active_meds():
    form = MedsForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    if form.validate_on_submit():
        data = request.get_json()
        medication = Meds_List(
        user_id = form.data["user_id"],
        med_name = form.med_name.data,
        dosage_mg = form.dosage_mg.data,
        frequency = form.frequency.data,
        taken = form.taken.data,
        med_info = form.med_info.data)
        # form.populate_obj(medication)
        db.session.add(medication)
        db.session.commit()
        print("Successfully added medication to Database")
        return medication.to_dict()


#* *-*-*-*-*-*-* Update Active Meds Route [PUT] *-*-*-*-*-*-*

@meds_list_routes.route('/<int:med_id>/update', methods=['PUT'])
@login_required
def update_active_meds(med_id):
    form = MedsForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    if form.validate_on_submit():
        medication = Meds_List.query.get(int(med_id))
        medication.user_id = current_user.id
        medication.med_name = form.med_name.data
        medication.dosage_mg = form.dosage_mg.data
        medication.frequency = form.frequency.data
        medication.taken = form.taken.data
        medication.med_info = form.med_info.data
        db.session.add(medication)
        db.session.commit()
        print("Medication data successfully updated")
        return medication.to_dict()


#* *-*-*-*-*-*-* Delete Active Meds Route [DELETE] *-*-*-*-*-*-*

@meds_list_routes.route('/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_active_meds(id):
    medication = Meds_List.query.get(id)
    db.session.delete(medication)
    db.session.commit()
    print("Successfully deleted medication from Database")
