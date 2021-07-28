from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField, TextAreaField, BooleanField, SelectMultipleField, widgets
from wtforms.fields.core import IntegerField, NumericField
from wtforms.validators import DataRequired
from wtforms.ext.sqlalchemy.fields import QuerySelectField
from app.models import Meds_List, Meds_Log, User, db

class MedsForm(FlaskForm):
    user_id = IntegerField('User ID', validators=[DataRequired()])
    meds_name = StringField('Medication Name', validators=[DataRequired()])
    dosage_mg = NumericField('Dosage (mg)', validators=[DataRequired()])
    frequency = StringField('Frequency', validators=[DataRequired()])
    taken = BooleanField('Taken')
    med_info = TextAreaField('Medication Information')
