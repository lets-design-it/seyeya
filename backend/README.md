# Seyeya Backend API

This repository contains the backend service for **Seyeya**, powered by **FastAPI**, **SQLAlchemy (Async)**, and **PostgreSQL**. It handles authentication, CRM/customers, accommodation bookings, conference hall reservations, restaurant orders, and payment integrations.

---

## 🚀 Prerequisites

Ensure you have the following installed on your machine:
* **Python 3.10+**
* **PostgreSQL 14+**

---

## 🗄️ Database Setup (PostgreSQL)

The backend is pre-configured to connect to a shared cloud-hosted **Neon Serverless PostgreSQL** database. This allows developers to run the application immediately without installing or setting up a local database server.

### ☁️ Using the Shared Neon Database (Recommended)

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```
2. The `.env` file is already populated with the shared development Neon database credentials.
3. Start the application normally!

*Note: If you want to point to your own private Neon database instead, simply replace `DATABASE_URL` and `DATABASE_SYNC_URL` in `.env` with your own dashboard connection strings. The backend automatically formats the connection schemas, strips incompatible flags (like `channel_binding`), and applies correct SSL options automatically.*

### 💻 Using a Local PostgreSQL Installation (Alternative)

If you prefer to run a local PostgreSQL instance instead of the shared Neon cloud database:

1. **Start the local PostgreSQL service**:
   ```bash
   sudo systemctl start postgresql
   ```
2. **Create a local database and user**:
   ```bash
   sudo -u postgres psql
   ```
   Inside the psql shell:
   ```sql
   CREATE USER seyeya_user WITH PASSWORD 'seyeya_password';
   CREATE DATABASE seyeya_db OWNER seyeya_user;
   GRANT ALL PRIVILEGES ON DATABASE seyeya_db TO seyeya_user;
   \q
   ```
3. **Update your `.env` file**:
   Replace the database URLs in your `.env` with your local connection strings:
   ```env
   DATABASE_URL=postgresql+asyncpg://seyeya_user:seyeya_password@localhost:5432/seyeya_db
   DATABASE_SYNC_URL=postgresql://seyeya_user:seyeya_password@localhost:5432/seyeya_db
   ```

---

## 🛠️ Backend Installation & Setup

Follow these steps to set up the Python environment and run the backend.

### 1. Clone the repository and navigate to the backend folder
```bash
cd backend
```

### 2. Create and activate a Virtual Environment
```bash
# Create the virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the template `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and set your configuration details. For example:
```env
DATABASE_URL=postgresql+asyncpg://seyeya_user:seyeya_password@localhost:5432/seyeya_db
JWT_SECRET=your_jwt_secret_key_here
```

### 5. Run Database Migrations
Use Alembic to apply migrations and build the database schema:
```bash
python -m alembic upgrade head
```

---

## 🏃 Running the Application

Start the FastAPI development server using `uvicorn`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

* **`--reload`**: Automatically restarts the server when code changes are detected (perfect for development).
* **`--host 0.0.0.0`**: Exposes the API to your local network, enabling testing from other devices or frontend clients.
* **`--port 8000`**: Runs the API on port `8000`.

---

## 📖 Viewing & Testing the APIs

FastAPI automatically generates interactive, self-documenting API interfaces. Open your browser and navigate to:

### 1. Swagger UI (Interactive API Sandbox)
* **URL**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **What it does**: Allows you to view all available endpoints, their expected request parameters/bodies, and send requests directly from the browser to see the live responses.

### 2. ReDoc (Clean Static Documentation)
* **URL**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **What it does**: Provides a clean, styled, and structured breakdown of the API endpoints, schemas, and responses.

---

## 📁 Key API Modules Overview

All endpoints are prefixed with `/api/v1`.

| Module | Base Path | Key Features / Endpoints |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | User login, JWT token generation, password reset request/confirm |
| **CRM / Customers** | `/api/v1/crm` | Customer CRUD, profiles, customer transaction and order history, customer password reset |
| **Restaurant** | `/api/v1/restaurant` | Menu category & item management, order creation, order status updates, and order reviews |
| **Accommodation** | `/api/v1/accommodation` | Room availability search, reservation booking, check-in, and check-out |
| **Conference** | `/api/v1/conference` | Hall directories, reservations, resource equipment bookings, and meal package options |
| **Payments** | `/api/v1/payments` | Initiate mobile money/card payments and admin verification/propagation |

---

## 🛠️ Modifying the Database Schema

If you modify SQLAlchemy models in `app/models/__init__.py`:

1. **Generate a migration**:
   ```bash
   python -m alembic revision --autogenerate -m "describe changes here"
   ```
2. **Apply the migration**:
   ```bash
   python -m alembic upgrade head
   ```