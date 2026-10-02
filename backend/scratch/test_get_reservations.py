import asyncio
from app.db.database import AsyncSessionLocal
from app.repositories import ConferenceRepository
from app.schemas import ConferenceReservationResponse

async def main():
    async with AsyncSessionLocal() as db:
        try:
            repo = ConferenceRepository(db)
            resv = await repo.get_all_reservations()
            print("Successfully fetched reservations count:", len(resv))
            for r in resv:
                validated = ConferenceReservationResponse.model_validate(r)
                print("Validated reservation ID:", validated.conference_res_id)
        except Exception as e:
            import traceback
            print("EXCEPTION CAUGHT IN VALIDATION:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
