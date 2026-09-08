"""add_room_category_id_to_reservations

Revision ID: fd91284a1209
Revises: fac880534254
Create Date: 2026-09-08 16:31:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fd91284a1209'
down_revision = 'fac880534254'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('accommodation_reservations', 'room_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.add_column('accommodation_reservations', sa.Column('room_category_id', sa.Integer(), sa.ForeignKey('room_categories.room_category_id', ondelete='SET NULL'), nullable=True))


def downgrade():
    op.drop_column('accommodation_reservations', 'room_category_id')
    op.alter_column('accommodation_reservations', 'room_id',
               existing_type=sa.INTEGER(),
               nullable=False)
