"""
Script to seed rich test data (beds, views, bathroom features, facilities, images) for all existing rooms in the database.
"""
import asyncio
from sqlalchemy import select
from app.db.database import engine, AsyncSession
from sqlalchemy.orm import sessionmaker, selectinload
from app.models import Room, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage


async def seed_data():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(
            select(Room).options(
                selectinload(Room.beds),
                selectinload(Room.views),
                selectinload(Room.bathroom_features),
                selectinload(Room.room_facilities),
                selectinload(Room.images)
            )
        )
        rooms = result.scalars().all()
        print(f"Found {len(rooms)} rooms in database.")

        for room in rooms:
            # Seed beds if empty
            if not room.beds:
                bed_type = "King Bed" if "Cottage" in (room.room_name or "") or "10" in room.room_number else ("Twin Bed" if "20" in room.room_number else "Super King Bed")
                qty = 2 if bed_type == "Twin Bed" else 1
                session.add(RoomBed(room_id=room.room_id, bed_type=bed_type, quantity=qty))
                print(f"Added bed for room {room.room_number}")

            # Seed views if empty
            if not room.views:
                session.add(RoomView(room_id=room.room_id, view_name="Nile River View"))
                session.add(RoomView(room_id=room.room_id, view_name="Garden View"))
                print(f"Added views for room {room.room_number}")

            # Seed bathroom features if empty
            if not room.bathroom_features:
                session.add(RoomBathroomFeature(room_id=room.room_id, feature_name="Rain Shower"))
                session.add(RoomBathroomFeature(room_id=room.room_id, feature_name="Double Vanity"))
                print(f"Added bathroom features for room {room.room_number}")

            # Seed facilities if empty
            if not room.room_facilities:
                session.add(RoomFacility(room_id=room.room_id, facility_name="High-Speed Wi-Fi"))
                session.add(RoomFacility(room_id=room.room_id, facility_name="Air Conditioning"))
                session.add(RoomFacility(room_id=room.room_id, facility_name="Espresso Coffee Machine"))
                session.add(RoomFacility(room_id=room.room_id, facility_name="Mini Fridge"))
                print(f"Added facilities for room {room.room_number}")

            # Seed images if empty
            if not room.images:
                session.add(RoomImage(room_id=room.room_id, image_url="https://images.unsplash.com/photo-1566665797739-1674de7a421a", display_order=0, is_primary=True, caption="Room Exterior View"))
                session.add(RoomImage(room_id=room.room_id, image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427", display_order=1, is_primary=False, caption="Bedroom Interior"))
                print(f"Added images for room {room.room_number}")

        await session.commit()
        print("Successfully committed room test data.")

if __name__ == "__main__":
    asyncio.run(seed_data())
