import { createClient } from '@supabase/supabase-js';

// Use explicit Vite env vars in production (Render) with safe fallbacks for dev
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ypscvzznlrxjeqkjasmb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Create Supabase client with robust browser auth settings.
 * - persistSession: true to keep the session across reloads
 * - autoRefreshToken: true for rotating refresh tokens
 * - detectSessionInUrl: handle OAuth/magic-link redirects
 * - storage: window.localStorage (only in browser)
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

/**
 * Handle user sign-up with email and password
 */
export async function signUp(email, password, userData = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // Additional user metadata
      }
    });
    
    if (error) throw error;
    
    // Create user preferences record
    if (data.user) {
      await createUserPreferences(data.user.id, email);
    }
    
    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Handle user login with email and password
 */
/**
 * Normalize Supabase auth errors to user-friendly messages
 */
function mapAuthError(error) {
  if (!error) return 'An unknown error occurred';
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Invalid email or password';
  }
  if (msg.includes('email not confirmed') || msg.includes('email not confirmed')) {
    return 'Please verify your email before signing in';
  }
  if (msg.includes('too many') || msg.includes('rate limit') || msg.includes('attempts')) {
    return 'Too many attempts. Try again in a few minutes';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again';
  }
  if (msg.includes('timeout')) {
    return 'Request timed out. Please try again';
  }
  return error.message || 'Sign in failed';
}

/**
 * Handle user login with email and password
 * - Basic client-side validation
 * - Small jittered retry for transient network errors
 * - User-friendly error normalization
 */
export async function signInWithPassword(email, password) {
  // Quick validation to avoid unnecessary network calls
  const trimmedEmail = (email || '').trim();
  const pwd = password || '';
  if (!trimmedEmail || !pwd) {
    const err = new Error('Email and password are required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // helper to actually call supabase
  const attempt = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout guard

    try {
      const { data, error } = await supabase.auth.signInWithPassword(
        { email: trimmedEmail, password: pwd },
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (error) {
        throw error;
      }
      return data;
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  };

  // Retry up to 2 times on transient issues
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const data = await attempt();
      return data;
    } catch (e) {
      lastErr = e;
      const msg = (e?.message || '').toLowerCase();
      const isAbort = e?.name === 'AbortError';
      const isTransient =
        isAbort ||
        msg.includes('failed to fetch') ||
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('fetch');

      if (!isTransient || i === 2) {
        console.error('Sign in error:', e);
        const friendly = mapAuthError(e);
        const err = new Error(friendly);
        err.original = e;
        throw err;
      }
      // Exponential backoff with jitter: 200ms, 400ms
      const delay = 200 * Math.pow(2, i) + Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // Fallback (shouldn't reach)
  const err = new Error(mapAuthError(lastErr));
  err.original = lastErr;
  throw err;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Send magic link for passwordless login
 */
export async function signInWithMagicLink(email) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Magic link error:', error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export async function getUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    // If no session yet (fresh load), return null rather than throwing
    if (!session) return null;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  // Wrap to normalize callback signature and avoid undefined subscription issues
  const sub = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return sub;
}

/**
 * Reset password
 */
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
}

/**
 * Create default user preferences
 */
async function createUserPreferences(userId, email) {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        email_address: email,
        email_notifications: true,
        webhook_notifications: false,
        min_risk_threshold: 'MEDIUM',
        notification_advance_days: 7,
        monitor_financial: true,
        monitor_political: true,
        monitor_natural_disasters: true,
        monitor_wars: true,
        monitor_pandemics: true,
        preferred_pattern_types: ['aspect_pattern', 'degree_specific', 'combined_pattern'],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    
    if (error) {
      console.error('Error creating user preferences:', error);
    }
  } catch (error) {
    console.error('Error in createUserPreferences:', error);
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get user preferences error:', error);
    return null;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId, preferences) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update user preferences error:', error);
    throw error;
  }
}

export { supabase };
