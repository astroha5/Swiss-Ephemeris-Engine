import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../services/authService';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Give Supabase a moment to process the auth state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const session = await getSession();
        
        if (session) {
          // Success - redirect to dashboard or previous page
          const redirectTo = localStorage.getItem('auth_redirect') || '/';
          localStorage.removeItem('auth_redirect');
          navigate(redirectTo, { replace: true });
        } else {
          // No session found - redirect to home with error
          navigate('/?auth=error', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/?auth=error', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
