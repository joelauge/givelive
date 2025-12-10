# 🔐 Vercel Environment Variables Setup Guide

## Required Environment Variables for GiveLive

You need to add these environment variables to your Vercel project for SMS to work:

### 1. Navigate to Vercel Dashboard
Go to: https://vercel.com/joel-auges-projects/givelive/settings/environment-variables

### 2. Add These Variables (one by one)

#### TWILIO_ACCOUNT_SID
- Name: `TWILIO_ACCOUNT_SID`
- Value: `AC79a519f51d71473e52...` (from your .env file)
- Environment: Production, Preview, Development

#### TWILIO_AUTH_TOKEN
- Name: `TWILIO_AUTH_TOKEN`
- Value: `7ec22123c27d5ea80a24...` (from your .env file)
- Environment: Production, Preview, Development

#### TWILIO_PHONE_NUMBER  
- Name: `TWILIO_PHONE_NUMBER`
- Value: `+18079091625`
- Environment: Production, Preview, Development

#### DATABASE_URL
- Name: `DATABASE_URL`  
- Value: Your Supabase connection string
- Environment: Production, Preview, Development

### 3. After Adding Variables

You need to redeploy for the changes to take effect:

```bash
npx vercel --prod
```

Or just push to your git repository if you have automatic deployments enabled.

### 4. Test SMS Sending

Once redeployed, test with:

```bash
./test-sms-production.sh
```

You should see `{"success":true,"message":"SMS sent via Twilio"}` instead of an error!

## 📱 To Send to Your Phone

Replace the curl command with your actual phone number (must include country code):

```bash
curl -X POST https://givelive.vercel.app/api/sms/send \
  -H 'Content-Type: application/json' \
  -d '{"to": "+1YOUR_PHONE_NUMBER", "body": "Test from GiveLive!"}'
```

## ✅ Troubleshooting

If SMS still doesn't send:
1. Check Vercel logs: `npx vercel logs`
2. Verify Twilio account is active
3. Check that your Twilio phone number is verified
4. Ensure the recipient number is in E.164 format (+1XXXXXXXXXX)
