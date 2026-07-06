"""increase_customer_code_length_to_100

Revision ID: aff1fdec6b39
Revises: d6eb3e7bb961
Create Date: 2026-06-24 23:16:02.981545

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aff1fdec6b39'
down_revision = 'd6eb3e7bb961'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('customers', 'customer_code',
               existing_type=sa.VARCHAR(length=20),
               type_=sa.String(length=100),
               existing_nullable=False)


def downgrade() -> None:
    op.alter_column('customers', 'customer_code',
               existing_type=sa.String(length=100),
               type_=sa.VARCHAR(length=20),
               existing_nullable=False)
