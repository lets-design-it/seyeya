import asyncio
from decimal import Decimal
from app.db.database import AsyncSessionLocal
from app.repositories import ConferenceRepository

async def main():
    async with AsyncSessionLocal() as db:
        try:
            repo = ConferenceRepository(db)
            updated = await repo.update_hall(
                hall_id=20,
                hall_name="Seyeya Grand Ballroom",
                capacity=200,
                hourly_rate=Decimal("200000"),
                half_day_rate=Decimal("1000000"),
                full_day_rate=Decimal("1800000"),
                description="Updated description",
                photos=["https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"],
                main_photo_index=0
            )
            print("Successfully updated hall 20:", updated.hall_name if updated else None)
        except Exception as e:
            import traceback
            print("EXCEPTION CAUGHT IN UPDATE_HALL:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
