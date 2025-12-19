#!/bin/bash

# Test Script for Idle Session Timeout
# Usage: ./test-session-idle-timeout.sh

BASE_URL="http://localhost:8080/api"
TEST_EMAIL="test@example.com"  # Replace with your test user email
TEST_PASSWORD="testpassword"    # Replace with your test user password
ADMIN_EMAIL="admin@example.com" # Replace with your admin email
ADMIN_PASSWORD="adminpassword"  # Replace with your admin password

echo "=========================================="
echo "Idle Session Timeout Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test header
print_test() {
    echo -e "${YELLOW}Test: $1${NC}"
    echo "----------------------------------------"
}

# Function to check response
check_response() {
    if [ $1 -eq 200 ] || [ $1 -eq 201 ]; then
        echo -e "${GREEN}✓ Success (HTTP $1)${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $1)${NC}"
    fi
    echo ""
}

# ============================================
# Test 1.1: Login sets last_activity_at
# ============================================
print_test "1.1: Login sets last_activity_at"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"rememberme\":false}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed - no token received${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""
echo "NOTE: Verify in database that last_activity_at is set:"
echo "  SELECT last_activity_at FROM usuario WHERE email = '$TEST_EMAIL';"
echo ""

# ============================================
# Test 1.2: Authenticated request updates last_activity_at
# ============================================
print_test "1.2: Authenticated request updates last_activity_at"

echo "Making authenticated request to /isLogged..."
ISLOGGED_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/isLogged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$ISLOGGED_RESPONSE" | tail -n1)
BODY=$(echo "$ISLOGGED_RESPONSE" | sed '$d')

check_response $HTTP_CODE
echo "Response: $BODY"
echo ""
echo "NOTE: Verify in database that last_activity_at was updated:"
echo "  SELECT last_activity_at FROM usuario WHERE email = '$TEST_EMAIL';"
echo ""

# ============================================
# Test 1.3: Multiple sequential requests
# ============================================
print_test "1.3: Multiple sequential requests update activity"

for i in {1..3}; do
    echo "Request $i..."
    curl -s -X POST "$BASE_URL/isLogged" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    sleep 1
done

echo -e "${GREEN}✓ All requests completed${NC}"
echo "NOTE: Check database to verify last_activity_at was updated after each request"
echo ""

# ============================================
# Test 2.1: Session expires after idle timeout
# ============================================
print_test "2.1: Session expires after idle timeout"

echo -e "${YELLOW}IMPORTANT: Before running this test, manually set last_activity_at to 8 days ago:${NC}"
echo "  UPDATE usuario SET last_activity_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE email = '$TEST_EMAIL';"
echo ""
read -p "Press Enter after updating the database..."

EXPIRED_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/isLogged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$EXPIRED_RESPONSE" | tail -n1)
BODY=$(echo "$EXPIRED_RESPONSE" | sed '$d')

if [ $HTTP_CODE -eq 401 ]; then
    echo -e "${GREEN}✓ Session correctly expired (HTTP 401)${NC}"
    if echo "$BODY" | grep -q "TOKEN_INVALID"; then
        echo -e "${GREEN}✓ Response contains TOKEN_INVALID${NC}"
    fi
    if echo "$BODY" | grep -q "shouldLogout.*true"; then
        echo -e "${GREEN}✓ Response contains shouldLogout: true${NC}"
    fi
else
    echo -e "${RED}✗ Expected 401, got HTTP $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# ============================================
# Test 2.2: Session valid within timeout
# ============================================
print_test "2.2: Session valid within timeout"

echo -e "${YELLOW}IMPORTANT: Before running this test, manually set last_activity_at to 6 days ago:${NC}"
echo "  UPDATE usuario SET last_activity_at = DATE_SUB(NOW(), INTERVAL 6 DAY) WHERE email = '$TEST_EMAIL';"
echo ""
read -p "Press Enter after updating the database..."

VALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/isLogged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$VALID_RESPONSE" | tail -n1)
BODY=$(echo "$VALID_RESPONSE" | sed '$d')

if [ $HTTP_CODE -eq 200 ]; then
    echo -e "${GREEN}✓ Session still valid (HTTP 200)${NC}"
else
    echo -e "${RED}✗ Expected 200, got HTTP $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# ============================================
# Test 3.1: NULL last_activity_at (first activity)
# ============================================
print_test "3.1: NULL last_activity_at (first activity)"

echo -e "${YELLOW}IMPORTANT: Before running this test, manually set last_activity_at to NULL:${NC}"
echo "  UPDATE usuario SET last_activity_at = NULL WHERE email = '$TEST_EMAIL';"
echo ""
read -p "Press Enter after updating the database..."

# Login again to get fresh token
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"rememberme\":false}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

NULL_TEST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/isLogged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$NULL_TEST_RESPONSE" | tail -n1)
BODY=$(echo "$NULL_TEST_RESPONSE" | sed '$d')

check_response $HTTP_CODE
echo "NOTE: Verify in database that last_activity_at was set:"
echo "  SELECT last_activity_at FROM usuario WHERE email = '$TEST_EMAIL';"
echo ""

# ============================================
# Test 3.4: Invalid token format
# ============================================
print_test "3.4: Invalid token format"

INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/isLogged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-12345")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
BODY=$(echo "$INVALID_RESPONSE" | sed '$d')

if [ $HTTP_CODE -eq 401 ]; then
    echo -e "${GREEN}✓ Invalid token rejected (HTTP 401)${NC}"
    if echo "$BODY" | grep -q "TOKEN_INVALID"; then
        echo -e "${GREEN}✓ Response contains TOKEN_INVALID${NC}"
    fi
else
    echo -e "${RED}✗ Expected 401, got HTTP $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# ============================================
# Test 4.1: verifyToken middleware
# ============================================
print_test "4.1: verifyToken middleware - getProductByID"

echo -e "${YELLOW}IMPORTANT: Before running this test, manually set last_activity_at to 8 days ago:${NC}"
echo "  UPDATE usuario SET last_activity_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE email = '$TEST_EMAIL';"
echo ""
read -p "Press Enter after updating the database..."

PRODUCT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/db/getProductByID?id=1" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$PRODUCT_RESPONSE" | tail -n1)
BODY=$(echo "$PRODUCT_RESPONSE" | sed '$d')

if [ $HTTP_CODE -eq 401 ]; then
    echo -e "${GREEN}✓ Idle timeout enforced in verifyToken middleware${NC}"
else
    echo -e "${RED}✗ Expected 401, got HTTP $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# ============================================
# Test 4.2: verifyTokenOrTableName middleware
# ============================================
print_test "4.2: verifyTokenOrTableName middleware"

echo -e "${YELLOW}IMPORTANT: Before running this test, manually set last_activity_at to 8 days ago:${NC}"
echo "  UPDATE usuario SET last_activity_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE email = '$TEST_EMAIL';"
echo ""
read -p "Press Enter after updating the database..."

TABLE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/db/getTable?tableName=usuario" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$TABLE_RESPONSE" | tail -n1)
BODY=$(echo "$TABLE_RESPONSE" | sed '$d')

if [ $HTTP_CODE -eq 401 ]; then
    echo -e "${GREEN}✓ Idle timeout enforced in verifyTokenOrTableName middleware${NC}"
else
    echo -e "${RED}✗ Expected 401, got HTTP $HTTP_CODE${NC}"
fi
echo "Response: $BODY"
echo ""

# Test whitelisted table (should not require token)
print_test "4.2b: Whitelisted table (producto) - no token required"

WHITELIST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/db/getTable?tableName=producto")

HTTP_CODE=$(echo "$WHITELIST_RESPONSE" | tail -n1)

if [ $HTTP_CODE -eq 200 ]; then
    echo -e "${GREEN}✓ Whitelisted table accessible without token${NC}"
else
    echo -e "${RED}✗ Expected 200, got HTTP $HTTP_CODE${NC}"
fi
echo ""

# ============================================
# Test 4.3: allowAdmin middleware
# ============================================
print_test "4.3: allowAdmin middleware"

# Login as admin first
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"rememberme\":false}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ Admin login failed${NC}"
    echo "Skipping admin tests..."
else
    echo -e "${GREEN}✓ Admin login successful${NC}"
    echo ""
    
    echo -e "${YELLOW}IMPORTANT: Before running this test, manually set last_activity_at to 8 days ago:${NC}"
    echo "  UPDATE usuario SET last_activity_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE email = '$ADMIN_EMAIL';"
    echo ""
    read -p "Press Enter after updating the database..."
    
    ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/db/updateProductsOrder" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d '{"newProductsOrderArr":[]}')
    
    HTTP_CODE=$(echo "$ADMIN_RESPONSE" | tail -n1)
    BODY=$(echo "$ADMIN_RESPONSE" | sed '$d')
    
    if [ $HTTP_CODE -eq 401 ]; then
        echo -e "${GREEN}✓ Idle timeout enforced in allowAdmin middleware${NC}"
    else
        echo -e "${RED}✗ Expected 401, got HTTP $HTTP_CODE${NC}"
    fi
    echo "Response: $BODY"
fi
echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="
echo ""
echo "NOTE: Some tests require manual database updates."
echo "Review the test output above and verify database state."
echo ""
echo "To verify last_activity_at in database:"
echo "  SELECT id, email, last_activity_at FROM usuario WHERE email = '$TEST_EMAIL';"

