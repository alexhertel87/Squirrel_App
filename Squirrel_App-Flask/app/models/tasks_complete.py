from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Completed_Tasks (db.Model):
    __tablename__ = "completed_tasks"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.now(), onupdate=db.func.now())

