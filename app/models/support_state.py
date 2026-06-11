import json

from sqlalchemy.orm import relationship

from .db import db


class UserSupportState(db.Model):
    __tablename__ = 'user_support_states'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    data = db.Column(db.Text, nullable=False, default='{}')
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=db.func.now(),
        onupdate=db.func.now())

    user = relationship("User", back_populates="support_state")

    def to_dict(self):
        try:
            data = json.loads(self.data or '{}')
        except json.JSONDecodeError:
            data = {}

        return {
            'id': self.id,
            'user_id': self.user_id,
            'data': data,
        }

    def set_data(self, data):
        self.data = json.dumps(data or {})
