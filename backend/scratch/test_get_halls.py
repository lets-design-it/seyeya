import asyncio
from app.db.database import AsyncSessionLocal
from app.api.v1.conference import get_halls

async def main():
    async with AsyncSessionLocal() as db:
        try:
            halls = await get_halls(db)
            print("Successfully fetched halls count:", len(halls))
            for h in halls:
                print("Hall:", h.hall_name, "Photos:", h.photos, "Rates:", h.hourly_rate, h.half_day_rate, h.full_day_rate)
        except Exception as e:
            import traceback
            print("EXCEPTION CAUGHT:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
