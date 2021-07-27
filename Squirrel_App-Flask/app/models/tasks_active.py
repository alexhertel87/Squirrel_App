from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Active_Tasks(db.Model, UserMixin):
    __tablename__ = 'active_tasks'

    id = db.Column(db.Integer, primary_key=True)
    user_id =  db.Column(db.Integer, db.ForeignKey('users.id'))
    task_name = db.Column(db.String(100))
    due_date_1 = db.Column(db.DateTime)
    due_date_2 = db.Column(db.DateTime)
    completed = db.Column(db.Boolean)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.now(), onupdate=db.func.now())
