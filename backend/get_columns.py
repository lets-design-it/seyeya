import asyncio
from sqlalchemy import text
from app.db.database import engine

async def get_cols():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'conference_reservations';"))
        cols = [row[0] for row in result.fetchall()]
        print("Columns:", cols)

asyncio.run(get_cols())
