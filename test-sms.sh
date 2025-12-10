#!/bin/bash
# Test SMS sending via the GiveLive API

# Load environment variables
cd server && source .env

# Check if Twilio credentials are set
echo "🔍 Checking Twilio Configuration..."
echo "TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID:0:20}..." 
echo "TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN:0:20}..."
echo "TWILIO_PHONE_NUMBER: $TWILIO_PHONE_NUMBER"
echo ""

# Test the SMS endpoint
echo "📱 Testing SMS Send Endpoint..."
echo "Sending to: +15005550006 (Twilio test number)"
echo ""

curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15005550006",
    "body": "Test message from GiveLive! 🚀"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"
