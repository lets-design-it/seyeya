"""add_seyeya_pay_transaction_tracking

Revision ID: 4b8d2c9fe2a1
Revises: 367c1d291b65
Create Date: 2026-11-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4b8d2c9fe2a1'
down_revision = '367c1d291b65'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if 'payment_transactions' not in existing_tables:
        op.create_table(
            'payment_transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('external_id', sa.String(length=120), nullable=False),
            sa.Column('provider', sa.String(length=50), nullable=False, server_default='seyeya_pay'),
            sa.Column('provider_payment_id', sa.String(length=120), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('customer_id', sa.Integer(), nullable=True),
            sa.Column('payment_id', sa.Integer(), nullable=True),
            sa.Column('payment_method', sa.String(length=50), nullable=False, server_default='mobile_money'),
            sa.Column('amount', sa.DECIMAL(precision=18, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=5), nullable=False, server_default='UGX'),
            sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
            sa.Column('provider_response', sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
            sa.Column('failure_reason', sa.String(length=300), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('confirmed_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['customer_id'], ['customers.customer_id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['payment_id'], ['payments.payment_id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('external_id', name='uq_payment_transactions_external_id'),
            sa.UniqueConstraint('provider', 'provider_payment_id', name='uq_provider_payment_id'),
        )
        op.create_index('ix_payment_transactions_customer_id', 'payment_transactions', ['customer_id'], unique=False)
        op.create_index('ix_payment_transactions_provider_payment_id', 'payment_transactions', ['provider_payment_id'], unique=False)
        op.create_index('ix_payment_transactions_status', 'payment_transactions', ['status'], unique=False)
        op.create_index('ix_payment_transactions_user_id', 'payment_transactions', ['user_id'], unique=False)

    if 'payment_webhook_events' not in existing_tables:
        op.create_table(
            'payment_webhook_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('provider', sa.String(length=50), nullable=False, server_default='seyeya_pay'),
            sa.Column('event_reference', sa.String(length=150), nullable=False),
            sa.Column('event_type', sa.String(length=80), nullable=False),
            sa.Column('payload', sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
            sa.Column('signature_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
            sa.Column('processing_status', sa.String(length=30), nullable=False, server_default='received'),
            sa.Column('received_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('processed_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider', 'event_reference', name='uq_payment_webhook_provider_event'),
        )
        op.create_index('ix_payment_webhook_event_type', 'payment_webhook_events', ['event_type'], unique=False)
        op.create_index('ix_payment_webhook_provider', 'payment_webhook_events', ['provider'], unique=False)
        op.create_index('ix_payment_webhook_received_at', 'payment_webhook_events', ['received_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_payment_webhook_received_at', table_name='payment_webhook_events')
    op.drop_index('ix_payment_webhook_provider', table_name='payment_webhook_events')
    op.drop_index('ix_payment_webhook_event_type', table_name='payment_webhook_events')
    op.drop_table('payment_webhook_events')

    op.drop_index('ix_payment_transactions_user_id', table_name='payment_transactions')
    op.drop_index('ix_payment_transactions_status', table_name='payment_transactions')
    op.drop_index('ix_payment_transactions_provider_payment_id', table_name='payment_transactions')
    op.drop_index('ix_payment_transactions_customer_id', table_name='payment_transactions')
    op.drop_table('payment_transactions')
