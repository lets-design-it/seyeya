# Frontend Integration Guide: Delivery Fee System

This document outlines how frontend developers (web or mobile app) should integrate with the new configurable Delivery Fee system.

## Overview
The Seyeya backend provides a dedicated endpoint to calculate delivery fees based on distance (using the Haversine formula) and administrator configurations (like minimum fees and price per kilometer).

The integration requires a simple two-step process:
1. **Calculate the Fee:** Send the customer's coordinates to the backend to get the delivery cost.
2. **Place the Order:** Pass the calculated `delivery_charge` when creating the actual order.

---

## Step 1: Calculate the Delivery Charge
Before the user clicks "Place Order" (or when they drop a pin on the map), you must call the calculation endpoint to determine the exact delivery cost.

**Endpoint:**
`POST /api/v1/restaurant/delivery-pricing/calculate`

**Payload Requirements:**
- `delivery_lat` & `delivery_lng`: Decimal coordinates of the customer's delivery destination.

**Example Request:**
```json
{
  "delivery_lat": -1.3000,
  "delivery_lng": 36.8200
}
```

**Example Response:**
```json
{
  "is_deliverable": true,
  "distance_km": "0.90",
  "price_per_km": "1000.00",
  "delivery_charge": "903.48",
  "message": "Delivery available"
}
```
*Note: The backend securely reads the restaurant's origin coordinates and active pricing configurations from the database. It handles the math (`distance_km * price_per_km`) and enforces the admin-configured `minimum_delivery_fee` automatically. You simply use the returned `delivery_charge`.*

**Error States:**
If the destination is further than the admin-configured maximum distance, the endpoint will respond with `200 OK` but `is_deliverable` will be `false`:
```json
{
  "is_deliverable": false,
  "distance_km": "25.50",
  "price_per_km": null,
  "delivery_charge": null,
  "message": "Delivery address is too far. Maximum delivery distance is 15.00 km"
}
```
*(Your frontend should use this to block the user from continuing).*

---

## Step 2: Creating the Order
Once the customer confirms the order and you have the `delivery_charge` from Step 1, send it along with the order payload.

**Endpoint:**
`POST /api/v1/restaurant/orders`

**Payload Requirements:**
- `delivery_option`: Must be exactly `"Delivery"`.
- `delivery_lat` & `delivery_lng`: The delivery coordinates.
- `delivery_charge`: The exact decimal value returned from Step 1.

**Example Request:**
```json
{
  "customer_id": 123,
  "delivery_option": "Delivery",
  "delivery_address": "123 Ngong Road, Nairobi",
  "delivery_lat": -1.300000,
  "delivery_lng": 36.820000,
  "delivery_charge": 903.48,
  "items": [
    {
      "menu_item_id": 23,
      "quantity": 1
    }
  ]
}
```

The backend will trust the `delivery_charge` provided, save it to the database, and automatically add it to the `total_amount` for the order.