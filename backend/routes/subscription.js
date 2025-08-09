const express = require('express');
const router = express.Router();
const { createAuthedClient } = require('../config/supabase');
const logger = require('../utils/logger');

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
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Helper: compute active premium status
function isPremiumActive(plan, premiumEndIso) {
  if (plan !== 'premium') return false;
  if (!premiumEndIso) return false;
  const now = new Date();
  const end = new Date(premiumEndIso);
  return end.getTime() > now.getTime();
}

// Get current subscription status (plan + dates)
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = createAuthedClient(req.headers.authorization.replace('Bearer ', ''));
    const { data, error } = await client
      .from('user_preferences')
      .select('plan,premium_start_date,premium_end_date,subscription_plan')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.warn('Get subscription status error:', error.message);
    }

    // Lazily create default row for new/existing users without preferences
    let record = data;
    if (!record) {
      const { data: inserted, error: insertErr } = await client
        .from('user_preferences')
        .insert({ user_id: userId, plan: 'free' })
        .select('plan,premium_start_date,premium_end_date,subscription_plan')
        .single();
      if (insertErr) {
        logger.warn('Preferences auto-create failed:', insertErr.message);
      } else {
        record = inserted;
      }
    }

    // Backward compatibility fallback
    const plan = record?.plan || (record?.subscription_plan === 'premium' ? 'premium' : 'free') || 'free';
    const premium_start_date = record?.premium_start_date || null;
    const premium_end_date = record?.premium_end_date || null;
    const active = isPremiumActive(plan, premium_end_date);

    return res.json({ plan: active ? 'premium' : 'free', premium_start_date, premium_end_date, active });
  } catch (err) {
    logger.error('Status endpoint error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Upgrade to premium (idempotent)
router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = createAuthedClient(req.headers.authorization.replace('Bearer ', ''));

    // Read current status
    const { data: pref, error: readErr } = await client
      .from('user_preferences')
      .select('user_id,plan,premium_start_date,premium_end_date,subscription_plan')
      .eq('user_id', userId)
      .single();

    if (readErr && readErr.code !== 'PGRST116') {
      logger.warn('Read preferences error:', readErr.message);
    }

    const currentPlan = pref?.plan || (pref?.subscription_plan === 'premium' ? 'premium' : 'free') || 'free';
    const currentEnd = pref?.premium_end_date || null;
    const active = isPremiumActive(currentPlan, currentEnd);
    if (active) {
      return res.status(409).json({ error: `You already have an active Premium plan until ${new Date(currentEnd).toISOString()}` });
    }

    // Compute month window (30 days)
    const start = new Date();
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 30);
    const premium_start_date = start.toISOString();
    const premium_end_date = end.toISOString();

    // Ensure preferences row exists, then update plan and dates
    if (!pref) {
      const { error: insertErr } = await client
        .from('user_preferences')
        .insert({ user_id: userId, plan: 'premium', premium_start_date, premium_end_date })
        .select('plan,premium_start_date,premium_end_date')
        .single();
      if (insertErr) {
        logger.error('Insert preferences error:', insertErr.message);
        return res.status(500).json({ error: 'Failed to create subscription record' });
      }
      return res.json({ success: true, plan: 'premium', premium_start_date, premium_end_date });
    }

    // Update existing record
    const { data: updated, error: updateErr } = await client
      .from('user_preferences')
      .update({ plan: 'premium', premium_start_date, premium_end_date })
      .eq('user_id', userId)
      .select('plan,premium_start_date,premium_end_date')
      .single();
    if (updateErr) {
      logger.error('Update preferences error:', updateErr.message);
      return res.status(500).json({ error: 'Failed to upgrade subscription' });
    }

    return res.json({ success: true, plan: updated.plan || 'premium', premium_start_date, premium_end_date });
  } catch (err) {
    logger.error('Upgrade endpoint error:', err.message);
    return res.status(500).json({ error: 'Upgrade failed' });
  }
});

module.exports = router;


