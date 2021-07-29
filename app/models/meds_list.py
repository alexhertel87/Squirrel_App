from sqlalchemy.orm import backref, relationship
from .db import db
from flask_login import UserMixin

class Meds_List(db.Model, UserMixin):
    __tablename__ = 'meds_list'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    med_name = db.Column(db.String(50), nullable=False, unique=True)
    dosage_mg = db.Column(db.Integer, nullable=False, unique=True)
    frequency = db.Column(db.String(100), nullable=False)
    taken = db.Column(db.Boolean, nullable=True)
    med_info = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now(), onupdate=db.func.now())

    user = relationship("User", back_populates="meds_list")
    meds_taken = relationship("Meds_Log", back_populates="meds_logged")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'med_name': self.med_name,
            'dosage_mg': self.dosage_mg,
            'frequency': self.frequency,
            'taken': self.taken,
            'med_info': self.med_info,
            'meds_taken': self.meds_taken.to_dict(),
            'user': self.user.to_dict()
        }
