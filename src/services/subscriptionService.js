import { getUser, getSession, updateUserPreferences } from './authService';
import backendApi from './deepseekApi';

const SUBSCRIPTION_KEY = 'subscriptionPlan';
const PREMIUM_END_KEY = 'premium_end_date';

export const getSubscriptionPlan = () => {
  try {
    const plan = localStorage.getItem(SUBSCRIPTION_KEY);
    if (plan === 'premium') {
      const endIso = localStorage.getItem(PREMIUM_END_KEY);
      if (!endIso) return 'free';
      const now = Date.now();
      const end = Date.parse(endIso);
      return end > now ? 'premium' : 'free';
    }
    return 'free';
  } catch (_e) {
    return 'free';
  }
};

export const isPremium = () => getSubscriptionPlan() === 'premium';

// Sync subscription from backend (for authenticated users)
export const syncSubscriptionFromBackend = async () => {
  try {
    const user = await getUser();
    if (!user) return getSubscriptionPlan();
    const session = await getSession();
    const token = session?.access_token;
    if (!token) return getSubscriptionPlan();
    const res = await backendApi.get('/api/subscription/status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const plan = res.data?.plan === 'premium' ? 'premium' : 'free';
    // Persist dates if provided for client-side gating
    if (res.data?.premium_end_date) {
      try { localStorage.setItem(PREMIUM_END_KEY, res.data.premium_end_date); } catch (_) {}
    }
    localStorage.setItem(SUBSCRIPTION_KEY, plan);
    return plan;
  } catch (_e) {
    return getSubscriptionPlan();
  }
};

export const subscribePremium = async () => {
  const user = await getUser();
  if (!user) {
    const err = new Error('AUTH_REQUIRED');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }

  try {
    const session = await getSession();
    const token = session?.access_token;
    if (!token) {
      const err = new Error('AUTH_REQUIRED');
      err.code = 'AUTH_REQUIRED';
      throw err;
    }

    const res = await backendApi.post('/api/subscription/upgrade', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Persist locally for faster gating
    localStorage.setItem(SUBSCRIPTION_KEY, 'premium');
    if (res?.data?.premium_end_date) {
      try { localStorage.setItem(PREMIUM_END_KEY, res.data.premium_end_date); } catch (_) {}
    }
    if (user?.id) {
      try {
        await updateUserPreferences(user.id, { subscription_plan: 'premium' });
      } catch (_err) {}
    }
    return true;
  } catch (e) {
    const message = e?.response?.data?.error || e?.message || '';
    if (message.toLowerCase().includes('already')) {
      // Sync local state and surface clear code
      localStorage.setItem(SUBSCRIPTION_KEY, 'premium');
      const err = new Error('ALREADY_PREMIUM');
      err.code = 'ALREADY_PREMIUM';
      throw err;
    }
    throw e;
  }
};

export const downgradeToFree = async () => {
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, 'free');
    const user = await getUser();
    if (user?.id) {
      try {
        await updateUserPreferences(user.id, { subscription_plan: 'free' });
      } catch (_err) {
        // Ignore schema mismatches
      }
    }
    return true;
  } catch (_e) {
    return false;
  }
};


