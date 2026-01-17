import React, { useState } from 'react';
import { analyzeResumeFit } from '../services/geminiService';
import { Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Prep: React.FC = () => {
  const [resumeText, setResumeText] = useState('Senior Software Engineer with 8 years of experience in React, Node.js and Cloud architecture...');
  const [jobDesc, setJobDesc] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      // This uses Gemini 3.0 Pro with Thinking Budget
      const result = await analyzeResumeFit(resumeText, jobDesc);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert('Analysis failed. Ensure API key is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Resume & Interview Prep</h1>
        <p className="text-gray-500">Use Gemini 3.0 Pro's advanced reasoning to check your fit and prepare.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Resume (Paste Text)</label>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Description</label>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
                placeholder="Paste the JD here..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
           </div>

           <button
              onClick={handleAnalyze}
              disabled={loading || !jobDesc}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {loading ? <Loader2 className="animate-spin" /> : <FileText />}
              {loading ? 'Thinking (Deep Analysis)...' : 'Analyze Fit & Generate Questions'}
           </button>
        </div>

        {/* Results Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
           <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Analysis Results</h2>
           
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
                <Loader2 size={40} className="animate-spin text-brand-500" />
                <div className="text-center">
                   <p className="font-medium">Gemini is thinking...</p>
                   <p className="text-xs">Allocating 16k tokens for reasoning budget</p>
                </div>
             </div>
           ) : analysis ? (
             <div className="prose prose-sm max-w-none prose-headings:text-brand-800 prose-p:text-gray-700">
                <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText size={48} className="mb-3 opacity-20" />
                <p>Add a job description to start analysis</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Prep;
