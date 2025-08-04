import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSession, getUser } from '../../services/authService';

const AuthDebug = () => {
  const { user, session, loading, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const testAuth = async () => {
      try {
        const [testSession, testUser] = await Promise.all([
          getSession(),
          getUser()
        ]);
        
        setDebugInfo({
          testSession: !!testSession,
          testUser: !!testUser,
          sessionUser: testSession?.user ? 'exists' : 'null',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    testAuth();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user ? user.email : 'None'}</div>
        <div>Session: {session ? 'Exists' : 'None'}</div>
        <hr className="my-2" />
        <div>Test Session: {debugInfo.testSession ? 'Yes' : 'No'}</div>
        <div>Test User: {debugInfo.testUser ? 'Yes' : 'No'}</div>
        {debugInfo.error && (
          <div className="text-red-300">Error: {debugInfo.error}</div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
