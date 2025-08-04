import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getUser, 
  getSession, 
  onAuthStateChange, 
  signOut as authSignOut,
  getUserPreferences 
} from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const [currentUser, currentSession] = await Promise.all([
          getUser(),
          getSession()
        ]);
        
        setUser(currentUser);
        setSession(currentSession);
        
        // Load user preferences if user exists
        if (currentUser) {
          const preferences = await getUserPreferences(currentUser.id);
          setUserPreferences(preferences);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        // Load user preferences when user signs in
        try {
          const preferences = await getUserPreferences(session.user.id);
          setUserPreferences(preferences);
        } catch (error) {
          console.error('Error loading user preferences:', error);
        }
      } else {
        // Clear preferences when user signs out
        setUserPreferences(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      setSession(null);
      setUserPreferences(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUserPreferences = async () => {
    if (user) {
      try {
        const preferences = await getUserPreferences(user.id);
        setUserPreferences(preferences);
        return preferences;
      } catch (error) {
        console.error('Error refreshing user preferences:', error);
        return null;
      }
    }
    return null;
  };

  const value = {
    user,
    session,
    loading,
    userPreferences,
    signOut,
    refreshUserPreferences,
    isAuthenticated: !!user,
    isLoading: loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
