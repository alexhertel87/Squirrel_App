from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Med_log(db.Model, UserMixin):
    __tablename__ = 'med_log'

    id = db.Column(db.Integer, primary_key=True)
    med_id = db.Column(db.Integer, db.ForeignKey('meds.id'))
    med_name = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.now(), onupdate=db.func.now())
