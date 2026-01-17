import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthContextType } from '../types';
import { Mail, Calendar, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google: any;
  }
}

// Extended Scopes for full Career OS functionality
const SCOPES = [
  // Identity
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  
  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  
  // Calendar: Read-only and Full access
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar',
  
  // Tasks: For the "Execution Loop" (To-Do list integration)
  'https://www.googleapis.com/auth/tasks',
  
  // Contacts: For the Networking CRM
  'https://www.googleapis.com/auth/contacts',
  
  // Drive: To save generated resumes and cover letters
  'https://www.googleapis.com/auth/drive.file'
];

// Context initialized with null
const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use the auth context
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize Client ID from env or local storage
  const [clientId, setClientIdState] = useState(process.env.REACT_APP_GOOGLE_CLIENT_ID || '');

  const setClientId = (id: string) => {
    setClientIdState(id);
    localStorage.setItem('career_os_client_id', id);
  };

  useEffect(() => {
    // Restore client ID from localStorage if not in env
    const savedClientId = localStorage.getItem('career_os_client_id');
    if (savedClientId && !process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      setClientIdState(savedClientId);
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const initializeClient = () => {
      if (window.google && window.google.accounts) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES.join(' '),
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setAccessToken(tokenResponse.access_token);
              fetchUserProfile(tokenResponse.access_token);
            }
          },
        });
        setTokenClient(client);
      }
    };

    // Check if Google script is loaded, if not, wait for it
    if (window.google && window.google.accounts) {
      initializeClient();
    } else {
      const intervalId = setInterval(() => {
        if (window.google && window.google.accounts) {
          initializeClient();
          clearInterval(intervalId);
        }
      }, 500);
      return () => clearInterval(intervalId);
    }
  }, [clientId]);

  const fetchUserProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      
      const profile: UserProfile = {
        name: data.name,
        email: data.email,
        picture: data.picture,
        targetRoles: [],
        skills: [],
        resumeText: '',
      };
      
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      // Optional: Clear token if invalid
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    if (!clientId) {
      // If no client ID, redirect to settings or show alert
      if (confirm('Google Client ID is missing. Go to Settings to configure it?')) {
        navigate('/settings');
      }
      return;
    }

    if (!tokenClient) {
      alert('Google Sign-In script is loading. Please try again in a moment.');
      return;
    }
    
    // Trigger the popup
    tokenClient.requestAccessToken();
  };

  const logout = () => {
    const token = accessToken;
    if (token && window.google && window.google.accounts) {
      window.google.accounts.oauth2.revoke(token, () => {
        setAccessToken(null);
        setUser(null);
      });
    } else {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    login,
    logout,
    scopes: SCOPES,
    clientId,
    setClientId
  };

  // Improved floating button visibility logic
  const showLoginPrompt = !user && (location.pathname === '/inbox' || location.pathname === '/');

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLoginPrompt && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={login}
            disabled={isLoading}
            className={`
              group flex items-center gap-4 pl-3 pr-6 py-3 rounded-full shadow-xl border 
              transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl
              ${isLoading 
                ? 'bg-white border-gray-200 cursor-wait' 
                : 'bg-gray-900 border-gray-900 hover:bg-black text-white'
              }
            `}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-colors relative
              ${isLoading ? 'bg-gray-50' : 'bg-gray-800 group-hover:bg-gray-700'}
            `}>
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-brand-600" />
              ) : clientId ? (
                <>
                  <Mail size={16} className="text-white absolute top-2.5 left-2.5" />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-800">
                    <Calendar size={12} className="text-gray-900" />
                  </div>
                </>
              ) : (
                <AlertCircle size={20} className="text-yellow-400" />
              )}
            </div>
            
            <div className="flex flex-col items-start">
              <span className={`text-sm font-bold ${isLoading ? 'text-gray-800' : 'text-white'}`}>
                {isLoading ? 'Connecting...' : clientId ? 'Link Gmail & Calendar' : 'Setup Required'}
              </span>
              {!isLoading && (
                <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-300">
                  {clientId ? 'Enable Career OS' : 'Configure Client ID'}
                </span>
              )}
            </div>

            {!isLoading && clientId && (
              <ArrowRight size={16} className="text-gray-500 group-hover:text-white transition-colors ml-1" />
            )}
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};
