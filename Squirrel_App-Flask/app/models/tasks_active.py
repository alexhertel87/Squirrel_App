from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Active_Tasks(db.Model, UserMixin):
    __tablename__ = 'active_tasks'

    id = db.Column(db.Integer, primary_key=True)
    user_id =  db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_name = db.Column(db.String(100) , nullable=False, unique=True)
    due_date_1 = db.Column(db.DateTime, nullable=False)
    due_date_2 = db.Column(db.DateTime, nullable=True)
    completed = db.Column(db.Boolean)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.now(), onupdate=db.func.now())

    user = relationship("User", back_populates="active_tasks")
    completed = relationship("Completed_Tasks", back_populates="active")
