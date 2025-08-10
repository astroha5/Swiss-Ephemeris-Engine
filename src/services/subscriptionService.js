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

    // 1) Get Razorpay config
    const cfg = await backendApi.get('/api/payments/config');
    const keyId = cfg?.data?.key_id;
    const allowFallback = import.meta.env.VITE_ALLOW_PAYMENT_FALLBACK === 'true';
    const isProd = !!import.meta.env.PROD;

    if (keyId) {
      // 2) Create order (₹99 => 9900 paise)
      const orderRes = await backendApi.post('/api/payments/order', { amount: 9900, currency: 'INR' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const order = orderRes?.data?.order;
      if (!order?.id) {
        throw new Error('Failed to create payment order');
      }

      // 3) Launch Razorpay Checkout (dynamically)
      await new Promise((resolve, reject) => {
        // Ensure Razorpay script is available
        if (!window.Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        } else {
          resolve();
        }
      });

      const paymentResponse = await new Promise((resolve, reject) => {
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'Astrova Premium',
          description: 'Monthly subscription',
          order_id: order.id,
          prefill: {
            email: user?.email || '',
            contact: ''
          },
          theme: { color: '#4f46e5' },
          handler: (resp) => resolve(resp)
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => reject(new Error(resp?.error?.description || 'Payment failed')));
        rzp.open();
      });

      // 4) Verify payment
      const verifyRes = await backendApi.post('/api/payments/verify', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      }, { headers: { Authorization: `Bearer ${token}` } });

      localStorage.setItem(SUBSCRIPTION_KEY, 'premium');
      if (verifyRes?.data?.premium_end_date) {
        try { localStorage.setItem(PREMIUM_END_KEY, verifyRes.data.premium_end_date); } catch (_) {}
      }
      if (user?.id) {
        try {
          await updateUserPreferences(user.id, { subscription_plan: 'premium' });
        } catch (_err) {}
      }
      return true;
    }

    // Fallback only allowed in non-production or when explicitly enabled
    if (!isProd || allowFallback) {
      const res = await backendApi.post('/api/subscription/upgrade', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    }

    throw new Error('PAYMENTS_NOT_CONFIGURED');
  } catch (e) {
    const message = e?.response?.data?.error || e?.message || '';
    if (message.toLowerCase().includes('already')) {
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


