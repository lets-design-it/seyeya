# SEYEYA Courts - Setup & Deployment Guide

## System Overview
SEYEYA Courts Integrated Booking & Reservation System is a complete backend solution for managing:
- Restaurant ordering system
- Accommodation bookings
- Conference hall reservations
- Payment processing
- Customer relationship management (CRM)
- Role-based access control (RBAC)
- Audit logging and notifications

## Technology Stack
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 13+
- **ORM**: SQLAlchemy 2.x (async)
- **Auth**: JWT with bcrypt
- **Job Queue**: Celery + Redis
- **Migrations**: Alembic

## Prerequisites

### System Requirements
- Python 3.11 or higher
- PostgreSQL 13 or higher
- Redis 6.0 or higher
- 2GB RAM minimum
- 5GB disk space

### Installation Steps

#### 1. Set Up PostgreSQL Database

```bash
# Create database and user
sudo -u postgres psql

# In PostgreSQL console:
CREATE USER seyeya_user WITH PASSWORD 'seyeya_password';
CREATE DATABASE seyeya_db OWNER seyeya_user;
ALTER ROLE seyeya_user SET client_encoding TO 'utf8';
ALTER ROLE seyeya_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE seyeya_user SET default_transaction_deferrable TO on;
ALTER ROLE seyeya_user SET default_transaction_read_only TO off;
ALTER USER seyeya_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE seyeya_db TO seyeya_user;
\q
```

##### Alternative: Cloud PostgreSQL Setup with Neon

If you prefer a cloud-hosted database, you can use **Neon**:
1. Sign up on [Neon.tech](https://neon.tech/) and create a new PostgreSQL project.
2. Retrieve the connection string from the dashboard.
3. Add the connection strings directly to your `.env` file (e.g. `DATABASE_URL` and `DATABASE_SYNC_URL`).
   ```env
   DATABASE_URL=postgresql+asyncpg://alex:AbC123dEf@ep-cool-flower-a576yd.us-east-2.aws.neon.tech/neondb?ssl=require
   DATABASE_SYNC_URL=postgresql://alex:AbC123dEf@ep-cool-flower-a576yd.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *Note: If you copy-paste the standard Neon connection string (starts with `postgres://` and contains `sslmode=require`), the backend automatically transforms the driver schema and parameters correctly.*


#### 2. Install Redis

```bash
# On Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### 3. Set Up Python Environment

```bash
# Navigate to backend directory
cd /home/heinrich/Documents/seyeya/seyeya/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
nano .env

# Key variables to update:
# DATABASE_URL=postgresql+asyncpg://seyeya_user:seyeya_password@localhost:5432/seyeya_db
# SECRET_KEY=your-very-secret-key-change-this
# REDIS_URL=redis://localhost:6379/0
```

#### 5. Initialize Database

```bash
# Create database schema
alembic upgrade head

# Seed initial data (if needed)
python -c "from app.db.database import engine; from app.models import Base; import asyncio; asyncio.run(Base.metadata.create_all(bind=engine))"
```

#### 6. Run the Application

```bash
# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Or use the run command
python -m uvicorn app.main:app --reload
```

#### 7. Start Celery Worker (Optional)

```bash
# In a separate terminal
celery -A app.tasks worker -l info
```

## API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Restaurant Module
- `GET /api/v1/restaurant/menu/categories` - List menu categories
- `GET /api/v1/restaurant/menu/categories/{id}/items` - Get items in category
- `POST /api/v1/restaurant/orders` - Create order
- `GET /api/v1/restaurant/orders/{id}` - Get order details
- `PATCH /api/v1/restaurant/orders/{id}` - Update order status
- `POST /api/v1/restaurant/orders/{id}/reviews` - Add review

### Accommodation Module
- `GET /api/v1/accommodation/rooms` - List available rooms
- `GET /api/v1/accommodation/rooms/{id}` - Get room details
- `POST /api/v1/accommodation/reservations` - Create reservation
- `GET /api/v1/accommodation/reservations/{id}` - Get reservation details
- `PATCH /api/v1/accommodation/reservations/{id}` - Update reservation
- `POST /api/v1/accommodation/reservations/{id}/checkin` - Check in
- `POST /api/v1/accommodation/reservations/{id}/checkout` - Check out

### Conference Module
- `GET /api/v1/conference/halls` - List conference halls
- `GET /api/v1/conference/resources` - List resources
- `GET /api/v1/conference/meal-packages` - List meal packages
- `POST /api/v1/conference/reservations` - Create reservation
- `GET /api/v1/conference/reservations/{id}` - Get reservation
- `PATCH /api/v1/conference/reservations/{id}` - Update reservation

### Payments
- `POST /api/v1/payments/` - Create payment
- `GET /api/v1/payments/{id}` - Get payment details
- `POST /api/v1/payments/{id}/verify` - Verify payment (admin)

### CRM
- `POST /api/v1/crm/customers` - Create customer
- `GET /api/v1/crm/customers/{id}` - Get customer
- `GET /api/v1/crm/customers/lookup/{identifier}` - Lookup by NIN/Passport/Phone
- `PATCH /api/v1/crm/customers/{id}` - Update customer

## Example API Requests

### Register User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+256701234567",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!"
  }'
```

### Login User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Create Restaurant Order
```bash
curl -X POST "http://localhost:8000/api/v1/restaurant/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "customer_id": 1,
    "delivery_option": "Remote",
    "delivery_address": "123 Main Street",
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 2,
        "special_notes": "No onions"
      }
    ]
  }'
```

### Create Accommodation Reservation
```bash
curl -X POST "http://localhost:8000/api/v1/accommodation/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "customer_id": 1,
    "room_id": 5,
    "check_in_date": "2025-06-20",
    "check_out_date": "2025-06-25",
    "num_adults": 2,
    "num_children": 1,
    "special_requests": "High floor preferred"
  }'
```

### Create Payment
```bash
curl -X POST "http://localhost:8000/api/v1/payments/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "payment_type": "RestaurantOrder",
    "reference_id": 1,
    "payment_method": "MobileMoney",
    "amount_paid": 50000,
    "is_deposit": false
  }'
```

## Database Schema

The system uses PostgreSQL with the following main tables:

### Authentication & RBAC
- `users` - User accounts
- `roles` - User roles
- `permissions` - System permissions
- `role_permissions` - Role-permission mappings
- `user_roles` - User-role assignments
- `user_sessions` - Active sessions
- `password_reset_tokens` - Password reset requests

### CRM
- `customers` - Customer profiles

### Restaurant
- `menu_categories` - Menu categories
- `menu_items` - Menu items
- `menu_extras` - Item add-ons
- `restaurant_orders` - Orders
- `order_items` - Order line items
- `order_item_extras` - Extras added to items
- `order_status_history` - Order status changes
- `customer_reviews` - Reviews

### Accommodation
- `room_categories` - Room types
- `rooms` - Individual rooms
- `room_photos` - Room images
- `accommodation_reservations` - Room bookings
- `guest_checkin_details` - Guest information

### Conference
- `conference_halls` - Hall details
- `conference_resources` - Equipment/resources
- `conference_meal_packages` - Meal options
- `conference_reservations` - Hall bookings
- `conference_resource_bookings` - Resource allocations
- `conference_meal_bookings` - Meal orders

### Payments
- `payments` - Payment records
- `payment_refunds` - Refund records

### Notifications
- `notification_templates` - Email/SMS templates
- `notifications` - Sent notifications

### Audit
- `audit_logs` - Database changes
- `activity_logs` - User activities
- `login_logs` - Login attempts

## Troubleshooting

### Database Connection Error
```
Error: could not connect to server: Connection refused
```
Solution: Ensure PostgreSQL is running:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Redis Connection Error
```
Error: ConnectionRefusedError: [Errno 111] Connection refused
```
Solution: Start Redis:
```bash
redis-server
# Or on systemd systems:
sudo systemctl start redis-server
```

### Port Already in Use
```
OSError: [Errno 48] Address already in use
```
Solution: Use different port:
```bash
uvicorn app.main:app --port 8001
```

### Virtual Environment Issues
```bash
# Deactivate and reactivate
deactivate
source venv/bin/activate

# Or create new venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Production Deployment

### Environment Variables for Production
Update `.env`:
```
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=<use-strong-random-key>
ALGORITHM=HS256
DATABASE_URL=postgresql+asyncpg://user:pass@db-host/dbname
REDIS_URL=redis://redis-host:6379/0
CELERY_BROKER_URL=redis://redis-host:6379/0
```

### Using Gunicorn with Uvicorn Workers
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker (Optional)
Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t seyeya-backend .
docker run -p 8000:8000 seyeya-backend
```

## Testing

Run tests (once test files are created):
```bash
pytest -v
pytest --cov=app
```

## Support & Documentation

- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Alembic Docs: https://alembic.sqlalchemy.org/

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   └── security.py      # JWT and password hashing
│   ├── db/
│   │   └── database.py      # Database connections
│   ├── models/
│   │   └── __init__.py      # SQLAlchemy models
│   ├── schemas/
│   │   └── __init__.py      # Pydantic schemas
│   ├── repositories/
│   │   └── __init__.py      # Data access layer
│   ├── services/
│   │   └── __init__.py      # Business logic
│   ├── api/v1/
│   │   ├── auth.py          # Auth routes
│   │   ├── restaurant.py    # Restaurant routes
│   │   ├── accommodation.py # Accommodation routes
│   │   ├── conference.py    # Conference routes
│   │   ├── payments.py      # Payment routes
│   │   └── crm.py          # CRM routes
│   ├── tasks/               # Celery tasks
│   └── utils/               # Utility functions
├── alembic/
│   ├── versions/            # Migration scripts
│   ├── env.py              # Alembic config
│   └── script.py.mako      # Migration template
├── .env.example            # Environment template
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## License
Proprietary - SEYEYA Courts

## Version
1.0.0 - June 2025
