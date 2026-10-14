import asyncio
from sqlalchemy import text
from app.db.database import engine

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE conference_halls ADD COLUMN IF NOT EXISTS standard_price NUMERIC(10, 2);"))
        print("Column standard_price added to conference_halls.")

asyncio.run(fix())
