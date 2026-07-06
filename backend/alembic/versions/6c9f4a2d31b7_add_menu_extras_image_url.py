"""add image_url to menu_extras

Revision ID: 6c9f4a2d31b7
Revises: 33755c0fc12d
Create Date: 2026-06-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '6c9f4a2d31b7'
down_revision = '33755c0fc12d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('menu_extras', sa.Column('image_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('menu_extras', 'image_url')
