# SEYEYA Database Schema Documentation

## Overview
The SEYEYA system uses PostgreSQL with a normalized relational schema supporting enterprise-grade booking operations.

## Database Connection
```
Host: localhost
Port: 5432
User: seyeya_user
Password: seyeya_password
Database: seyeya_db
```

## Table Relationships Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                        │
├─────────────────────────────────────────────────────────┤
│  users (1) ─── (M) user_roles ─── (M) roles            │
│    │               ↓                  ↓                  │
│    ├─── user_sessions              role_permissions     │
│    ├─── password_reset_tokens       │                    │
│    ├─── device_tokens               permissions          │
│    └─── activity_logs                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  CUSTOMER MANAGEMENT                     │
├─────────────────────────────────────────────────────────┤
│  customers (1) ─── (M) restaurant_orders               │
│    │               ├─── accommodation_reservations     │
│    │               ├─── conference_reservations        │
│    │               ├─── payments                        │
│    └─── customer_reviews                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  RESTAURANT MODULE                       │
├─────────────────────────────────────────────────────────┤
│  menu_categories (1) ─── (M) menu_items               │
│  menu_extras (M) ─── (M) order_items                   │
│  restaurant_orders (1) ─── (M) order_items            │
│    ├─── order_status_history                          │
│    └─── customer_reviews                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                ACCOMMODATION MODULE                      │
├─────────────────────────────────────────────────────────┤
│  room_categories (1) ─── (M) rooms                     │
│  rooms (1) ─── (M) accommodation_reservations         │
│    ├─── room_photos                                   │
│    └─── guest_checkin_details                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  CONFERENCE MODULE                       │
├─────────────────────────────────────────────────────────┤
│  conference_halls (1) ─── (M) conference_reservations │
│  conference_resources (M) ──┐                          │
│  conference_meal_packages (M)├─→ conference_*_bookings│
│    └─── hall_photos                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  PAYMENT MANAGEMENT                      │
├─────────────────────────────────────────────────────────┤
│  payments (1) ─── (M) payment_refunds                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              AUDIT & NOTIFICATIONS                       │
├─────────────────────────────────────────────────────────┤
│  audit_logs, activity_logs, login_logs                │
│  notification_templates ─── (M) notifications         │
└─────────────────────────────────────────────────────────┘
```

## Section 1: Authentication & RBAC

### users
User accounts and authentication
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone_number VARCHAR(20),
  password_hash VARCHAR(500) NOT NULL,
  gender VARCHAR(10),
  date_of_birth DATE,
  nationality VARCHAR(100),
  nin VARCHAR(20),
  passport_number VARCHAR(30),
  address VARCHAR(300),
  next_of_kin VARCHAR(200),
  next_of_kin_phone VARCHAR(20),
  avatar_url VARCHAR(500),
  is_staff BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_phone_number ON users(phone_number);
CREATE INDEX ix_users_nin ON users(nin);
```

### roles
Role definitions with hierarchy support
```sql
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(300),
  parent_role_id INTEGER REFERENCES roles(role_id),
  is_active BOOLEAN DEFAULT TRUE,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### permissions
System permissions
```sql
CREATE TABLE permissions (
  permission_id SERIAL PRIMARY KEY,
  permission_key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description VARCHAR(300),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### role_permissions
Role-permission mapping
```sql
CREATE TABLE role_permissions (
  role_permission_id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INTEGER REFERENCES users(user_id),
  UNIQUE(role_id, permission_id)
);
```

### user_roles
User-role assignment with expiry
```sql
CREATE TABLE user_roles (
  user_role_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(user_id),
  expires_at TIMESTAMP,
  UNIQUE(user_id, role_id)
);
```

### user_sessions
Active session management
```sql
CREATE TABLE user_sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  device_info VARCHAR(300),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP
);
```

### password_reset_tokens
Password reset token management
```sql
CREATE TABLE password_reset_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### device_tokens
Push notification device tokens
```sql
CREATE TABLE device_tokens (
  device_token_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, token)
);
```

## Section 2: CRM

### customers
Customer profiles supporting walk-in and registered customers
```sql
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  customer_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  gender VARCHAR(10),
  date_of_birth DATE,
  nationality VARCHAR(100),
  phone_number VARCHAR(20),
  email VARCHAR(150),
  address VARCHAR(300),
  passport_number VARCHAR(30),
  nin VARCHAR(20),
  next_of_kin VARCHAR(200),
  next_of_kin_phone VARCHAR(20),
  customer_type VARCHAR(20) DEFAULT 'Registered',
  company_name VARCHAR(200),
  is_contract_client BOOLEAN DEFAULT FALSE,
  contract_expiry DATE,
  total_spent DECIMAL(18,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_customers_phone_number ON customers(phone_number);
CREATE INDEX ix_customers_nin ON customers(nin);
CREATE INDEX ix_customers_passport_number ON customers(passport_number);
CREATE INDEX ix_customers_customer_type ON customers(customer_type);
```

## Section 3: Restaurant Module

### menu_categories
```sql
CREATE TABLE menu_categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(150) NOT NULL,
  description VARCHAR(300),
  image_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### menu_items
```sql
CREATE TABLE menu_items (
  menu_item_id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES menu_categories(category_id),
  item_name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  allergen_info VARCHAR(500),
  preparation_time INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### menu_extras
```sql
CREATE TABLE menu_extras (
  extra_id SERIAL PRIMARY KEY,
  extra_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### restaurant_orders
```sql
CREATE TABLE restaurant_orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  seating_location VARCHAR(20),
  delivery_option VARCHAR(20),
  delivery_address VARCHAR(300),
  delivery_lat DECIMAL(9,6),
  delivery_lng DECIMAL(9,6),
  delivery_charge DECIMAL(10,2) DEFAULT 0,
  preferred_time TIMESTAMP,
  special_instr VARCHAR(500),
  allergy_info VARCHAR(500),
  sub_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  order_status VARCHAR(20) DEFAULT 'Pending',
  payment_status VARCHAR(20) DEFAULT 'Pending',
  assigned_waiter INTEGER REFERENCES users(user_id),
  tracking_number VARCHAR(50) UNIQUE,
  cancelled_at TIMESTAMP,
  cancel_reason VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_restaurant_orders_customer_id ON restaurant_orders(customer_id);
CREATE INDEX ix_restaurant_orders_order_status ON restaurant_orders(order_status);
CREATE INDEX ix_restaurant_orders_created_at ON restaurant_orders(created_at);
```

### order_items
```sql
CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES restaurant_orders(order_id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(menu_item_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_notes VARCHAR(300)
);
```

### order_item_extras
```sql
CREATE TABLE order_item_extras (
  order_item_extra_id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id) ON DELETE CASCADE,
  extra_id INTEGER NOT NULL REFERENCES menu_extras(extra_id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);
```

### order_status_history
```sql
CREATE TABLE order_status_history (
  status_hist_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES restaurant_orders(order_id),
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER REFERENCES users(user_id),
  note VARCHAR(300),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Section 4: Accommodation Module

### room_categories
```sql
CREATE TABLE room_categories (
  room_category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  base_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### rooms
```sql
CREATE TABLE rooms (
  room_id SERIAL PRIMARY KEY,
  room_category_id INTEGER NOT NULL REFERENCES room_categories(room_category_id),
  room_number VARCHAR(20) NOT NULL UNIQUE,
  floor VARCHAR(10),
  room_status VARCHAR(20) DEFAULT 'Available',
  max_occupancy INTEGER DEFAULT 2,
  description VARCHAR(500),
  amenities VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### room_photos
```sql
CREATE TABLE room_photos (
  photo_id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  caption VARCHAR(200),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### accommodation_reservations
```sql
CREATE TABLE accommodation_reservations (
  reservation_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  room_id INTEGER NOT NULL REFERENCES rooms(room_id),
  reservation_code VARCHAR(20) NOT NULL UNIQUE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_nights INTEGER NOT NULL,
  rate_per_night DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  reservation_status VARCHAR(20) DEFAULT 'Pending',
  payment_status VARCHAR(20) DEFAULT 'Pending',
  is_contract_booking BOOLEAN DEFAULT FALSE,
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  special_requests VARCHAR(500),
  check_in_actual TIMESTAMP,
  check_out_actual TIMESTAMP,
  checked_in_by INTEGER REFERENCES users(user_id),
  checked_out_by INTEGER REFERENCES users(user_id),
  cancelled_at TIMESTAMP,
  cancel_reason VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_accommodation_reservations_customer_id ON accommodation_reservations(customer_id);
CREATE INDEX ix_accommodation_reservations_room_id ON accommodation_reservations(room_id);
CREATE INDEX ix_accommodation_reservations_check_in_date ON accommodation_reservations(check_in_date);
CREATE INDEX ix_accommodation_reservations_check_out_date ON accommodation_reservations(check_out_date);
CREATE INDEX ix_accommodation_reservations_status ON accommodation_reservations(reservation_status);
```

### guest_checkin_details
```sql
CREATE TABLE guest_checkin_details (
  checkin_detail_id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES accommodation_reservations(reservation_id),
  guest_name VARCHAR(200) NOT NULL,
  nationality VARCHAR(100),
  phone_number VARCHAR(20),
  next_of_kin VARCHAR(200),
  next_of_kin_phone VARCHAR(20),
  passport_number VARCHAR(30),
  nin VARCHAR(20),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Section 5: Conference Module

### conference_halls
```sql
CREATE TABLE conference_halls (
  hall_id SERIAL PRIMARY KEY,
  hall_name VARCHAR(150) NOT NULL,
  capacity INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2),
  full_day_rate DECIMAL(10,2),
  half_day_rate DECIMAL(10,2),
  description VARCHAR(500),
  amenities VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### conference_resources
```sql
CREATE TABLE conference_resources (
  resource_id SERIAL PRIMARY KEY,
  resource_name VARCHAR(100) NOT NULL,
  daily_rate DECIMAL(10,2) DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### conference_meal_packages
```sql
CREATE TABLE conference_meal_packages (
  package_id SERIAL PRIMARY KEY,
  package_name VARCHAR(150) NOT NULL,
  description VARCHAR(500),
  price_per_person DECIMAL(10,2) NOT NULL,
  min_participants INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### conference_reservations
```sql
CREATE TABLE conference_reservations (
  conference_res_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  hall_id INTEGER NOT NULL REFERENCES conference_halls(hall_id),
  reservation_code VARCHAR(20) NOT NULL UNIQUE,
  event_name VARCHAR(200),
  event_start_date DATE NOT NULL,
  event_end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  num_participants INTEGER,
  booking_type VARCHAR(20),
  hall_cost DECIMAL(10,2) DEFAULT 0,
  resource_cost DECIMAL(10,2) DEFAULT 0,
  meal_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  reservation_status VARCHAR(20) DEFAULT 'Pending',
  payment_status VARCHAR(20) DEFAULT 'Pending',
  special_requests VARCHAR(500),
  cancelled_at TIMESTAMP,
  cancel_reason VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_conference_reservations_customer_id ON conference_reservations(customer_id);
CREATE INDEX ix_conference_reservations_hall_id ON conference_reservations(hall_id);
CREATE INDEX ix_conference_reservations_event_start_date ON conference_reservations(event_start_date);
CREATE INDEX ix_conference_reservations_event_end_date ON conference_reservations(event_end_date);
```

## Section 6: Payments

### payments
Polymorphic payment handling with validation
```sql
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  payment_type VARCHAR(30) NOT NULL,
  reference_id INTEGER NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  transaction_id VARCHAR(100),
  payment_reference VARCHAR(100) NOT NULL UNIQUE,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'UGX',
  payment_status VARCHAR(20) DEFAULT 'Pending',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deposit BOOLEAN DEFAULT FALSE,
  deposit_percent DECIMAL(5,2),
  bank_slip_url VARCHAR(500),
  verified_by INTEGER REFERENCES users(user_id),
  verified_at TIMESTAMP,
  verification_note VARCHAR(300),
  gateway_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_payments_customer_id ON payments(customer_id);
CREATE INDEX ix_payments_reference_id ON payments(reference_id);
CREATE INDEX ix_payments_payment_date ON payments(payment_date);
CREATE INDEX ix_payments_payment_status ON payments(payment_status);
```

### payment_refunds
```sql
CREATE TABLE payment_refunds (
  refund_id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(payment_id),
  refund_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(300),
  processed_by INTEGER REFERENCES users(user_id),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'Pending'
);
```

## Section 7: Notifications

### notification_events
```sql
CREATE TABLE notification_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  reference_type VARCHAR(100),
  reference_id VARCHAR(100),
  triggered_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX ix_notification_events_event_type ON notification_events(event_type);
```

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES notification_events(id) ON DELETE SET NULL,
  recipient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
  status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITHOUT TIME ZONE,
  action_url VARCHAR(255),
  reference_type VARCHAR(100),
  reference_id VARCHAR(100),
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX ix_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX ix_notifications_status ON notifications(status);
```

### email_queue
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX ix_email_queue_status ON email_queue(status);
```

### notification_preferences
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reservation_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  order_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  payment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  security_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  system_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX ix_notification_preferences_user_id ON notification_preferences(user_id);
```

## Section 8: Audit & Security

### audit_logs
```sql
CREATE TABLE audit_logs (
  audit_id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER,
  action VARCHAR(10) NOT NULL,
  old_values TEXT,
  new_values TEXT,
  changed_by INTEGER REFERENCES users(user_id),
  ip_address VARCHAR(50),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_audit_logs_table_name ON audit_logs(table_name, record_id);
CREATE INDEX ix_audit_logs_changed_at ON audit_logs(changed_at);
```

### activity_logs
```sql
CREATE TABLE activity_logs (
  activity_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  activity_type VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  reference_table VARCHAR(100),
  reference_id INTEGER,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### login_logs
```sql
CREATE TABLE login_logs (
  login_log_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  email VARCHAR(150),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  device_info VARCHAR(300),
  login_status VARCHAR(20) NOT NULL,
  failure_reason VARCHAR(200),
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_login_logs_user_id ON login_logs(user_id);
CREATE INDEX ix_login_logs_attempted_at ON login_logs(attempted_at);
```

### customer_reviews
```sql
CREATE TABLE customer_reviews (
  review_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  review_type VARCHAR(20),
  reference_id INTEGER,
  rating INTEGER NOT NULL,
  comment VARCHAR(1000),
  management_reply VARCHAR(1000),
  replied_by INTEGER REFERENCES users(user_id),
  replied_at TIMESTAMP,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Integrity Rules

### Constraints
- Email must be unique (users)
- Customer code must be unique
- Order number must be unique and sequenced
- All reservation codes must be unique
- Payment reference must be unique
- Primary keys auto-increment
- Foreign key cascades where appropriate

### Validation
- Check: Rating between 1-5
- Check: Dates are in correct chronological order
- NOT NULL: All critical fields
- Decimal precision: (18,2) for amounts

## Performance Indexes

All critical queries are optimized with indexes on:
- Foreign key columns
- Frequently searched fields (email, phone)
- Status columns
- Date columns for range queries
- Composite indexes for complex queries

## Backup Strategy

Regular backups recommended:
```bash
pg_dump -U seyeya_user seyeya_db > seyeya_db.sql

# Restore
psql -U seyeya_user seyeya_db < seyeya_db.sql
```
