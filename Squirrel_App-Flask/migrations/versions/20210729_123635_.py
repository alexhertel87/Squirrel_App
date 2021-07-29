"""empty message

Revision ID: 66a335466902
Revises: 
Create Date: 2021-07-29 12:36:35.697253

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '66a335466902'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=40), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('username')
    )
    op.create_table('active_tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('task_name', sa.String(length=100), nullable=False),
    sa.Column('due_date_1', sa.DateTime(timezone=True), nullable=False),
    sa.Column('due_date_2', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('task_name')
    )
    op.create_table('meds_list',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('med_name', sa.String(length=50), nullable=False),
    sa.Column('dosage_mg', sa.Integer(), nullable=False),
    sa.Column('frequency', sa.String(length=100), nullable=False),
    sa.Column('taken', sa.Boolean(), nullable=True),
    sa.Column('med_info', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('dosage_mg'),
    sa.UniqueConstraint('med_name')
    )
    op.create_table('completed_tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=True),
    sa.Column('task_name', sa.String(length=100), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['task_id'], ['active_tasks.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('task_name')
    )
    op.create_table('meds_log',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('med_id', sa.Integer(), nullable=True),
    sa.Column('med_name', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['med_id'], ['meds_list.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('med_name')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('meds_log')
    op.drop_table('completed_tasks')
    op.drop_table('meds_list')
    op.drop_table('active_tasks')
    op.drop_table('users')
    # ### end Alembic commands ###
