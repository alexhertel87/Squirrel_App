from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Meds_Log(db.Model, UserMixin):
    __tablename__ = 'meds_log'

    id = db.Column(db.Integer, primary_key=True)
    med_id = db.Column(db.Integer, db.ForeignKey('meds_list.id'))
    med_name = db.Column(db.String(50), nullable=False, unique=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now(), onupdate=db.func.now())

    meds_logged = relationship('Meds_List', back_populates="meds_taken")
