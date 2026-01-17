import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Check, LogOut, Loader2, Info, ExternalLink } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, login, logout, isConnected, refreshStatus, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Settings</h1>
      <p className="text-gray-500 mb-8">Configure your connection to Google Services and Gemini.</p>

      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h2 className="font-semibold text-gray-900 flex items-center gap-2">
             <Shield className="text-brand-600" size={20} />
             Google Workspace Connection
           </h2>
           <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
             {isLoading ? <Loader2 size={10} className="animate-spin"/> : isConnected ? <Check size={12} /> : null}
             {isConnected ? 'SECURELY CONNECTED' : 'DISCONNECTED'}
           </div>
        </div>
        
        <div className="p-6">
           <div className="mb-6">
             <p className="text-sm text-gray-600 mb-4">
               Career OS uses a secure, backend-server connection to access your Gmail and Calendar. 
               Tokens are encrypted at rest and never exposed to the browser.
             </p>

             {isConnected && user ? (
               <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-green-900 text-sm">Active Session</p>
                    <p className="text-green-700 text-sm">{user.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors"
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
               </div>
             ) : (
               <button 
                 onClick={login}
                 className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-shadow shadow-sm"
               >
                 <img src="https://www.google.com/favicon.ico" className="w-4 h-4 bg-white rounded-full border border-white" />
                 Connect Google Account
               </button>
             )}
           </div>

           <div className="border-t border-gray-100 pt-4">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Permissions Granted</h4>
             <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
               <li>Read Gmail (Recruiter emails)</li>
               <li>Read Calendar (Interview scheduling)</li>
               <li>User Profile (Identity)</li>
             </ul>
           </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
         <Info className="text-blue-600 shrink-0" size={20} />
         <div className="text-sm text-blue-900">
           <p className="font-bold mb-1">Developer Note</p>
           <p>
             Ensure your backend is running on port 8787 and your <code>.env</code> file is configured with Google Client ID/Secret. 
             See <code>/docs/setup_google_oauth.md</code> for setup instructions.
           </p>
         </div>
      </div>
    </div>
  );
};

export default Settings;