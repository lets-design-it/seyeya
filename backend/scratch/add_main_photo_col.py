import asyncio
from sqlalchemy import text
from app.db.database import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as db:
        print("Ensuring main_photo_index column exists in conference_halls...")
        try:
            await db.execute(text("ALTER TABLE conference_halls ADD COLUMN IF NOT EXISTS main_photo_index INTEGER DEFAULT 0;"))
            await db.commit()
            print("Successfully added main_photo_index column.")
        except Exception as e:
            print("Error altering table:", e)

if __name__ == "__main__":
    asyncio.run(main())
