# Deployment Guide - Updated Webhook Proxy

## What Changed?

The proxy now supports **TWO webhook endpoints**:
1. `/webhook` → Forwards to `stripe-webhook` (Original Stripe account)
2. `/subscription-webhook` → Forwards to `stripe-subscription-webhook` (Subscription Stripe account)

## How to Deploy on Render

### Step 1: Deploy Updated Code

1. **Commit and push** the updated proxy code to your GitHub repo:
   ```bash
   cd stripe-webhook-proxy
   git add .
   git commit -m "Add subscription webhook support"
   git push
   ```

2. **Render will auto-deploy** the changes (if auto-deploy is enabled)
   - Or manually trigger a deploy in Render dashboard

### Step 2: Configure Subscription Stripe Webhook

1. Go to your **NEW Subscription Stripe Account** dashboard
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter webhook URL:
   ```
   https://your-service.onrender.com/subscription-webhook
   ```
   (Replace `your-service.onrender.com` with your actual Render URL)

5. Select events to listen for:
   - ✅ `checkout.session.completed`

6. Click **Add endpoint**

7. **Copy the webhook signing secret** (starts with `whsec_...`)

### Step 3: Update Edge Function Environment Variables

In **Supabase Dashboard** → **Edge Functions** → **stripe-subscription-webhook**:

1. Add environment variable:
   - Key: `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`
   - Value: `whsec_...` (the signing secret from Step 2.7)

### Step 4: Test the Webhook

1. In Subscription Stripe Dashboard → Webhooks → Your new webhook
2. Click **Send test webhook**
3. Select event: `checkout.session.completed`
4. Click **Send test webhook**

Expected result:
- ✅ Status: `200 OK`
- ✅ Response: `{"received":true}`

If you get **401 Unauthorized**:
- Check that `SUPABASE_ANON_KEY` is set in Render environment variables
- Verify the webhook secret is correct in Supabase

## Webhook URLs Summary

| Stripe Account | Webhook URL | Edge Function | Events |
|----------------|-------------|---------------|--------|
| **Original** | `https://your-service.onrender.com/webhook` | `stripe-webhook` | `payment_intent.succeeded` |
| **Subscription** | `https://your-service.onrender.com/subscription-webhook` | `stripe-subscription-webhook` | `checkout.session.completed` |

## Troubleshooting

### 401 Error
- **Cause**: Missing or invalid `SUPABASE_ANON_KEY`
- **Fix**: Set `SUPABASE_ANON_KEY` in Render environment variables

### 400 Error
- **Cause**: Invalid webhook signature
- **Fix**: Verify `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` is correct

### 404 Error
- **Cause**: Wrong URL or Edge Function doesn't exist
- **Fix**: Check Edge Function is deployed and URL is correct

## Testing Locally

```bash
cd stripe-webhook-proxy
npm install
SUPABASE_ANON_KEY=your_key npm start
```

Test with curl:
```bash
# Test original webhook
curl -X POST http://localhost:3001/webhook

# Test subscription webhook
curl -X POST http://localhost:3001/subscription-webhook
```

