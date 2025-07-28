#!/bin/bash

# Test script for Outfit Database API
# Domain: rblxdb.starkrblx.com
# API Key: Luabearygood98765

API_ENDPOINT="https://rblxdb.starkrblx.com"
API_KEY="Luabearygood98765"

echo "=== Testing Outfit Database API ==="
echo "Domain: $API_ENDPOINT"
echo "API Key: $API_KEY"
echo

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$API_ENDPOINT/health" | jq .
echo -e "\n"

# Test 2: Upload Outfit
echo "2. Testing Upload Outfit..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_ENDPOINT/api/UploadOutfit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "Name": "Test Summer Outfit",
    "AccessoryData": "{\"hat\": 123456, \"shirt\": 789012, \"pants\": 345678, \"face\": 901234}",
    "Price": 150,
    "SerializedDescription": {
      "description": "A cool test outfit for summer",
      "tags": ["summer", "test", "trendy"]
    },
    "OtherMetadata": {
      "creator": "TestUser",
      "season": "summer"
    }
  }')

echo "Upload Response: $UPLOAD_RESPONSE"
OUTFIT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.')
echo "Outfit ID: $OUTFIT_ID"
echo

# Test 3: Upload another outfit for testing
echo "3. Testing Upload Second Outfit..."
UPLOAD_RESPONSE2=$(curl -s -X POST "$API_ENDPOINT/api/UploadOutfit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "Name": "Winter Style Outfit",
    "AccessoryData": "{\"hat\": 111111, \"shirt\": 222222, \"pants\": 333333}",
    "Price": 200,
    "SerializedDescription": {
      "description": "A warm winter outfit",
      "tags": ["winter", "warm", "stylish"]
    },
    "OtherMetadata": {
      "creator": "TestUser2",
      "season": "winter"
    }
  }')

echo "Upload Response 2: $UPLOAD_RESPONSE2"
OUTFIT_ID2=$(echo $UPLOAD_RESPONSE2 | jq -r '.')
echo "Outfit ID 2: $OUTFIT_ID2"
echo

# Test 4: Get Outfit Details
echo "4. Testing Get Outfit Details..."
curl -s -X POST "$API_ENDPOINT/api/GetOutfitDetails" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"OutfitUniqueIds\": {
      \"1\": $OUTFIT_ID,
      \"2\": $OUTFIT_ID2,
      \"3\": 999999999
    }
  }" | jq .
echo

# Test 5: Search Outfits - Newest
echo "5. Testing Search Outfits (Newest)..."
curl -s -X POST "$API_ENDPOINT/api/SearchOutfitsAsync" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "SortType": "Newest",
    "Amount": 10,
    "SearchKeyword": ""
  }' | jq .
echo

# Test 6: Search Outfits with Keyword
echo "6. Testing Search Outfits with Keyword (Summer)..."
curl -s -X POST "$API_ENDPOINT/api/SearchOutfitsAsync" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "SortType": "Newest",
    "Amount": 5,
    "SearchKeyword": "Summer"
  }' | jq .
echo

# Test 7: Increment Views
echo "7. Testing Increment Views..."
curl -s -X POST "$API_ENDPOINT/api/IncrementViews" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "[$OUTFIT_ID, $OUTFIT_ID2]" | jq .
echo

# Test 8: Increment Favourites
echo "8. Testing Increment Favourites..."
curl -s -X POST "$API_ENDPOINT/api/IncrementFavourites" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "[$OUTFIT_ID]" | jq .
echo

# Test 9: Get Updated Outfit Details (should show incremented stats)
echo "9. Testing Updated Outfit Details (with incremented stats)..."
curl -s -X POST "$API_ENDPOINT/api/GetOutfitDetails" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"OutfitUniqueIds\": {
      \"1\": $OUTFIT_ID,
      \"2\": $OUTFIT_ID2
    }
  }" | jq .
echo

# Test 10: Invalid API Key
echo "10. Testing Invalid API Key..."
curl -s -X POST "$API_ENDPOINT/api/SearchOutfitsAsync" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key" \
  -d '{
    "SortType": "Newest",
    "Amount": 5
  }' | jq .
echo

# Test 11: Popular Sort
echo "11. Testing Search Outfits (Popular Sort)..."
curl -s -X POST "$API_ENDPOINT/api/SearchOutfitsAsync" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "SortType": "Popular",
    "Amount": 5,
    "SearchKeyword": ""
  }' | jq .
echo

echo "=== All Tests Completed ===" 