import React, { useState, useEffect } from 'react';
import { MOCK_EMAILS } from '../constants';
import { EmailThread, EmailAnalysis } from '../types';
import { analyzeEmail, generateEmailReply } from '../services/geminiService';
import { fetchGmailThreads } from '../services/googleApiService';
import { Sparkles, Send, Loader2, Inbox, Link as LinkIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SmartInbox: React.FC = () => {
  const { accessToken, login, user } = useAuth();
  
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<EmailAnalysis | null>(null);
  
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadEmails();
    } else {
      setEmails(MOCK_EMAILS);
    }
  }, [accessToken]);

  const loadEmails = async () => {
    if (!accessToken) return;
    setLoadingEmails(true);
    setError(null);
    try {
      const threads = await fetchGmailThreads();
      setEmails(threads);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch emails. Ensure you've approved Gmail permissions in Settings.");
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleSelectEmail = async (email: EmailThread) => {
    setSelectedEmail(email);
    setAiAnalysis(null);
    setGeneratedReply('');
    setAnalyzing(true);
    
    try {
      // Analyze the snippet + subject for now (Simulated full body analysis)
      const contentToAnalyze = `Subject: ${email.subject}\nFrom: ${email.sender}\n\n${email.snippet}`;
      const analysis = await analyzeEmail(contentToAnalyze);
      setAiAnalysis(analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReply = async (tone: 'professional' | 'casual' | 'enthusiastic') => {
    if (!selectedEmail) return;
    setReplying(true);
    try {
      const context = `Replying to email from ${selectedEmail.sender} about "${selectedEmail.subject}". Content snippet: "${selectedEmail.snippet}"`;
      const reply = await generateEmailReply(context, tone);
      setGeneratedReply(reply || '');
    } catch (e) {
      console.error(e);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Email List */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
           <div className="flex justify-between items-center mb-1">
             <h2 className="font-bold text-gray-800 flex items-center gap-2">
                Unified Inbox 
                {loadingEmails && <Loader2 size={14} className="animate-spin text-gray-400" />}
             </h2>
             {!accessToken ? (
               <button 
                 onClick={login}
                 className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded hover:bg-brand-100 transition-colors border border-brand-200 font-medium"
               >
                 <LinkIcon size={12} /> Connect Gmail
               </button>
             ) : (
                <button onClick={loadEmails} className="text-gray-400 hover:text-gray-600">
                    <RefreshCw size={14} />
                </button>
             )}
           </div>
           
           {error ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> {error}
              </p>
           ) : (
              <p className="text-xs text-gray-500">
                {accessToken ? `Showing recent emails for ${user?.email}` : 'Using mock data. Connect Gmail to see real emails.'}
              </p>
           )}
        </div>
        
        <div className="overflow-y-auto flex-1">
          {emails.map(email => (
            <div 
              key={email.id}
              onClick={() => handleSelectEmail(email)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-900 truncate pr-2 text-sm">{email.sender.replace(/<.*>/, '').trim()}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate mb-1">{email.subject}</p>
              <p className="text-xs text-gray-500 truncate">{email.snippet}</p>
              {/* Note: We removed the hardcoded mock priority label here since real emails don't have it yet until analyzed */}
            </div>
          ))}
          {emails.length === 0 && !loadingEmails && (
              <div className="p-8 text-center text-gray-400 text-sm">No emails found</div>
          )}
        </div>
      </div>

      {/* Email Detail / AI View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             {/* Header */}
             <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                   <div className="max-w-2xl">
                      <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{selectedEmail.subject}</h2>
                      <p className="text-sm text-gray-600">From: <span className="font-medium">{selectedEmail.sender}</span></p>
                   </div>
                   {analyzing ? (
                     <div className="flex items-center gap-2 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full text-sm">
                        <Loader2 className="animate-spin" size={14} /> Analyzing...
                     </div>
                   ) : aiAnalysis && (
                     <div className="bg-brand-50 text-brand-800 px-3 py-1.5 rounded-lg text-sm border border-brand-100 flex items-center gap-2 shadow-sm">
                        <Sparkles size={16} /> 
                        <span className="font-medium">{aiAnalysis.category}</span>
                     </div>
                   )}
                </div>
             </div>

             {/* Content + Analysis */}
             <div className="flex-1 overflow-y-auto p-6">
                {/* AI Summary Card */}
                {!analyzing && aiAnalysis && (
                  <div className="mb-6 bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles size={14} /> Gemini Executive Summary
                    </h3>
                    <p className="text-gray-800 text-sm mb-4 leading-relaxed font-medium">{aiAnalysis.summary}</p>
                    <div className="flex items-center gap-2 text-sm bg-white/60 p-2 rounded-lg border border-indigo-50 inline-flex">
                       <span className="font-semibold text-indigo-800">Recommendation:</span>
                       <span className="text-indigo-900">{aiAnalysis.suggestedAction}</span>
                    </div>
                  </div>
                )}

                <div className="prose max-w-none text-gray-800 text-sm leading-relaxed mb-8">
                   <p className="whitespace-pre-wrap">{selectedEmail.snippet}</p>
                   <p className="text-gray-400 italic mt-4 text-xs border-t pt-2">Full body fetch not implemented in MVP (Snippet Mode)</p>
                </div>

                {/* Reply Generator */}
                <div className="mt-auto pt-6 border-t border-gray-100 bg-gray-50/50 rounded-xl p-6">
                   <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Send size={16} /> AI Draft Composer
                   </h3>
                   <div className="flex gap-2 mb-4">
                      {['professional', 'casual', 'enthusiastic'].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => handleGenerateReply(tone as any)}
                          disabled={replying}
                          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:shadow-sm transition-all capitalize disabled:opacity-50"
                        >
                           {tone}
                        </button>
                      ))}
                   </div>
                   
                   <textarea
                      className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all h-32 shadow-sm"
                      placeholder="Select a tone above to generate a draft..."
                      value={generatedReply}
                      onChange={(e) => setGeneratedReply(e.target.value)}
                   />
                   <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-400">Generated content requires review before sending.</span>
                      <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                         <LinkIcon size={16} /> Open in Gmail to Send
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/30">
             <div className="text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox size={32} className="opacity-40" />
               </div>
               <p className="font-medium text-gray-500">Select an email to view details</p>
               <p className="text-sm mt-1">AI analysis will appear automatically</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartInbox;
