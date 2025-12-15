const express = require('express');
const app = express();

// Your Supabase anon key (needed to authenticate with Edge Function)
// Use environment variable in production, fallback to hardcoded for development
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYXBobGl3dHlxZmZod3V4dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTA4ODYsImV4cCI6MjA3OTI4Njg4Nn0.0G05mSpgnECZuWPK63J9kHUVlcy3LaI8fwM8TJpAxIM';

// Edge Function URLs
const SUPABASE_BASE_URL = 'https://tdaphliwtyqffhwuxtfx.supabase.co/functions/v1';
const STRIPE_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || `${SUPABASE_BASE_URL}/stripe-webhook`;
const STRIPE_SUBSCRIPTION_WEBHOOK_URL = process.env.SUPABASE_SUBSCRIPTION_WEBHOOK_URL || `${SUPABASE_BASE_URL}/stripe-subscription-webhook`;

// Middleware to parse raw body (required for Stripe signature verification)
app.use(express.raw({ type: 'application/json' }));

// Generic proxy handler
const proxyWebhook = (targetUrl, webhookName) => async (req, res) => {
  try {
    // Check if SUPABASE_ANON_KEY is set
    if (!SUPABASE_ANON_KEY) {
      console.error('ERROR: SUPABASE_ANON_KEY is not set! Set it as an environment variable.');
      return res.status(500).json({ 
        error: 'Server configuration error', 
        message: 'SUPABASE_ANON_KEY environment variable is not set' 
      });
    }
    
    console.log(`[${webhookName}] Proxying webhook to Supabase Edge Function`);
    console.log(`[${webhookName}] Target URL:`, targetUrl);
    
    // Forward the request to Supabase Edge Function with apikey header
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        // Forward Stripe signature header (required for webhook verification)
        'stripe-signature': req.headers['stripe-signature'] || '',
      },
      body: req.body,
    });

    const responseText = await response.text();
    
    console.log(`[${webhookName}] Supabase response status:`, response.status);
    console.log(`[${webhookName}] Supabase response:`, responseText.substring(0, 200));

    // Forward the response
    res.status(response.status).send(responseText);
  } catch (error) {
    console.error(`[${webhookName}] Proxy error:`, error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
};

// Route 1: Original Stripe webhook (customer payments)
app.post('/', proxyWebhook(STRIPE_WEBHOOK_URL, 'stripe-webhook'));
app.post('/webhook', proxyWebhook(STRIPE_WEBHOOK_URL, 'stripe-webhook'));

// Route 2: Subscription Stripe webhook (contractor marketing top-ups)
app.post('/subscription-webhook', proxyWebhook(STRIPE_SUBSCRIPTION_WEBHOOK_URL, 'stripe-subscription-webhook'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stripe-webhook-proxy' });
});

// Keep-alive endpoint (ping this to prevent server spin-down)
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is awake',
    service: 'stripe-webhook-proxy',
    timestamp: new Date().toISOString() 
  });
});

// Keep-alive endpoint (alternative name)
app.get('/keepalive', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is awake',
    service: 'stripe-webhook-proxy',
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n=== Stripe Webhook Proxy Running ===`);
  console.log(`Port: ${PORT}`);
  console.log(`\nWebhook Endpoints:`);
  console.log(`  - Original Stripe:      https://your-service.onrender.com/webhook`);
  console.log(`  - Subscription Stripe:  https://your-service.onrender.com/subscription-webhook`);
  console.log(`\nHealth Endpoints:`);
  console.log(`  - Health check: https://your-service.onrender.com/health`);
  console.log(`  - Keep-alive:   https://your-service.onrender.com/ping`);
  
  // Self-ping every 10 minutes to keep server awake (if running on free tier)
  // This prevents the server from spinning down due to inactivity
  if (process.env.ENABLE_KEEPALIVE !== 'false') {
    const keepAliveInterval = setInterval(async () => {
      try {
        // Use the Render service URL if available, otherwise localhost
        const baseUrl = process.env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const response = await fetch(`${baseUrl}/ping`);
        if (response.ok) {
          console.log('✓ Keep-alive ping successful:', new Date().toISOString());
        } else {
          console.warn('⚠ Keep-alive ping failed:', response.status);
        }
      } catch (error) {
        console.warn('⚠ Keep-alive ping error (this is normal if server is external):', error.message);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    // Clean up on process exit
    process.on('SIGTERM', () => clearInterval(keepAliveInterval));
    process.on('SIGINT', () => clearInterval(keepAliveInterval));
    
    console.log('✓ Keep-alive enabled (pings every 10 minutes)');
  }
});

