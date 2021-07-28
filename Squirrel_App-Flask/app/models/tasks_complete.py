from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Completed_Tasks (db.Model, UserMixin):
    __tablename__ = "completed_tasks"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('active_tasks.id'))
    task_name = db.Column(db.String(100), nullable=False, unique=True)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.now(), onupdate=db.func.now())

    active = relationship("Active_Tasks", back_populates="completed")
