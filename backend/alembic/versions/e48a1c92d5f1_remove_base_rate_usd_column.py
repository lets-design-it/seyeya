"""remove base_rate_usd column and enforce pure base_rate

Revision ID: e48a1c92d5f1
Revises: a12d97f9eb55
Create Date: 2026-08-31 18:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'e48a1c92d5f1'
down_revision = 'a12d97f9eb55'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    if 'room_categories' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('room_categories')]
        if 'base_rate_usd' in columns and 'base_rate' not in columns:
            op.alter_column('room_categories', 'base_rate_usd', new_column_name='base_rate')
        elif 'base_rate_usd' in columns and 'base_rate' in columns:
            op.drop_column('room_categories', 'base_rate_usd')
        elif 'base_rate' not in columns:
            op.add_column('room_categories', sa.Column('base_rate', sa.Numeric(10, 2), nullable=False, server_default='0.00'))


def downgrade() -> None:
    pass
