import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, AuthContextType, JobPosting } from '../types';
import { Mail, Calendar, Loader2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadDataFromDrive, saveDataToDrive } from '../services/googleApiService';
import { MOCK_JOBS } from '../constants';

declare global {
  interface Window {
    google: any;
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.file' // Essential for Drive Sync
];

interface ExtendedAuthContextType extends AuthContextType {
  scriptLoaded: boolean;
  jobs: JobPosting[];
  setJobs: (jobs: JobPosting[]) => void;
  isSyncing: boolean;
  syncError: string | null;
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
  
  // Initialize Client ID: Env Var -> Local Storage -> Hardcoded User ID
  const [clientId, setClientIdState] = useState(() => {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID || 
           localStorage.getItem('career_os_client_id') || 
           '959574223828-bopabkdkoo951hcgsq7p3v4bt5eh3tke.apps.googleusercontent.com';
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

  useEffect(() => {
    const checkScript = () => {
      if (window.google && window.google.accounts) {
        setScriptLoaded(true);
        if (clientId) {
          try {
            const client = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: SCOPES.join(' '),
              callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  setAccessToken(tokenResponse.access_token);
                  fetchUserProfile(tokenResponse.access_token);
                  
                  // Initial Data Load
                  loadData(tokenResponse.access_token);
                }
              },
            });
            setTokenClient(client);
          } catch (e) {
            console.error("Error initializing token client:", e);
          }
        }
        return true;
      }
      return false;
    };

    if (!checkScript()) {
      const interval = setInterval(() => {
        if (checkScript()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [clientId]);

  const loadData = async (token: string) => {
    setIsSyncing(true);
    try {
      const data = await loadDataFromDrive(token);
      if (data && data.jobs) {
        setJobsState(data.jobs);
      } else {
        // First time load: use empty or defaults, don't overwrite with MOCK unless user wants
        // For this demo, we'll initialize with MOCK if drive is empty so the user sees something
        setJobsState(MOCK_JOBS as any); 
      }
    } catch (e) {
      console.error(e);
      setSyncError("Failed to load data");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser({
          name: data.name,
          email: data.email,
          picture: data.picture,
          targetRoles: [],
          skills: [],
          resumeText: '',
        });
      }
    } catch (error) {
      console.error(error);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // 1. Check if Client ID exists
    if (!clientId) {
      navigate('/settings');
      return;
    }

    // 2. Check if script loaded
    if (!scriptLoaded || !tokenClient) {
      alert('Security components are initializing. Please wait 2 seconds and try again.');
      return;
    }
    
    // 3. Request Token
    tokenClient.requestAccessToken();
  };

  const logout = () => {
    const token = accessToken;
    if (token && window.google && window.google.accounts) {
      window.google.accounts.oauth2.revoke(token, () => {
        setAccessToken(null);
        setUser(null);
        setJobsState([]); // Clear data on logout
      });
    } else {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value: ExtendedAuthContextType = {
    user,
    accessToken,
    isLoading,
    login,
    logout,
    scopes: SCOPES,
    clientId,
    setClientId,
    scriptLoaded,
    jobs,
    setJobs,
    isSyncing,
    syncError
  };

  const showLoginPrompt = !user && (location.pathname !== '/settings');

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLoginPrompt && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
          <button 
            onClick={login}
            disabled={isLoading}
            className={`
              group flex items-center gap-4 pl-3 pr-6 py-3 rounded-full shadow-2xl border 
              transition-all duration-300 transform hover:-translate-y-1
              ${isLoading 
                ? 'bg-white border-gray-200 cursor-wait' 
                : clientId 
                  ? 'bg-gray-900 border-gray-900 hover:bg-black text-white'
                  : 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
              }
            `}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-colors relative shadow-sm
              ${isLoading ? 'bg-gray-50' : 'bg-white/20'}
            `}>
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-brand-600" />
              ) : clientId ? (
                 <div className="relative">
                   <Mail size={16} className="text-white" />
                   <div className="absolute -bottom-1 -right-1 bg-green-500 w-2.5 h-2.5 rounded-full border border-gray-900"></div>
                 </div>
              ) : (
                <AlertCircle size={20} className="text-amber-600" />
              )}
            </div>
            
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold">
                {isLoading ? 'Connecting...' : clientId ? 'Connect Career OS' : 'Setup Required'}
              </span>
              {!isLoading && (
                <span className="text-[10px] font-medium opacity-80">
                  {clientId ? 'Sync Gmail, Calendar & Drive' : 'Click to Configure API Keys'}
                </span>
              )}
            </div>

            {!isLoading && (
              <ArrowRight size={16} className={`transition-colors ml-1 ${clientId ? 'text-gray-400 group-hover:text-white' : 'text-amber-700'}`} />
            )}
          </button>
        </div>
      )}
      
      {/* Sync Indicator */}
      {user && (
        <div className="fixed bottom-4 left-64 ml-4 z-40 text-[10px] font-medium text-gray-400 flex items-center gap-2">
          {isSyncing ? (
            <>
              <RefreshCw size={10} className="animate-spin" /> Syncing to Drive...
            </>
          ) : syncError ? (
             <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {syncError}</span>
          ) : (
             <span className="opacity-50">All changes saved to Drive</span>
          )}
        </div>
      )}
    </AuthContext.Provider>
  );
};