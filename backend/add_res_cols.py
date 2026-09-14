import asyncio
from sqlalchemy import text
from app.db.database import engine

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE conference_reservations ADD COLUMN IF NOT EXISTS hall_unit_price NUMERIC(10, 2);"))
        await conn.execute(text("ALTER TABLE conference_reservations ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);"))
        await conn.execute(text("ALTER TABLE conference_reservations ADD COLUMN IF NOT EXISTS payment_responsibility VARCHAR(50) DEFAULT 'Individual';"))
        print("Columns added to conference_reservations.")

asyncio.run(fix())
