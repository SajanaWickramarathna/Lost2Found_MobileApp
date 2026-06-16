import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Hardcoding local IP explicitly to prevent Expo .env caching issues
const API_URL = 'http://192.168.1.83:5000/api';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  signIn: (data: any) => Promise<void>;
  signUp: (data: any) => Promise<any>;
  signInWithOAuth: (provider: 'google' | 'facebook', tokenPayload: any) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Web fallback for SecureStore
async function saveItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await getItem('jwt_token');
        if (storedToken) {
          setToken(storedToken);
          await fetchUserProfile(storedToken);
        }
      } catch (error) {
        console.error('Failed to load auth token', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        await removeItem('jwt_token');
        setToken(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const signIn = async (data: any) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Login failed');
    }

    const result = await response.json();
    await saveItem('jwt_token', result.token);
    setToken(result.token);
    setUser(result);
  };

  const signUp = async (data: any) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Signup failed');
    }

    // Do NOT automatically log in after sign up since they need to verify their email
    return result;
  };

  const signOut = async () => {
    await removeItem('jwt_token');
    setToken(null);
    setUser(null);
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook', tokenPayload: any) => {
    const response = await fetch(`${API_URL}/auth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenPayload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `${provider} login failed`);
    }

    const result = await response.json();
    await saveItem('jwt_token', result.token);
    setToken(result.token);
    setUser(result);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, token, signIn, signUp, signInWithOAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
