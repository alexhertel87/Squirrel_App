from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField, TextAreaField, BooleanField, IntegerField
from wtforms.fields.core import IntegerField
from wtforms.validators import DataRequired
from app.models import Meds_List, Meds_Log, User, db
