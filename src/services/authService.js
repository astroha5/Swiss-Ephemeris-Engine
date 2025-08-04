import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ypscvzznlrxjeqkjasmb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc2N2enpubHJ4amVxa2phc21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjk1NzIsImV4cCI6MjA2ODg0NTU3Mn0.KIe0Rqk5WC27hIyrgWHjS1aMaU2U2UcmrDJMq4q6H6w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
export async function signInWithPassword(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
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
  return supabase.auth.onAuthStateChange(callback);
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
