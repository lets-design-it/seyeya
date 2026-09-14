"""remove amenities from hall

Revision ID: 3a6eff8a2b5d
Revises: 919d550d2a14
Create Date: 2026-09-14 05:44:57.346089

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a6eff8a2b5d'
down_revision = '919d550d2a14'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('conference_halls', 'amenities')


def downgrade() -> None:
    op.add_column('conference_halls', sa.Column('amenities', sa.String(500), nullable=True))
