import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../api/axios';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated
  const [username, setUsername] = useState('');

  useEffect(() => {
    API.get('/admin/check')
      .then((res) => {
        if (res.data.authenticated) {
          setUsername(res.data.username);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  return React.cloneElement(children, { username });
}
