"""create_notification_event_and_queue_tables

Revision ID: 028e4136770f
Revises: 8713093bef42
Create Date: 2026-07-15 08:45:40.815829

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '028e4136770f'
down_revision = '8713093bef42'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop existing notifications table and templates table first to avoid type mismatch (Integer vs UUID)
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
    op.execute("DROP TABLE IF EXISTS notification_templates CASCADE")
    
    # 2. Create the new tables
    op.create_table('notification_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.String(length=50), nullable=True),
        sa.Column('triggered_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('event_id', sa.UUID(), nullable=True),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=True),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('action_url', sa.String(length=300), nullable=True),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.String(length=50), nullable=True),
        sa.Column('email_sent', sa.Boolean(), nullable=True),
        sa.Column('email_sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['notification_events.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'], unique=False)
    op.create_index('ix_notifications_event_id', 'notifications', ['event_id'], unique=False)
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'], unique=False)
    op.create_index('ix_notifications_recipient_id', 'notifications', ['recipient_id'], unique=False)
    op.create_index('ix_notifications_status', 'notifications', ['status'], unique=False)

    op.create_table('notification_preferences',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_enabled', sa.Boolean(), nullable=True),
        sa.Column('in_app_enabled', sa.Boolean(), nullable=True),
        sa.Column('reservation_notifications', sa.Boolean(), nullable=True),
        sa.Column('order_notifications', sa.Boolean(), nullable=True),
        sa.Column('payment_notifications', sa.Boolean(), nullable=True),
        sa.Column('security_notifications', sa.Boolean(), nullable=True),
        sa.Column('marketing_notifications', sa.Boolean(), nullable=True),
        sa.Column('system_notifications', sa.Boolean(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    op.create_table('email_queue',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('notification_id', sa.UUID(), nullable=True),
        sa.Column('recipient_email', sa.String(length=255), nullable=False),
        sa.Column('recipient_name', sa.String(length=255), nullable=True),
        sa.Column('subject', sa.String(length=300), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('email_queue')
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
    op.drop_table('notification_events')
    
    # Recreate the old schema
    op.create_table('notification_templates',
        sa.Column('template_id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('template_name', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.Column('subject', sa.VARCHAR(length=300), autoincrement=False, nullable=True),
        sa.Column('body_template', sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column('channel', sa.VARCHAR(length=20), autoincrement=False, nullable=True),
        sa.Column('is_active', sa.BOOLEAN(), autoincrement=False, nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint('template_id', name='notification_templates_pkey'),
        sa.UniqueConstraint('template_name', name='notification_templates_template_name_key')
    )
    
    op.create_table('notifications',
        sa.Column('notification_id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('customer_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column('template_id', sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column('notification_type', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
        sa.Column('channel', sa.VARCHAR(length=20), autoincrement=False, nullable=False),
        sa.Column('title', sa.VARCHAR(length=300), autoincrement=False, nullable=True),
        sa.Column('body', sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column('recipient_address', sa.VARCHAR(length=300), autoincrement=False, nullable=True),
        sa.Column('sent_status', sa.VARCHAR(length=20), autoincrement=False, nullable=True),
        sa.Column('delivery_status', sa.VARCHAR(length=20), autoincrement=False, nullable=True),
        sa.Column('read_status', sa.BOOLEAN(), autoincrement=False, nullable=True),
        sa.Column('read_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
        sa.Column('sent_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
        sa.Column('provider_response', sa.TEXT(), autoincrement=False, nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], name='notifications_customer_id_fkey'),
        sa.ForeignKeyConstraint(['template_id'], ['notification_templates.template_id'], name='notifications_template_id_fkey'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='notifications_user_id_fkey'),
        sa.PrimaryKeyConstraint('notification_id', name='notifications_pkey')
    )
