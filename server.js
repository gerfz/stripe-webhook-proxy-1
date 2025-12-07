/**
 * Simple Express Server for Stripe Webhook Proxy
 * 
 * Works on: Railway, Render, Heroku, Fly.io, or any Node.js hosting
 * 
 * Deploy:
 * 1. Install dependencies: npm install
 * 2. Set environment variables:
 *    - SUPABASE_ANON_KEY
 *    - SUPABASE_WEBHOOK_URL (optional)
 * 3. Start: node server.js
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'https://tdaphliwtyqffhwuxtfx.supabase.co/functions/v1/stripe-webhook';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Middleware to capture raw body for Stripe signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.post('/webhook', async (req, res) => {
  // Get the Stripe signature from headers
  const stripeSignature = req.headers['stripe-signature'];
  
  if (!stripeSignature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!SUPABASE_ANON_KEY) {
    console.error('SUPABASE_ANON_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Get raw body as string
    const rawBody = req.body.toString('utf8');

    // Forward the webhook to Supabase with the apikey header
    const response = await fetch(SUPABASE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'stripe-signature': stripeSignature,
        'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: rawBody,
    });

    const data = await response.json();
    
    // Return the same status code and response from Supabase
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Keep-alive endpoint (ping this to prevent server spin-down)
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is awake',
    timestamp: new Date().toISOString() 
  });
});

// Keep-alive endpoint (alternative name)
app.get('/keepalive', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is awake',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Stripe webhook proxy running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`Keep-alive endpoint: http://localhost:${PORT}/ping`);
  
  // Self-ping every 10 minutes to keep server awake (if running on free tier)
  // This prevents the server from spinning down due to inactivity
  if (process.env.ENABLE_KEEPALIVE !== 'false') {
    const keepAliveInterval = setInterval(async () => {
      try {
        const baseUrl = process.env.KEEPALIVE_URL || `http://localhost:${PORT}`;
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

