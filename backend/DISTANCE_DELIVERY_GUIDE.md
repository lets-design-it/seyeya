# Frontend Integration Guide: Delivery Fee System

This document outlines how frontend developers (web or mobile app) should integrate with the new configurable Delivery Fee system.

## Overview
The Seyeya backend now automatically calculates delivery fees based on distance (using the Haversine formula). The restaurant administrators configure the restaurant's origin coordinates (`latitude`, `longitude`), the cost per kilometer, and limits like maximum distance and minimum fees.

As a frontend developer, you simply need to capture the customer's delivery coordinates and pass them to the backend when creating an order. The backend handles all calculations automatically.

---

## 1. Fetching Active Delivery Rules (Optional but Recommended)
Before allowing a user to place a delivery order, you may want to fetch the active delivery pricing configuration. This lets you:
- Show the restaurant's location on a map.
- Check the `maximum_delivery_distance_km` to prevent users outside the delivery radius from even attempting to order.
- Provide a pricing estimate before they reach checkout.

**Endpoint:**
`GET /api/v1/restaurant/delivery-pricing/active`

**Example Response:**
```json
{
  "pricing_id": 1,
  "restaurant_lat": "-1.292100",
  "restaurant_lng": "36.821900",
  "price_per_km": "50.00",
  "minimum_delivery_fee": "150.00",
  "maximum_delivery_distance_km": "15.00",
  "is_active": true,
  "created_at": "2026-07-20T08:00:00.000Z",
  "updated_at": "2026-07-20T08:00:00.000Z"
}
```

---

## 2. Creating a Delivery Order
When the customer places an order and selects **"Delivery"** as their `delivery_option`, you **must** provide `delivery_lat` and `delivery_lng` in the JSON payload. 

**Endpoint:**
`POST /api/v1/restaurant/orders`

**Payload Requirements:**
- `delivery_option`: Must be exactly `"Delivery"`.
- `delivery_lat` & `delivery_lng`: Decimal coordinates of the customer's delivery location. (If these are omitted, the backend will return a `400 Bad Request` error).
- `items`: The cart items (delivery fees are only calculated if the order has items).

**Example Request:**
```json
{
  "customer_id": 123,
  "delivery_option": "Delivery",
  "delivery_address": "123 Ngong Road, Nairobi",
  "delivery_lat": -1.300000,
  "delivery_lng": 36.820000,
  "items": [
    {
      "menu_item_id": 23,
      "quantity": 1
    }
  ]
}
```

---

## 3. Handling the Response
Upon successful order creation, the backend will return the full order object, which now includes exactly how the delivery fee was calculated and applied.

**Key New Response Fields:**
- `delivery_distance_km`: The exact calculated straight-line distance.
- `price_per_km_used`: The rate applied.
- `delivery_charge`: The final delivery fee added to the order.
- `total_amount`: The subtotal + `delivery_charge`.

**Example Response Snippet:**
```json
{
  "order_id": 18,
  "order_number": "ORD-2026-2BC32705",
  "delivery_option": "Delivery",
  "delivery_distance_km": "0.90",
  "price_per_km_used": "50.00",
  "delivery_charge": "150.00",
  "total_amount": "45150.00",
  "order_status": "Pending"
  ...
}
```
*Note: In the above example, `0.90 km * 50 = 45`, but the admin-configured `minimum_delivery_fee` was `150.00`, so the backend clamped the delivery charge to 150.*

---

## 4. Handling Errors
The backend enforces constraints automatically. Your frontend should be prepared to catch and display the following `400 Bad Request` errors:
- `"Delivery coordinates are required for delivery orders"`: Emitted if you send `"Delivery"` without `delivery_lat`/`delivery_lng`.
- `"Delivery is currently unavailable (no active pricing)"`: Emitted if the admin has turned off delivery pricing entirely.
- `"Delivery address is too far. Maximum delivery distance is X km"`: Emitted if the distance exceeds the configured radius.
