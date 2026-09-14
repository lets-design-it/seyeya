import asyncio
from sqlalchemy import text
from app.db.database import engine

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);"))
        print("Column company_name added to customers.")

asyncio.run(fix())
