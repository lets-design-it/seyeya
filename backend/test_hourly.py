import asyncio
from fastapi.testclient import TestClient
from app.main import app
import json
import uuid

client = TestClient(app)

def run():
    print("Creating Hall...")
    hall_data = {
        "hall_name": f"Hourly Test Hall {uuid.uuid4().hex[:4]}",
        "capacity": 50,
        "hourly_rate": 50000,
        "half_day_rate": 250000,
        "full_day_rate": 500000,
        "facility_ids": []
    }
    hall_resp = client.post("/api/v1/conference/halls", json=hall_data)
    if hall_resp.status_code != 201:
        print("Failed to create hall:", hall_resp.text)
        return
    hall_id = hall_resp.json()["hall_id"]

    print("Creating Hourly Reservation...")
    res_data = {
        "customer_id": 13,
        "hall_id": hall_id,
        "event_name": "Quick Strategy Meeting",
        "event_start_date": "2026-11-02",
        "event_end_date": "2026-11-02",
        "start_time": "10:00:00",
        "end_time": "14:30:00",  # 4.5 hours
        "num_participants": 5,
        "booking_type": "Hourly",
        "facilities": []
    }
    
    res_resp = client.post("/api/v1/conference/reservations", json=res_data)
    if res_resp.status_code != 200:
        print("Failed to create reservation:", res_resp.text)
        return
        
    print("=================== HOURLY RESERVATION CREATED ===================")
    print(json.dumps(res_resp.json(), indent=2))

if __name__ == "__main__":
    run()
