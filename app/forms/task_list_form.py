from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField, TextAreaField, BooleanField, IntegerField, DateField
from wtforms.fields.core import IntegerField
from wtforms.validators import DataRequired
from app.models import Active_Tasks, User, db


class TaskForm(FlaskForm):
    task_name = StringField('task_name', validators=[DataRequired()])
    due_date_1 = DateField('due_date_1', validators=[DataRequired()])
    due_date_2 = DateField('due_date_2')
    # completed = BooleanField('completed')
    # completed_at = DateField('completed_at')
