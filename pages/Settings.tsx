import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Key, Check, AlertTriangle, Mail, Calendar, User, CheckSquare, Users, FileText, Save, Loader2, CheckCircle, XCircle, ExternalLink, HelpCircle, Copy, Info } from 'lucide-react';

const Settings: React.FC = () => {
  const { clientId, setClientId, login, logout, user, accessToken, scopes } = useAuth();
  const [tempClientId, setTempClientId] = useState(clientId);
  const [saved, setSaved] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [gmailStatus, setGmailStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [showHelp, setShowHelp] = useState(true);

  // Get current origin to help user configure Console
  const currentOrigin = window.location.origin;

  const handleSaveId = () => {
    setClientId(tempClientId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const verifyCalendar = async () => {
    if (!accessToken) return;
    setCalendarStatus('checking');
    try {
      // Simple call to list calendars to verify scope
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setCalendarStatus('success');
      } else {
        setCalendarStatus('error');
      }
    } catch (e) {
      console.error(e);
      setCalendarStatus('error');
    }
  };

  const verifyGmail = async () => {
    if (!accessToken) return;
    setGmailStatus('checking');
    try {
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setGmailStatus('success');
      } else {
        setGmailStatus('error');
      }
    } catch (e) {
      console.error(e);
      setGmailStatus('error');
    }
  };

  const verifyConnections = async () => {
    if (!accessToken) return;
    await Promise.all([verifyCalendar(), verifyGmail()]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Settings</h1>
      <p className="text-gray-500 mb-8">Configure your connection to Google Services and Gemini.</p>

      {/* Deployment & Troubleshooting Help */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-8 shadow-sm">
         <div className="flex justify-between items-start">
            <h3 className="font-bold text-red-900 flex items-center gap-2">
               <AlertTriangle size={20} className="text-red-600" /> 
               Fixing "Access Blocked" (Error 400)
            </h3>
            <button onClick={() => setShowHelp(!showHelp)} className="text-xs font-medium text-red-700 underline">
               {showHelp ? 'Hide Guide' : 'Show Fix Guide'}
            </button>
         </div>
         
         {showHelp && (
           <div className="mt-4 text-sm text-red-900 space-y-4">
              <p className="font-medium">
                The error message mentioning <code>storagerelay</code> is confusing, but the fix is simple. 
                Google currently blocks this website from using your Client ID.
              </p>

              <div className="bg-white p-4 rounded-lg border border-red-200 shadow-inner">
                 <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wide">Step 1: Copy Your Website URL</p>
                 <div className="flex items-center gap-2 mb-2">
                    <code className="bg-gray-100 px-3 py-2 rounded text-gray-800 font-mono text-sm flex-1 select-all border border-gray-300">
                      {currentOrigin}
                    </code>
                    <button 
                       onClick={() => navigator.clipboard.writeText(currentOrigin)}
                       className="p-2 hover:bg-gray-100 rounded text-gray-600 border border-gray-200"
                       title="Copy to clipboard"
                    >
                       <Copy size={16} />
                    </button>
                 </div>
                 <p className="text-xs text-gray-500">
                   This exact URL must be in your Google Cloud Console whitelist.
                 </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Step 2: Update Google Cloud Console</p>
                <ol className="list-decimal pl-5 space-y-2 text-gray-800">
                   <li>
                     Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline font-bold text-brand-700">Google Cloud Console &rarr; Credentials</a>.
                   </li>
                   <li>
                     Click on your <strong>OAuth 2.0 Client ID</strong> (the one ending in <code>.apps.googleusercontent.com</code>).
                   </li>
                   <li>
                     Look for <strong>"Authorized JavaScript origins"</strong>.
                     <br/><span className="text-xs bg-yellow-100 px-1 rounded">Important: Do NOT use "Authorized redirect URIs"</span>.
                   </li>
                   <li>
                     Click <strong>ADD URI</strong> and paste: <strong>{currentOrigin}</strong>
                   </li>
                   <li>
                     Click <strong>SAVE</strong> and wait 1 minute.
                   </li>
                </ol>
              </div>
           </div>
         )}
      </div>

      {/* Google Auth Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h2 className="font-semibold text-gray-900 flex items-center gap-2">
             <Shield className="text-brand-600" size={20} />
             Google Workspace Connection
           </h2>
           <div className={`px-3 py-1 rounded-full text-xs font-semibold ${user ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
             {user ? 'CONNECTED' : 'DISCONNECTED'}
           </div>
        </div>
        
        <div className="p-6">
           {/* Client ID Input */}
           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-2">Google Client ID (Web Application)</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={tempClientId}
                 onChange={(e) => {
                   setTempClientId(e.target.value);
                   setSaved(false);
                 }}
                 className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                 placeholder="ex: 123456789-abc.apps.googleusercontent.com"
               />
               <button 
                 onClick={handleSaveId}
                 className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
               >
                 {saved ? <Check size={16} /> : <Save size={16} />}
                 {saved ? 'Saved' : 'Save'}
               </button>
             </div>
             <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
               <Info size={12} /> Your ID is currently loaded. To fix connection errors, follow the guide above.
             </p>
           </div>

           {/* Connection Status & Calendar Check */}
           {user && (
             <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                     <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
                     <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                     </div>
                  </div>
                  <button onClick={logout} className="text-sm text-red-600 hover:underline">Revoke Access</button>
               </div>
               
               <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Integration Checks</h4>
                    <button
                      onClick={verifyConnections}
                      className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-200 hover:bg-brand-100"
                    >
                      Run Connection Check
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brand-600" />
                        <span className="text-sm text-gray-700">Google Calendar Access</span>
                      </div>
                      {calendarStatus === 'idle' && (
                        <button onClick={verifyCalendar} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-200 hover:bg-brand-100">
                          Verify
                        </button>
                      )}
                      {calendarStatus === 'checking' && (
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" /> Checking...</span>
                      )}
                      {calendarStatus === 'success' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={12} /> Active</span>
                      )}
                      {calendarStatus === 'error' && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><XCircle size={12} /> Failed</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-brand-600" />
                        <span className="text-sm text-gray-700">Gmail Access</span>
                      </div>
                      {gmailStatus === 'idle' && (
                        <button onClick={verifyGmail} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-200 hover:bg-brand-100">
                          Verify
                        </button>
                      )}
                      {gmailStatus === 'checking' && (
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" /> Checking...</span>
                      )}
                      {gmailStatus === 'success' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={12} /> Active</span>
                      )}
                      {gmailStatus === 'error' && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><XCircle size={12} /> Failed</span>
                      )}
                    </div>
                  </div>
               </div>
             </div>
           )}

           {/* Scopes Information */}
           <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Key size={16} /> Permissions Requested
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                To function as your Career OS, the agent requires the following read/write permissions. 
                Tokens are stored in memory and reset upon refresh.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ScopeItem 
                  icon={User}
                  title="Identity" 
                  scope="userinfo.profile" 
                  description="Personalize dashboard." 
                />
                <ScopeItem 
                  icon={Mail}
                  title="Read Emails" 
                  scope="gmail.readonly" 
                  description="View your messages." 
                />
                <ScopeItem 
                  icon={Mail}
                  title="Manage Emails" 
                  scope="gmail.modify" 
                  description="Read, label, and organize recruiter threads." 
                />
                <ScopeItem 
                  icon={Mail}
                  title="Send Emails" 
                  scope="gmail.send" 
                  description="Draft and send replies." 
                />
                <ScopeItem 
                  icon={Calendar}
                  title="Manage Calendar" 
                  scope="calendar" 
                  description="Full access to schedule interviews." 
                />
                <ScopeItem 
                  icon={CheckSquare}
                  title="Google Tasks" 
                  scope="tasks" 
                  description="Manage follow-ups and to-do lists." 
                />
                 <ScopeItem 
                  icon={Users}
                  title="Contacts" 
                  scope="contacts" 
                  description="Manage your professional network." 
                />
                 <ScopeItem 
                  icon={FileText}
                  title="Drive Files" 
                  scope="drive.file" 
                  description="Save generated resumes and cover letters." 
                />
              </div>
           </div>

           {/* Connect Button */}
           {!user && (
             <button
               onClick={login}
               disabled={!clientId}
               className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium shadow-sm transition-all flex justify-center items-center gap-2"
             >
               {clientId ? 'Connect Google Account' : 'Enter Client ID to Connect'}
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

const ScopeItem: React.FC<{icon: any, title: string, scope: string, description: string}> = ({ icon: Icon, title, scope, description }) => (
  <div className="flex items-start gap-3 bg-white p-3 rounded border border-blue-100">
    <div className="mt-0.5 text-blue-500"><Icon size={16} /></div>
    <div>
      <div className="flex items-center gap-2">
         <span className="font-medium text-gray-900 text-sm">{title}</span>
         <code className="text-[10px] bg-gray-100 px-1 py-0.5 rounded text-gray-500">{scope}</code>
      </div>
      <p className="text-xs text-gray-600 mt-0.5">{description}</p>
    </div>
  </div>
);

export default Settings;
