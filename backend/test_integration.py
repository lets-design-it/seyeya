import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run():
    # 1. Fetch facilities
    facilities = client.get("/api/v1/conference/facilities").json()
    if not facilities:
        print("No facilities found!")
        return
    
    facility_id = facilities[0]["facility_id"]
    print(f"Using facility ID: {facility_id}")
    
    # 2. Create a hall with the facility
    hall_data = {
        "hall_name": "Test Integration Hall",
        "capacity": 50,
        "hourly_rate": 50000,
        "half_day_rate": 150000,
        "full_day_rate": 300000,
        "facility_ids": [facility_id]
    }
    hall_response = client.post("/api/v1/conference/halls", json=hall_data)
    print("Create hall status:", hall_response.status_code)
    if hall_response.status_code != 201:
        print("Error:", hall_response.text)
        return
    hall = hall_response.json()
    hall_id = hall["hall_id"]
    print(f"Created Hall ID: {hall_id}")
    
    # 3. Create a reservation for the hall
    # We need a customer ID first
    customer_id = 13
    
    res_data = {
        "customer_id": customer_id,
        "hall_id": hall_id,
        "event_name": "Integration Test Event",
        "event_start_date": "2026-10-01",
        "event_end_date": "2026-10-01",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 20,
        "booking_type": "FullDay"
    }
    res_response = client.post("/api/v1/conference/reservations", json=res_data)
    print("Create reservation status:", res_response.status_code)
    if res_response.status_code != 200:
        print("Error:", res_response.text)
        return
    
    # 4. Retrieve all reservations
    all_res_response = client.get("/api/v1/conference/reservations")
    print("Get all reservations status:", all_res_response.status_code)
    if all_res_response.status_code != 200:
        print("Error:", all_res_response.text)
        return
    
    print("Successfully retrieved reservations!")
    
if __name__ == "__main__":
    run()
