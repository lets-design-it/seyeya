"""seed_roles_and_permissions

Revision ID: d6eb3e7bb961
Revises: 10bd8d8674ec
Create Date: 2026-06-24 22:51:30.761734

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd6eb3e7bb961'
down_revision = '10bd8d8674ec'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Seed roles
    op.execute("""
        INSERT INTO roles (role_name, description, is_system_role, is_active) VALUES
        ('Super Admin', 'Full control over all system modules, configurations, users, and roles.', True, True),
        ('Hotel Manager', 'Manages hotel accommodation, conferences, CRM, and financial reports.', False, True),
        ('Restaurant Manager', 'Manages restaurant operations, menus, kitchen staff, and reports.', False, True),
        ('Receptionist', 'Front desk staff managing guest check-ins, reservations, and general CRM view.', False, True),
        ('Kitchen Staff', 'Kitchen operators managing orders, preparations, and food status.', False, True),
        ('Waiter', 'Front-of-house staff taking restaurant orders and tracking billing.', False, True),
        ('Cashier', 'Billing staff handling restaurant order payments, cash registers, and refunds.', False, True)
        ON CONFLICT (role_name) DO NOTHING;
    """)

    # Map permissions for Super Admin (All permissions)
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Super Admin'
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)

    # Map permissions for Hotel Manager
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Hotel Manager'
          AND p.permission_key IN (
            'accommodation.view', 'accommodation.create', 'accommodation.edit', 'accommodation.checkin',
            'conference.view', 'conference.create', 'conference.edit',
            'payments.view', 'payments.approve', 'payments.refund',
            'reports.view', 'reports.export',
            'users.view', 'users.manage',
            'roles.view', 'roles.manage',
            'crm.view', 'crm.manage'
          )
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)

    # Map permissions for Restaurant Manager
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Restaurant Manager'
          AND p.permission_key IN (
            'restaurant.view', 'restaurant.create', 'restaurant.edit', 'restaurant.delete', 'restaurant.kitchen',
            'payments.view',
            'reports.view', 'reports.export',
            'crm.view'
          )
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)

    # Map permissions for Receptionist
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Receptionist'
          AND p.permission_key IN (
            'accommodation.view', 'accommodation.create', 'accommodation.edit', 'accommodation.checkin',
            'conference.view',
            'payments.view',
            'crm.view'
          )
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)

    # Map permissions for Kitchen Staff
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Kitchen Staff'
          AND p.permission_key IN (
            'restaurant.view', 'restaurant.kitchen'
          )
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)

    # Map permissions for Waiter
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Waiter'
          AND p.permission_key IN (
            'restaurant.view', 'restaurant.create', 'payments.view'
          )
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)

    # Map permissions for Cashier
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id
        FROM roles r, permissions p
        WHERE r.role_name = 'Cashier'
          AND p.permission_key IN (
            'restaurant.view', 'restaurant.create', 'payments.view', 'payments.approve', 'payments.refund'
          )
        ON CONFLICT ON CONSTRAINT uq_role_permission DO NOTHING;
    """)


def downgrade() -> None:
    # Delete seeded roles (cascades to role_permissions)
    op.execute("""
        DELETE FROM roles WHERE role_name IN (
            'Super Admin', 'Hotel Manager', 'Restaurant Manager', 'Receptionist', 'Kitchen Staff', 'Waiter', 'Cashier'
        );
    """)
