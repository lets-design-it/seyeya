"""add customer profile fields

Revision ID: 7b3d2f4e8a98
Revises: 6c9f4a2d31b7
Create Date: 2026-06-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '7b3d2f4e8a98'
down_revision = '6c9f4a2d31b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('customers', sa.Column('email', sa.String(length=150), nullable=True))
    op.add_column('customers', sa.Column('gender', sa.String(length=20), nullable=True))
    op.add_column('customers', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('customers', sa.Column('nationality', sa.String(length=100), nullable=True))
    op.add_column('customers', sa.Column('address', sa.String(length=300), nullable=True))
    op.add_column('customers', sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')))
    op.create_index('ix_customers_email', 'customers', ['email'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_customers_email', table_name='customers')
    op.drop_column('customers', 'is_active')
    op.drop_column('customers', 'address')
    op.drop_column('customers', 'nationality')
    op.drop_column('customers', 'date_of_birth')
    op.drop_column('customers', 'gender')
    op.drop_column('customers', 'email')
