import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthContextType, JobPosting } from '../types';
import { MOCK_JOBS } from '../constants';

// Fully defined interface to avoid inheritance ambiguity
export interface ExtendedAuthContextType {
  // Original AuthContextType properties
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  scopes: string[];
  clientId: string;
  setClientId: (id: string) => void;
  
  // Extended properties
  isConnected: boolean;
  refreshStatus: () => Promise<void>;
  jobs: JobPosting[]; 
  setJobs: (jobs: JobPosting[]) => void;
  isSyncing: boolean;
}

const AuthContext = createContext<ExtendedAuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Job Data Management
  // Note: Deep drive syncing is temporarily disabled on the frontend 
  // until backend endpoints for file management are added.
  const [jobs, setJobs] = useState<JobPosting[]>(MOCK_JOBS as any);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/google/status');
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.connected);
        if (data.connected && data.email) {
          setUser({
            name: 'User', 
            email: data.email,
            targetRoles: [],
            skills: [],
            resumeText: ''
          });
        } else {
            setUser(null);
        }
      }
    } catch (e) {
      console.error("Failed to check auth status", e);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const login = () => {
    // Redirect to backend auth start
    window.location.href = '/auth/google/start';
  };

  const logout = async () => {
    try {
      await fetch('/auth/google/disconnect', { method: 'POST' });
      setIsConnected(false);
      setUser(null);
      // Optional: Redirect to home or refresh
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // Mock implementation for interface compatibility
  const clientId = '';
  const setClientId = () => {};
  const scopes: string[] = [];

  const value: ExtendedAuthContextType = {
    user,
    accessToken: isConnected ? 'backend-managed' : null, // Frontend no longer holds the raw token
    isLoading,
    login,
    logout,
    scopes,
    clientId,
    setClientId,
    isConnected,
    refreshStatus: fetchStatus,
    jobs,
    setJobs,
    isSyncing
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
