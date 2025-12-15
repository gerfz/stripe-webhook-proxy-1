# Stripe Webhook Proxy

This proxy server sits between Stripe and your Supabase Edge Functions, adding the required `apikey` header that Supabase needs for authentication.

**Supports TWO Stripe accounts:**
- **Original Stripe** → `/webhook` → `stripe-webhook` Edge Function
- **Subscription Stripe** → `/subscription-webhook` → `stripe-subscription-webhook` Edge Function

## Setup on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `stripe-webhook-proxy`
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variable `PORT` (Render will provide this automatically)
7. Set environment variable `SUPABASE_ANON_KEY` (your Supabase anon key)
8. Set environment variable `SUPABASE_WEBHOOK_URL` (optional, defaults to Supabase function URL)

## Keep-Alive Configuration (Prevent Server Spin-Down)

The server includes automatic keep-alive functionality that pings itself every 10 minutes to prevent spin-down on free tiers.

### Option 1: Use Built-in Self-Ping (Default)
The server automatically pings itself every 10 minutes. This works if your server can reach itself via HTTP.

### Option 2: External Cron Service (Recommended for Free Tiers)
Use a free cron service like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping your server:

1. **cron-job.org**:
   - Create account at https://cron-job.org
   - Add new cron job
   - URL: `https://your-service.onrender.com/ping`
   - Schedule: Every 5 minutes
   - Save

2. **UptimeRobot**:
   - Create account at https://uptimerobot.com
   - Add new monitor
   - Type: HTTP(s)
   - URL: `https://your-service.onrender.com/ping`
   - Interval: 5 minutes
   - Save

### Keep-Alive Endpoints
- `GET /ping` - Keep-alive endpoint
- `GET /keepalive` - Alternative keep-alive endpoint
- `GET /health` - Health check endpoint

All return: `{ status: 'ok', message: 'Server is awake', timestamp: '...' }`

## Stripe Webhook Configuration

### Original Stripe Account (Customer Payments)
In your **Original** Stripe Dashboard:
1. Go to Webhooks → Add endpoint
2. Use: `https://your-service.onrender.com/webhook`
3. Select events: `payment_intent.succeeded`
4. Save the webhook

### Subscription Stripe Account (Contractor Top-Ups)
In your **Subscription** Stripe Dashboard:
1. Go to Webhooks → Add endpoint
2. Use: `https://your-service.onrender.com/subscription-webhook`
3. Select events: `checkout.session.completed`
4. Save the webhook

The proxy will forward all webhooks to the appropriate Supabase Edge Function with the required authentication headers.

## Environment Variables

- `PORT` - Server port (usually set automatically by hosting service)
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key (required)
- `SUPABASE_WEBHOOK_URL` - Original Stripe webhook function URL (optional, has default)
- `SUPABASE_SUBSCRIPTION_WEBHOOK_URL` - Subscription Stripe webhook function URL (optional, has default)
- `ENABLE_KEEPALIVE` - Set to `false` to disable self-ping (default: enabled)
- `KEEPALIVE_URL` - Custom URL for self-ping (default: `http://localhost:${PORT}`)
