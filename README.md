# Stripe Webhook Proxy

This proxy server sits between Stripe and your Supabase Edge Function, adding the required `apikey` header that Supabase needs for authentication.

## Setup on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `stripe-webhook-proxy`
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variable `PORT` (Render will provide this automatically)

## Stripe Webhook Configuration

In your Stripe Dashboard:
1. Go to Webhooks → Add endpoint
2. Use your Render service URL: `https://your-service.onrender.com/`
3. Select events: `checkout.session.completed` and `payment_intent.succeeded`
4. Save the webhook

The proxy will forward all webhooks to your Supabase Edge Function with the required authentication headers.
