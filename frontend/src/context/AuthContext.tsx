/**
 * Authentication Context
 * Purpose: Provides global authentication state management using React Context API.
 * Handles user login/logout, JWT token management, and persistent authentication
 * across page refreshes using localStorage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

/**
 * User Interface
 * Defines the structure of authenticated user data
 */
interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
}

/**
 * AuthContextType Interface
 * Defines all authentication-related state and functions available through context
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Purpose: Wraps the application to provide authentication state to all child components
 * @param children - Child components that need access to auth context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  /**
   * Restore Authentication on Mount Effect
   * Purpose: Checks localStorage for existing auth token and user data,
   * validates token expiration, and restores session if valid
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const decoded: any = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        logout();
      }
    }
  }, []);

  /**
   * login Function
   * Purpose: Authenticates user by storing token and user data in both
   * state and localStorage for persistence
   * @param newToken - JWT authentication token
   * @param newUser - User profile data
   */
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  /**
   * logout Function
   * Purpose: Clears all authentication data from state and localStorage,
   * effectively logging the user out
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, showLoginModal, setShowLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Purpose: Custom hook to access authentication context from any component
 * @returns AuthContextType with user, token, login, logout functions
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
