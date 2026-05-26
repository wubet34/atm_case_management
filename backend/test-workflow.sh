#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}=== Testing ATM Case Management API ===${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}jq is not installed. Installing jq...${NC}"
    sudo apt-get install jq -y
fi

# 1. Login as Admin
echo -e "${GREEN}1. Login as Admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')
if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Failed to get admin token${NC}"
    echo $ADMIN_RESPONSE | jq '.'
    exit 1
fi
echo -e "${GREEN}Admin Token obtained${NC}"
echo ""

# 2. Create a case
echo -e "${GREEN}2. Creating a new case...${NC}"
CREATE_CASE=$(curl -s -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "atmName": "TEST-ATM-01",
    "bank": "Test Bank",
    "district": "Test District",
    "branch": "Test Branch",
    "caseType": "Test Issue",
    "comment": "This is a test case",
    "priority": "High"
  }')

echo $CREATE_CASE | jq '.'
CASE_ID=$(echo $CREATE_CASE | jq -r '.data.id')
if [ "$CASE_ID" == "null" ] || [ -z "$CASE_ID" ]; then
    echo -e "${RED}Failed to create case${NC}"
    exit 1
fi
echo -e "${GREEN}Case created with ID: $CASE_ID${NC}"
echo ""

# 3. Get all cases
echo -e "${GREEN}3. Getting all cases...${NC}"
curl -s -X GET http://localhost:5000/api/cases \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | length'
echo ""

# 4. Get technicians list
echo -e "${GREEN}4. Getting technicians list...${NC}"
TECH_RESPONSE=$(curl -s -X GET http://localhost:5000/api/technicians \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo $TECH_RESPONSE | jq '.'
TECH_ID=$(echo $TECH_RESPONSE | jq -r '.data[0].id')
if [ "$TECH_ID" == "null" ] || [ -z "$TECH_ID" ]; then
    echo -e "${YELLOW}No technicians found. Creating a technician...${NC}"
    # You would need to create a technician here
else
    echo -e "${GREEN}Found technician with ID: $TECH_ID${NC}"
fi
echo ""

# 5. Appoint technician to case (if technician exists)
if [ -n "$TECH_ID" ] && [ "$TECH_ID" != "null" ]; then
    echo -e "${GREEN}5. Appointing technician to case...${NC}"
    APPOINT_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/cases/$CASE_ID/appoint \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d "{\"technicianId\": $TECH_ID}")
    echo $APPOINT_RESPONSE | jq '.'
    echo ""
fi

# 6. Login as Technician
echo -e "${GREEN}6. Login as Technician...${NC}"
TECH_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abebe@example.com","password":"tech123"}')

TECH_TOKEN=$(echo $TECH_LOGIN_RESPONSE | jq -r '.token')
if [ "$TECH_TOKEN" == "null" ] || [ -z "$TECH_TOKEN" ]; then
    echo -e "${YELLOW}Technician login failed. Using admin token for testing...${NC}"
    TECH_TOKEN=$ADMIN_TOKEN
else
    echo -e "${GREEN}Technician Token obtained${NC}"
fi
echo ""

# 7. Get technician's cases
echo -e "${GREEN}7. Getting technician's cases...${NC}"
curl -s -X GET http://localhost:5000/api/cases \
  -H "Authorization: Bearer $TECH_TOKEN" | jq '.'
echo ""

# 8. Start work on case
echo -e "${GREEN}8. Starting work on case...${NC}"
START_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/cases/$CASE_ID/start \
  -H "Authorization: Bearer $TECH_TOKEN")
echo $START_RESPONSE | jq '.'
echo ""

# 9. Complete work on case
echo -e "${GREEN}9. Completing work on case...${NC}"
COMPLETE_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/cases/$CASE_ID/complete \
  -H "Authorization: Bearer $TECH_TOKEN")
echo $COMPLETE_RESPONSE | jq '.'
echo ""

# 10. Get dashboard stats
echo -e "${GREEN}10. Getting dashboard stats...${NC}"
curl -s -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""
o
# 11. Get notifications
echo -e "${GREEN}11. Getting notifications...${NC}"
NOTIF_RESPONSE=$(curl -s -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TECH_TOKEN")
echo $NOTIF_RESPONSE | jq '.'
echo ""

# 12. Get single case details
echo -e "${GREEN}12. Getting case details...${NC}"
curl -s -X GET http://localhost:5000/api/cases/$CASE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 13. Update case
echo -e "${GREEN}13. Updating case...${NC}"
curl -s -X PUT http://localhost:5000/api/cases/$CASE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "priority": "Urgent",
    "comment": "Updated test case comment"
  }' | jq '.'
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}=== Test Complete ===${NC}"
echo -e "${BLUE}========================================${NC}"
