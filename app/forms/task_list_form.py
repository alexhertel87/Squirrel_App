from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField, TextAreaField, BooleanField, IntegerField, DateField
from wtforms.fields.core import IntegerField
from wtforms.validators import DataRequired
from app.models import Active_Tasks, User, db


class TaskForm(FlaskForm):
    task_name = StringField('Task Name', validators=[DataRequired()])
    due_date_1 = DateField('Due Date 1', validators=[DataRequired()])
    due_date_2 = DateField('Due Date 2')
    completed = BooleanField('Completed')
    completed_at = DateField('Completed at')
