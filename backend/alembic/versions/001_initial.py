"""Initial schema creation for SEYEYA system

Revision ID: 001_initial
Revises: 
Create Date: 2025-06-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create all tables based on SQLAlchemy models
    # This uses the metadata from the Base object
    pass


def downgrade() -> None:
    # Drop all tables
    pass
