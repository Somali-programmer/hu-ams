import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  firebaseUser: any | null;
  loading: boolean;
  role: UserRole | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  role: null,
  isAuthReady: false,
  login: async () => ({ success: false }),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('hu_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          } else {
            localStorage.removeItem('hu_token');
          }
        } catch (err) {
          console.error('Auth check failed:', err);
        }
      }
      setLoading(false);
      setIsAuthReady(true);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('hu_token', data.token);
        setUser(data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: data.message };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: 'Connection error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('hu_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser: user ? { uid: user.userId, email: user.email } : null,
        loading,
        role: user?.role || null,
        isAuthReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
