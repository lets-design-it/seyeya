"""add missing conference reservation columns

Revision ID: 3fe244ee22ca
Revises: 3a6eff8a2b5d
Create Date: 2026-09-14 06:00:56.376812

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3fe244ee22ca'
down_revision = '3a6eff8a2b5d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('conference_reservations', sa.Column('payment_responsibility', sa.String(length=50), server_default='Individual', nullable=True))
    op.add_column('conference_reservations', sa.Column('hall_unit_price', sa.DECIMAL(precision=10, scale=2), server_default='0', nullable=True))
    op.add_column('conference_reservations', sa.Column('subtotal', sa.DECIMAL(precision=10, scale=2), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('conference_reservations', 'subtotal')
    op.drop_column('conference_reservations', 'hall_unit_price')
    op.drop_column('conference_reservations', 'payment_responsibility')
