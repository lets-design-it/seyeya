"""categorize_conference_facilities_add_hall_image

Revision ID: 367c1d291b65
Revises: 3fe244ee22ca
Create Date: 2026-09-14 10:32:30.235375

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '367c1d291b65'
down_revision = '3fe244ee22ca'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create conference_facility_categories table
    op.create_table(
        'conference_facility_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('icon_name', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 2. Add category_id to conference_facilities
    op.add_column('conference_facilities', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_conference_facilities_category_id',
        'conference_facilities',
        'conference_facility_categories',
        ['category_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # 3. Data Migration: Extract unique categories, insert them, and update category_id
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT DISTINCT category FROM conference_facilities WHERE category IS NOT NULL"))
    categories = [row[0] for row in result]
    
    for cat_name in categories:
        if not cat_name:
            continue
        # Insert category
        res = conn.execute(
            sa.text("INSERT INTO conference_facility_categories (name, is_active, created_at, icon_name) VALUES (:name, true, CURRENT_TIMESTAMP, 'Folder') RETURNING id"),
            {"name": cat_name}
        )
        cat_id = res.fetchone()[0]
        # Update facilities
        conn.execute(
            sa.text("UPDATE conference_facilities SET category_id = :cat_id WHERE category = :cat_name"),
            {"cat_id": cat_id, "cat_name": cat_name}
        )

    # 4. Drop the old category column
    op.drop_column('conference_facilities', 'category')

    # 5. Add image to conference_halls
    op.add_column('conference_halls', sa.Column('image', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # 1. Remove image from conference_halls
    op.drop_column('conference_halls', 'image')
    
    # 2. Add old category column back
    op.add_column('conference_facilities', sa.Column('category', sa.String(length=100), nullable=True))

    # 3. Data Migration: Restore category string
    conn = op.get_bind()
    conn.execute(sa.text('''
        UPDATE conference_facilities
        SET category = (
            SELECT name 
            FROM conference_facility_categories 
            WHERE conference_facility_categories.id = conference_facilities.category_id
        )
    '''))
    
    # Set default for newly null categories
    conn.execute(sa.text("UPDATE conference_facilities SET category = 'General Services' WHERE category IS NULL"))

    # 4. Drop category_id and foreign key
    op.drop_constraint('fk_conference_facilities_category_id', 'conference_facilities', type_='foreignkey')
    op.drop_column('conference_facilities', 'category_id')

    # 5. Drop table
    op.drop_table('conference_facility_categories')
