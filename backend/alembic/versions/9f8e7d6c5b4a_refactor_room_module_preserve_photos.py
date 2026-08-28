"""refactor room module preserve photos

Revision ID: 9f8e7d6c5b4a
Revises: beedfa1986e5
Create Date: 2026-07-31 14:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = '9f8e7d6c5b4a'
down_revision = 'beedfa1986e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    tables = inspector.get_table_names()

    # 1. Handle room_photos -> room_images table rename / creation
    if 'room_photos' in tables and 'room_images' not in tables:
        op.rename_table('room_photos', 'room_images')
        tables.remove('room_photos')
        tables.append('room_images')

    if 'room_images' in tables:
        columns = [c['name'] for c in inspector.get_columns('room_images')]
        if 'photo_url' in columns and 'image_url' not in columns:
            op.alter_column('room_images', 'photo_url', new_column_name='image_url')
        if 'photo_id' in columns and 'id' not in columns:
            op.alter_column('room_images', 'photo_id', new_column_name='id')
        if 'display_order' not in columns:
            op.add_column('room_images', sa.Column('display_order', sa.Integer(), nullable=True, server_default='0'))
        if 'is_primary' not in columns:
            op.add_column('room_images', sa.Column('is_primary', sa.Boolean(), nullable=True, server_default='false'))
    else:
        op.create_table(
            'room_images',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.room_id', ondelete='CASCADE'), nullable=False),
            sa.Column('image_url', sa.String(length=500), nullable=False),
            sa.Column('display_order', sa.Integer(), server_default='0'),
            sa.Column('is_primary', sa.Boolean(), server_default='false'),
            sa.Column('caption', sa.String(length=200), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
        )

    # 2. Add new columns to rooms table
    if 'rooms' in tables:
        columns = [c['name'] for c in inspector.get_columns('rooms')]
        if 'room_name' not in columns:
            op.add_column('rooms', sa.Column('room_name', sa.String(length=150), nullable=True))
        if 'building' not in columns:
            op.add_column('rooms', sa.Column('building', sa.String(length=100), nullable=True))
        if 'wing' not in columns:
            op.add_column('rooms', sa.Column('wing', sa.String(length=100), nullable=True))
        if 'floor' not in columns:
            op.add_column('rooms', sa.Column('floor', sa.String(length=50), nullable=True))
        if 'room_size' not in columns:
            op.add_column('rooms', sa.Column('room_size', sa.Float(), nullable=True))
        if 'room_size_unit' not in columns:
            op.add_column('rooms', sa.Column('room_size_unit', sa.String(length=20), server_default='m²', nullable=True))

    # 3. Create child tables if not existing
    if 'room_beds' not in tables:
        op.create_table(
            'room_beds',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.room_id', ondelete='CASCADE'), nullable=False),
            sa.Column('bed_type', sa.String(length=100), nullable=False),
            sa.Column('quantity', sa.Integer(), server_default='1')
        )

    if 'room_views' not in tables:
        op.create_table(
            'room_views',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.room_id', ondelete='CASCADE'), nullable=False),
            sa.Column('view_name', sa.String(length=100), nullable=False)
        )

    if 'room_bathroom_features' not in tables:
        op.create_table(
            'room_bathroom_features',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.room_id', ondelete='CASCADE'), nullable=False),
            sa.Column('feature_name', sa.String(length=100), nullable=False)
        )

    if 'room_facilities' not in tables:
        op.create_table(
            'room_facilities',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.room_id', ondelete='CASCADE'), nullable=False),
            sa.Column('facility_name', sa.String(length=100), nullable=False)
        )


def downgrade() -> None:
    pass
