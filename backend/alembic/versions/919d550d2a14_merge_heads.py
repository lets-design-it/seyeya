"""merge heads

Revision ID: 919d550d2a14
Revises: e48a1c92d5f1, fd91284a1209
Create Date: 2026-09-11 17:25:06.174901

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '919d550d2a14'
down_revision = ('e48a1c92d5f1', 'fd91284a1209')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
