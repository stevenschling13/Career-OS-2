import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, JobPosting } from '../types';
import { MOCK_JOBS } from '../constants';

export interface ExtendedAuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  scopes: string[];
  clientId: string;
  setClientId: (id: string) => void;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Data State
  const [jobs, setJobsState] = useState<JobPosting[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize Client ID: Env Var -> Local Storage
  const [clientId, setClientIdState] = useState(() => {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID || 
           localStorage.getItem('career_os_client_id') || 
           '';
  });

  // Debounced Save to Drive
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setClientId = (id: string) => {
    setClientIdState(id);
    localStorage.setItem('career_os_client_id', id);
  };

  // Wrapper to update jobs and trigger sync
  const setJobs = (newJobs: JobPosting[]) => {
    setJobsState(newJobs);
    
    // If we are logged in, sync to Drive
    if (accessToken) {
      setIsSyncing(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(async () => {
        try {
          await saveDataToDrive(accessToken, { jobs: newJobs });
          setIsSyncing(false);
        } catch (e) {
          console.error("Sync failed", e);
          setSyncError("Failed to save to Drive");
          setIsSyncing(false);
        }
      }, 2000); // 2 second debounce
    }
  };

  const [jobs, setJobs] = useState<JobPosting[]>(MOCK_JOBS as any);
  const [isSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/google/status');
      if (res.ok) {
        const data = await res.json();
        setIsConnected(Boolean(data.connected));
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
      console.error('Failed to check auth status', e);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const login = () => {
    window.location.href = '/auth/google/start';
  };

  const logout = async () => {
    try {
      await fetch('/auth/google/disconnect', { method: 'POST' });
      setIsConnected(false);
      setUser(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const clientId = 'managed-by-backend';
  const setClientId = () => {};
  const scopes: string[] = [];

  const value: ExtendedAuthContextType = {
    user,
    accessToken: isConnected ? 'backend-managed' : null,
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
