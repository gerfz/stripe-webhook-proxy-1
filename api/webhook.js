/**
 * Stripe Webhook Proxy for Vercel
 * 
 * Deploy: vercel --prod
 * Set env vars: vercel env add SUPABASE_ANON_KEY
 */

const SUPABASE_WEBHOOK_URL = process.env.SUPABASE_WEBHOOK_URL || 'https://tdaphliwtyqffhwuxtfx.supabase.co/functions/v1/stripe-webhook';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    // Get raw body - Stripe sends as raw text
    // Vercel automatically parses JSON, but we need the raw string for signature verification
    // We'll stringify it back since Supabase function expects it
    const rawBody = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);

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
}

