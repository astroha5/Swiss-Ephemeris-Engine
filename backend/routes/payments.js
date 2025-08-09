const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const { createAuthedClient } = require('../config/supabase');
const logger = require('../utils/logger');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Auth middleware using Supabase access token
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const client = createAuthedClient(token);
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.supabase = client;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Public: expose Razorpay key id to frontend
router.get('/config', (req, res) => {
  if (!RAZORPAY_KEY_ID) {
    return res.json({ key_id: null, configured: false });
  }
  return res.json({ key_id: RAZORPAY_KEY_ID, configured: true });
});

// Create an order
router.post('/order', requireAuth, async (req, res) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(501).json({ error: 'Payments not configured' });
    }

    const { amount = 9900, currency = 'INR', receipt = undefined, notes = {} } = req.body || {};
    const payload = {
      amount, // in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        user_id: req.user.id,
        ...notes
      }
    };

    const r = await axios.post('https://api.razorpay.com/v1/orders', payload, {
      auth: {
        username: RAZORPAY_KEY_ID,
        password: RAZORPAY_KEY_SECRET
      }
    });

    return res.json({ order: r.data });
  } catch (err) {
    logger.error('Create order error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment signature and activate premium
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }
    if (!RAZORPAY_KEY_SECRET) {
      return res.status(501).json({ error: 'Payments not configured' });
    }

    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');
    const valid = expectedSignature === razorpay_signature;
    if (!valid) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Activate premium for 30 days from now
    const start = new Date();
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 30);
    const premium_start_date = start.toISOString();
    const premium_end_date = end.toISOString();

    const client = req.supabase;
    const userId = req.user.id;

    // Ensure preferences row exists and update
    const { data: pref } = await client
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!pref) {
      const { error: insertErr } = await client
        .from('user_preferences')
        .insert({ user_id: userId, plan: 'premium', premium_start_date, premium_end_date })
        .single();
      if (insertErr) {
        logger.error('Insert preferences error:', insertErr.message);
        return res.status(500).json({ error: 'Failed to activate subscription' });
      }
    } else {
      const { error: updateErr } = await client
        .from('user_preferences')
        .update({ plan: 'premium', premium_start_date, premium_end_date })
        .eq('user_id', userId)
        .single();
      if (updateErr) {
        logger.error('Update preferences error:', updateErr.message);
        return res.status(500).json({ error: 'Failed to activate subscription' });
      }
    }

    return res.json({ success: true, plan: 'premium', premium_start_date, premium_end_date });
  } catch (err) {
    logger.error('Payment verify error:', err.message);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;


