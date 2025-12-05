const express = require('express');
const app = express();

// Your Supabase anon key (needed to authenticate with Edge Function)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYXBobGl3dHlxZmZod3V4dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTA4ODYsImV4cCI6MjA3OTI4Njg4Nn0.0G05mSpgnECZuWPK63J9kHUVlcy3LaI8fwM8TJpAxIM';
const SUPABASE_EDGE_FUNCTION_URL = 'https://tdaphliwtyqffhwuxtfx.supabase.co/functions/v1/stripe-webhook';

// Middleware to parse raw body (required for Stripe signature verification)
app.use(express.raw({ type: 'application/json' }));

// Proxy endpoint
app.post('/', async (req, res) => {
  try {
    console.log('Proxying webhook to Supabase Edge Function');
    
    // Forward the request to Supabase Edge Function with apikey header
    const response = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        // Forward all Stripe headers
        'stripe-signature': req.headers['stripe-signature'] || '',
      },
      body: req.body,
    });

    const responseText = await response.text();
    
    console.log('Supabase response status:', response.status);
    console.log('Supabase response:', responseText);

    // Forward the response
    res.status(response.status).send(responseText);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stripe-webhook-proxy' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Stripe webhook proxy running on port ${PORT}`);
  console.log(`Webhook URL: https://your-domain.com/webhook`);
});

