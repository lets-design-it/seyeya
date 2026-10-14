import asyncio
from sqlalchemy import text
from app.db.database import engine

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE conference_facilities ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);"))
        await conn.execute(text("ALTER TABLE conference_facilities ADD COLUMN IF NOT EXISTS pricing_type VARCHAR;"))
        print("Columns price and pricing_type added to conference_facilities.")

asyncio.run(fix())
