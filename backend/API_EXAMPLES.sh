#!/bin/bash
# SEYEYA API Examples
# This file contains curl examples for all API endpoints
# Base URL: http://localhost:8000

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}SEYEYA API Examples${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Set base URL
BASE_URL="http://localhost:8000"
API_V1="$BASE_URL/api/v1"

# Variables (set these after testing registration/login)
ACCESS_TOKEN=""
CUSTOMER_ID=""
ORDER_ID=""
ROOM_ID=""
RESERVATION_ID=""

# =====================================================
# AUTHENTICATION ENDPOINTS
# =====================================================

echo -e "${GREEN}1. AUTHENTICATION ENDPOINTS${NC}"
echo ""

echo "Register new user:"
echo "curl -X POST \"$API_V1/auth/register\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"full_name\": \"John Doe\","
echo "    \"email\": \"john@example.com\","
echo "    \"phone_number\": \"+256701234567\","
echo "    \"password\": \"SecurePass123!\","
echo "    \"confirm_password\": \"SecurePass123!\""
echo "  }'"
echo ""

echo "Login user:"
echo "curl -X POST \"$API_V1/auth/login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"email\": \"john@example.com\","
echo "    \"password\": \"SecurePass123!\""
echo "  }'"
echo ""

# =====================================================
# RESTAURANT ENDPOINTS
# =====================================================

echo -e "${GREEN}2. RESTAURANT ENDPOINTS${NC}"
echo ""

echo "List menu categories:"
echo "curl -X GET \"$API_V1/restaurant/menu/categories\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "Get items in category (category_id=1):"
echo "curl -X GET \"$API_V1/restaurant/menu/categories/1/items\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "Create restaurant order:"
echo "curl -X POST \"$API_V1/restaurant/orders\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"seating_location\": \"Indoor\","
echo "    \"delivery_option\": \"Remote\","
echo "    \"delivery_address\": \"123 Main Street, Kampala\","
echo "    \"special_instr\": \"Please deliver after 2 PM\","
echo "    \"items\": ["
echo "      {"
echo "        \"menu_item_id\": 1,"
echo "        \"quantity\": 2,"
echo "        \"special_notes\": \"No onions\","
echo "        \"extras\": ["
echo "          {\"extra_id\": 5, \"quantity\": 1}"
echo "        ]"
echo "      }"
echo "    ]"
echo "  }'"
echo ""

echo "Get order details (order_id=1):"
echo "curl -X GET \"$API_V1/restaurant/orders/1\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Update order status:"
echo "curl -X PATCH \"$API_V1/restaurant/orders/1\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"order_status\": \"Preparing\","
echo "    \"amount_paid\": 50000"
echo "  }'"
echo ""

# =====================================================
# ACCOMMODATION ENDPOINTS
# =====================================================

echo -e "${GREEN}3. ACCOMMODATION ENDPOINTS${NC}"
echo ""

echo "Search available rooms:"
echo "curl -X GET \"$API_V1/accommodation/rooms?check_in=2025-06-20&check_out=2025-06-25\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "Get room details (room_id=5):"
echo "curl -X GET \"$API_V1/accommodation/rooms/5\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "Create accommodation reservation:"
echo "curl -X POST \"$API_V1/accommodation/reservations\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"room_id\": 5,"
echo "    \"check_in_date\": \"2025-06-20\","
echo "    \"check_out_date\": \"2025-06-25\","
echo "    \"num_adults\": 2,"
echo "    \"num_children\": 1,"
echo "    \"special_requests\": \"High floor preferred, wake-up call at 7 AM\""
echo "  }'"
echo ""

echo "Get reservation details (reservation_id=1):"
echo "curl -X GET \"$API_V1/accommodation/reservations/1\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Check in guest:"
echo "curl -X POST \"$API_V1/accommodation/reservations/1/checkin\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Check out guest:"
echo "curl -X POST \"$API_V1/accommodation/reservations/1/checkout\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

# =====================================================
# CONFERENCE ENDPOINTS
# =====================================================

echo -e "${GREEN}4. CONFERENCE ENDPOINTS${NC}"
echo ""

echo "List conference halls:"
echo "curl -X GET \"$API_V1/conference/halls\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "List resources:"
echo "curl -X GET \"$API_V1/conference/resources\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "List meal packages:"
echo "curl -X GET \"$API_V1/conference/meal-packages\" \\"
echo "  -H \"Accept: application/json\""
echo ""

echo "Create conference reservation:"
echo "curl -X POST \"$API_V1/conference/reservations\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"customer_id\": 1,"
echo "    \"hall_id\": 2,"
echo "    \"event_name\": \"Annual Strategic Planning Meeting\","
echo "    \"event_start_date\": \"2025-07-15\","
echo "    \"event_end_date\": \"2025-07-16\","
echo "    \"start_time\": \"09:00\","
echo "    \"end_time\": \"17:00\","
echo "    \"num_participants\": 100,"
echo "    \"booking_type\": \"FullDay\","
echo "    \"special_requests\": \"Please set up theater-style seating\","
echo "    \"resources\": ["
echo "      {\"resource_id\": 1, \"quantity\": 2},"
echo "      {\"resource_id\": 2, \"quantity\": 1}"
echo "    ],"
echo "    \"meals\": ["
echo "      {\"package_id\": 1, \"num_participants\": 100}"
echo "    ]"
echo "  }'"
echo ""

echo "Get conference reservation (conference_res_id=1):"
echo "curl -X GET \"$API_V1/conference/reservations/1\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

# =====================================================
# PAYMENT ENDPOINTS
# =====================================================

echo -e "${GREEN}5. PAYMENT ENDPOINTS${NC}"
echo ""

echo "Create payment for restaurant order:"
echo "curl -X POST \"$API_V1/payments/\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"payment_type\": \"RestaurantOrder\","
echo "    \"reference_id\": 1,"
echo "    \"payment_method\": \"MobileMoney\","
echo "    \"amount_paid\": 250000,"
echo "    \"is_deposit\": false"
echo "  }'"
echo ""

echo "Create deposit payment for accommodation:"
echo "curl -X POST \"$API_V1/payments/\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"payment_type\": \"AccommodationReservation\","
echo "    \"reference_id\": 1,"
echo "    \"payment_method\": \"VISA\","
echo "    \"amount_paid\": 150000,"
echo "    \"is_deposit\": true,"
echo "    \"deposit_percent\": 30"
echo "  }'"
echo ""

echo "Get payment details (payment_id=1):"
echo "curl -X GET \"$API_V1/payments/1\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Verify payment (admin only):"
echo "curl -X POST \"$API_V1/payments/1/verify\" \\"
echo "  -H \"Authorization: Bearer \$ADMIN_ACCESS_TOKEN\""
echo ""

# =====================================================
# CRM ENDPOINTS
# =====================================================

echo -e "${GREEN}6. CRM ENDPOINTS${NC}"
echo ""

echo "Create customer:"
echo "curl -X POST \"$API_V1/crm/customers\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"full_name\": \"Jane Smith\","
echo "    \"phone_number\": \"+256701234567\","
echo "    \"email\": \"jane@example.com\","
echo "    \"gender\": \"Female\","
echo "    \"address\": \"456 Oak Avenue, Kampala\","
echo "    \"customer_type\": \"VIP\""
echo "  }'"
echo ""

echo "Get customer details (customer_id=1):"
echo "curl -X GET \"$API_V1/crm/customers/1\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Lookup customer by phone:"
echo "curl -X GET \"$API_V1/crm/customers/lookup/256701234567\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Update customer:"
echo "curl -X PATCH \"$API_V1/crm/customers/1\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"full_name\": \"Jane Smith-Johnson\","
echo "    \"phone_number\": \"+256712345678\""
echo "  }'"
echo ""

# =====================================================
# NOTIFICATION ENDPOINTS
# =====================================================

echo -e "${GREEN}7. NOTIFICATION ENDPOINTS${NC}"
echo ""

echo "List user notifications:"
echo "curl -X GET \"\$API_V1/notifications\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Get unread count:"
echo "curl -X GET \"\$API_V1/notifications/unread-count\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Mark notification as read (ID is a UUID):"
echo "curl -X PATCH \"\$API_V1/notifications/<notification-uuid>/read\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Mark all notifications as read:"
echo "curl -X PATCH \"\$API_V1/notifications/read-all\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Get user notification preferences:"
echo "curl -X GET \"\$API_V1/notifications/preferences\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\""
echo ""

echo "Update user notification preferences:"
echo "curl -X PUT \"\$API_V1/notifications/preferences\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"email_enabled\": false,"
echo "    \"in_app_enabled\": true,"
echo "    \"order_notifications\": false"
echo "  }'"
echo ""

echo "Admin: Send direct notification:"
echo "curl -X POST \"\$API_V1/notifications/admin/send\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ADMIN_ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"recipient_id\": 2,"
echo "    \"title\": \"Security Warning\","
echo "    \"message\": \"We detected a login attempt from a new location.\","
echo "    \"category\": \"Security\","
echo "    \"priority\": \"HIGH\","
echo "    \"channel\": \"BOTH\""
echo "  }'"
echo ""

echo "Admin: Broadcast notification:"
echo "curl -X POST \"\$API_V1/notifications/admin/broadcast\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \$ADMIN_ACCESS_TOKEN\" \\"
echo "  -d '{"
echo "    \"recipient_group\": \"all_customers\","
echo "    \"title\": \"Weekend Offer!\","
echo "    \"message\": \"Enjoy 20% off on all buffet orders this Sunday!\","
echo "    \"category\": \"Marketing\","
echo "    \"channel\": \"BOTH\""
echo "  }'"
echo ""

echo "Admin: Get notification audit/statistics:"
echo "curl -X GET \"\$API_V1/notifications/admin/statistics\" \\"
echo "  -H \"Authorization: Bearer \$ADMIN_ACCESS_TOKEN\""
echo ""

# =====================================================
# HEALTH CHECK
# =====================================================

echo -e "${GREEN}8. SYSTEM ENDPOINTS${NC}"
echo ""

echo "Health check:"
echo "curl -X GET \"$BASE_URL/health\""
echo ""

echo "API Status:"
echo "curl -X GET \"$BASE_URL/\""
echo ""

# =====================================================
# CURL COMMAND TEMPLATE
# =====================================================

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Using the Examples${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "1. Register and login to get ACCESS_TOKEN:"
echo "   - Extract 'access_token' from login response"
echo "   - Set it as: export ACCESS_TOKEN='your_token'"
echo ""
echo "2. Copy and paste any command above to test"
echo ""
echo "3. Replace placeholders like:"
echo "   - \$ACCESS_TOKEN with your actual token"
echo "   - IDs (1, 5, etc.) with real IDs from your database"
echo "   - Dates and times with valid values"
echo ""
echo "4. View API documentation at: $BASE_URL/docs"
echo ""






