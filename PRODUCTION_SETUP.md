# Webhook Proxy - Production Setup

## ✅ Good News: No Stripe Keys Needed!

The webhook proxy **does NOT need** Stripe secret keys or webhook secrets. It only forwards webhooks to your Supabase Edge Function, which handles all Stripe verification.

## Environment Variables Required

On your hosting service (Render/Railway/etc), you only need:

1. **`SUPABASE_ANON_KEY`** (Required)
   - Your Supabase anonymous key
   - Get it from: https://supabase.com/dashboard/project/tdaphliwtyqffhwuxtfx/settings/api
   - Copy the **anon/public** key (starts with `eyJ...`)

2. **`SUPABASE_WEBHOOK_URL`** (Optional - has default)
   - Default: `https://tdaphliwtyqffhwuxtfx.supabase.co/functions/v1/stripe-webhook`
   - Only set if your Supabase URL is different

3. **`PORT`** (Usually auto-set by hosting)
   - Your hosting service will provide this automatically

## What Gets Updated Where

### Stripe Keys (NOT in proxy):
- ✅ **Stripe Secret Key** (`sk_live_...`) → Supabase secrets (`STRIPE_SECRET_KEY`)
- ✅ **Stripe Publishable Key** (`pk_live_...`) → `public/payment.html`
- ✅ **Webhook Secret** (`whsec_...`) → Supabase secrets (`STRIPE_WEBHOOK_SECRET`)

### Proxy Only Needs:
- ✅ **Supabase Anon Key** → Proxy environment variable (`SUPABASE_ANON_KEY`)

## Stripe Webhook Configuration

When creating the webhook in Stripe Dashboard (Production mode):

1. **Endpoint URL**: `https://your-proxy-service.onrender.com/webhook`
   - Replace `your-proxy-service.onrender.com` with your actual proxy URL

2. **Events**: Select the same events as test mode:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`

3. **Headers**: NOT needed when using proxy (proxy adds them automatically)

4. **Signing Secret**: Copy this and add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Verification

After setup, test that webhooks are working:

1. Make a test payment
2. Check Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
3. Should see successful webhook deliveries (green checkmarks)
4. Check Supabase function logs:
   ```bash
   supabase functions logs stripe-webhook
   ```

## Troubleshooting

### Webhook not received
- Verify proxy URL is correct in Stripe Dashboard
- Check proxy logs on your hosting service
- Verify `SUPABASE_ANON_KEY` is set correctly

### Webhook signature verification failed
- This is handled by Supabase Edge Function, not the proxy
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Supabase secrets
- Make sure you're using the production webhook secret (not test mode secret)

