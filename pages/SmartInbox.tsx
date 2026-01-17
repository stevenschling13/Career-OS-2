import React, { useState } from 'react';
import { MOCK_EMAILS } from '../constants';
import { EmailThread } from '../types';
import { analyzeEmail, generateEmailReply } from '../services/geminiService';
import { Sparkles, Send, Loader2, Inbox, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SmartInbox: React.FC = () => {
  const { accessToken, login } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [replying, setReplying] = useState(false);

  const handleSelectEmail = async (email: any) => {
    setSelectedEmail(email);
    setAiAnalysis(null);
    setGeneratedReply('');
    setAnalyzing(true);
    
    // Simulate fetching full content then analyze
    try {
      const analysis = await analyzeEmail(email.snippet); // Passing snippet as simulated body
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
      const reply = await generateEmailReply(selectedEmail.snippet, tone);
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
             <h2 className="font-bold text-gray-800">Unified Inbox</h2>
             {!accessToken && (
               <button 
                 onClick={login}
                 className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded hover:bg-brand-100 transition-colors border border-brand-200 font-medium"
               >
                 <LinkIcon size={12} /> Link Gmail
               </button>
             )}
           </div>
           <p className="text-xs text-gray-500">
             {accessToken ? 'Syncing with Gmail...' : 'Using mock data. Link Gmail to see real emails.'}
           </p>
        </div>
        <div className="overflow-y-auto flex-1">
          {MOCK_EMAILS.map(email => (
            <div 
              key={email.id}
              onClick={() => handleSelectEmail(email)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-900 truncate pr-2">{email.sender}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate mb-1">{email.subject}</p>
              <p className="text-xs text-gray-500 truncate">{email.snippet}</p>
              {email.priority === 'HIGH' && (
                <span className="inline-block mt-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">ACTION REQUIRED</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Email Detail / AI View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             {/* Header */}
             <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedEmail.subject}</h2>
                      <p className="text-sm text-gray-600">From: <span className="font-medium">{selectedEmail.sender}</span></p>
                   </div>
                   {analyzing ? (
                     <div className="flex items-center gap-2 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full text-sm">
                        <Loader2 className="animate-spin" size={14} /> Analyzing...
                     </div>
                   ) : aiAnalysis && (
                     <div className="bg-brand-50 text-brand-800 px-3 py-1.5 rounded-lg text-sm border border-brand-100 flex items-center gap-2">
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
                  <div className="mb-6 bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles size={12} /> Gemini Summary
                    </h3>
                    <p className="text-gray-800 text-sm mb-3">{aiAnalysis.summary}</p>
                    <div className="flex items-center gap-2 text-sm">
                       <span className="font-medium text-gray-700">Suggested Action:</span>
                       <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">{aiAnalysis.suggestedAction}</span>
                    </div>
                  </div>
                )}

                <div className="prose max-w-none text-gray-800 text-sm leading-relaxed">
                   <p>{selectedEmail.snippet} [Full email content would be here...]</p>
                   <p className="mt-4">Best regards,<br/>Recruiting Team</p>
                </div>

                {/* Reply Generator */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                   <h3 className="font-medium text-gray-900 mb-3">Draft Quick Reply</h3>
                   <div className="flex gap-2 mb-4">
                      {['professional', 'casual', 'enthusiastic'].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => handleGenerateReply(tone as any)}
                          disabled={replying}
                          className="px-3 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 capitalize disabled:opacity-50"
                        >
                           {tone}
                        </button>
                      ))}
                   </div>
                   
                   <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all h-32"
                      placeholder="Select a tone above to generate a draft..."
                      value={generatedReply}
                      onChange={(e) => setGeneratedReply(e.target.value)}
                   />
                   <div className="flex justify-end mt-2">
                      <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                         <Send size={16} /> Send Reply
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
             <div className="text-center">
               <Inbox size={48} className="mx-auto mb-2 opacity-20" />
               <p>Select an email to view details</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartInbox;