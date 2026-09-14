import asyncio
from fastapi.testclient import TestClient
from app.main import app
import json
import uuid

client = TestClient(app)

def run():
    print("Creating Facilities...")
    # Get existing
    existing = client.get("/api/v1/conference/facilities").json()
    existing_map = {f["name"]: f["facility_id"] for f in existing}

    facilities = [
        {"name": "Lunch Special", "category": "Catering", "price": 30000, "pricing_type": "PER_PERSON"},
        {"name": "Evening Tea Special", "category": "Catering", "price": 16000, "pricing_type": "PER_PERSON"},
        {"name": f"Projector Hire {uuid.uuid4().hex[:4]}", "category": "Equipment", "price": 150000, "pricing_type": "FLAT"},
        {"name": f"Public Address {uuid.uuid4().hex[:4]}", "category": "Equipment", "price": 100000, "pricing_type": "FLAT"}
    ]
    
    facility_ids = []
    for fac in facilities:
        if fac["name"] in existing_map:
            facility_ids.append(existing_map[fac["name"]])
        else:
            resp = client.post("/api/v1/conference/facilities", json=fac)
            if resp.status_code == 201:
                facility_ids.append(resp.json()["facility_id"])
            else:
                print(f"Failed to create {fac['name']}: {resp.text}")
            
    if len(facility_ids) != 4:
        print("Failed to create all facilities, exiting.")
        return

    print("Creating Hall...")
    hall_data = {
        "hall_name": f"Main Conference Hall {uuid.uuid4().hex[:4]}",
        "capacity": 50,
        "hourly_rate": 50000,
        "half_day_rate": 250000,
        "full_day_rate": 500000,
        "facility_ids": facility_ids
    }
    hall_resp = client.post("/api/v1/conference/halls", json=hall_data)
    if hall_resp.status_code != 201:
        print("Failed to create hall:", hall_resp.text)
        return
    hall_id = hall_resp.json()["hall_id"]

    print("Creating Reservation...")
    res_data = {
        "customer_id": 13,
        "hall_id": hall_id,
        "event_name": "Grand Corporate Summit",
        "event_start_date": "2026-11-01",
        "event_end_date": "2026-11-01",
        "start_time": "08:00:00",
        "end_time": "18:00:00",
        "num_participants": 30,
        "booking_type": "FullDay",
        "facilities": [
            {"facility_id": facility_ids[0], "quantity": 30}, # Lunch
            {"facility_id": facility_ids[1], "quantity": 30}, # Tea
            {"facility_id": facility_ids[2], "quantity": 1},  # Projector
            {"facility_id": facility_ids[3], "quantity": 1}   # PA
        ]
    }
    
    res_resp = client.post("/api/v1/conference/reservations", json=res_data)
    if res_resp.status_code != 200:
        print("Failed to create reservation:", res_resp.text)
        return
        
    print("=================== RESERVATION CREATED ===================")
    print(json.dumps(res_resp.json(), indent=2))

if __name__ == "__main__":
    run()
