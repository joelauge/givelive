#!/bin/bash
# Test SMS sending on production

PRODUCTION_URL="https://givelive.vercel.app"

echo "📱 Testing Production SMS Endpoint..."
echo "URL: $PRODUCTION_URL/api/sms/send"
echo ""

# Test with Twilio's magic test number
curl -X POST "$PRODUCTION_URL/api/sms/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15005550006",
    "body": "Production test from GiveLive! 🚀"
  }' \
  -v 2>&1 | grep -A 50 "HTTP"

echo ""
echo ""
echo "✅ If you see 'success: true', Twilio is working!"
echo "⚠️  Note: +15005550006 is a Twilio test number"
echo ""
echo "To test with YOUR phone number, run:"
echo "curl -X POST $PRODUCTION_URL/api/sms/send \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"to\": \"+1YOUR_PHONE\", \"body\": \"Test from GiveLive!\"}'"
