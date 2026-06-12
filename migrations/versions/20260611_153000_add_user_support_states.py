"""add user support states

Revision ID: 20260611153000
Revises: e418b9ce9a36
Create Date: 2026-06-11 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '20260611153000'
down_revision = 'e418b9ce9a36'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_support_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade():
    op.drop_table('user_support_states')
