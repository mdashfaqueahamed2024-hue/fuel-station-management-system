import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('petroflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('petroflow_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('petroflow_user', JSON.stringify(res.data));
        } catch {
          setUser(null);
          localStorage.removeItem('petroflow_token');
          localStorage.removeItem('petroflow_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('petroflow_token', token);
    localStorage.setItem('petroflow_user', JSON.stringify(userData));
    if (userData.stationId) {
      localStorage.setItem('petroflow_station_id', userData.stationId);
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('petroflow_token');
      localStorage.removeItem('petroflow_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER' || role === 'ADMIN';
  const isAttendant = role === 'ATTENDANT';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        role,
        isAdmin,
        isManager,
        isAttendant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
