from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Active_Tasks(db.Model, UserMixin):
    __tablename__ = 'active_tasks'

    id = db.Column(db.Integer, primary_key=True)
    user_id =  db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_name = db.Column(db.String(100) , nullable=False)
    due_date_1 = db.Column(db.DateTime(timezone=True), nullable=True)
    due_date_2 = db.Column(db.DateTime(timezone=True), nullable=True)
    completed = db.Column(db.Boolean, nullable=True)
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now(), onupdate=db.func.now())

    user = relationship("User", back_populates="active_tasks")
    completed = relationship("Completed_Tasks", back_populates="active")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'task_name': self.task_name,
            'due_date_1': self.due_date_1,
            'due_date_2': self.due_date_2,
            'completed': self.completed,
            'completed_at': self.completed_at,
        }
