from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField, TextAreaField, BooleanField, IntegerField
from wtforms.fields.core import IntegerField
from wtforms.validators import DataRequired
from app.models import Meds_List, Meds_Log, User, db

class MedsForm(FlaskForm):
    # user_id = IntegerField('User ID', validators=[DataRequired()])
    med_name = StringField('Medication Name', validators=[DataRequired()])
    dosage_mg = IntegerField('Dosage (mg)', validators=[DataRequired()])
    frequency = StringField('Frequency', validators=[DataRequired()])
    taken = BooleanField('Taken')
    med_info = TextAreaField('Medication Information')
