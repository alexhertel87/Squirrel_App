from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Med_List(db.Model, UserMixin):
    __tablename__ = 'med_list'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    med_name = db.Column(db.String(50), nullable=False)
    dosage_mg = db.Column(db.Numeric, nullable=False)
    frequency = db.Column(db.String(100), nullable=False)
    taken = db.Column(db.Boolean, nullable=False)
    med_info = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.now(), onupdate=db.func.now())

    user = relationship("User", backref=backref("med_list", uselist=False))
