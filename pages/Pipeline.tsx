import React, { useState } from 'react';
import { KANBAN_COLUMNS, MOCK_JOBS } from '../constants';
import { JobPosting, JobStatus } from '../types';
import JobCard from '../components/JobCard';
import { Plus, Search } from 'lucide-react';
import { researchCompany } from '../services/geminiService';

const Pipeline: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>(MOCK_JOBS as any); // Cast for simplicity in demo
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [researchData, setResearchData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const moveJob = (id: string, newStatus: JobStatus) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
    setResearchData(null); // Reset research
  };

  const handleResearch = async () => {
    if (!selectedJob) return;
    setIsLoading(true);
    try {
      const result = await researchCompany(selectedJob.company);
      setResearchData(result);
    } catch (e) {
      console.error(e);
      alert('Error fetching research. Check API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Application Pipeline</h1>
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm">
          <Plus size={18} /> Add Job
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full w-max">
          {KANBAN_COLUMNS.map(col => (
            <div key={col.id} className="w-80 flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-200">
              <div className={`p-3 border-b border-gray-200 rounded-t-xl font-medium flex justify-between items-center ${col.color.split(' ')[0]}`}>
                 <span>{col.title}</span>
                 <span className="text-xs bg-white/50 px-2 py-0.5 rounded text-gray-700">
                   {jobs.filter(j => j.status === col.id).length}
                 </span>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {jobs.filter(j => j.status === col.id).map(job => (
                  <JobCard key={job.id} job={job} onMove={moveJob} onClick={handleJobClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Detail Modal (Inline implementation for simplicity) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
             <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <h2 className="text-2xl font-bold text-gray-900">{selectedJob.role}</h2>
                     <p className="text-gray-600 text-lg">{selectedJob.company}</p>
                   </div>
                   <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                      <p className="font-medium text-gray-900">{selectedJob.status}</p>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                      <p className="font-medium text-gray-900">{selectedJob.location}</p>
                   </div>
                </div>

                <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900">Company Intelligence</h3>
                      <button 
                        onClick={handleResearch} 
                        disabled={isLoading}
                        className="text-brand-600 text-sm hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                         <Search size={14} /> {isLoading ? 'Researching...' : 'Run Deep Search'}
                      </button>
                   </div>
                   
                   {researchData ? (
                     <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 text-sm text-gray-800 space-y-3">
                        <div dangerouslySetInnerHTML={{ __html: researchData.text.replace(/\n/g, '<br/>') }} />
                        {researchData.grounding?.groundingChunks && (
                           <div className="mt-3 pt-3 border-t border-brand-200 text-xs">
                              <p className="font-semibold mb-1">Sources:</p>
                              <ul className="list-disc pl-4 space-y-1 text-brand-700">
                                 {researchData.grounding.groundingChunks.map((chunk: any, i: number) => (
                                    <li key={i}>
                                       <a href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className="underline truncate block max-w-xs">
                                          {chunk.web?.title || chunk.web?.uri}
                                       </a>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )}
                     </div>
                   ) : (
                     <div className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded-lg">
                        Click "Run Deep Search" to have Gemini find the latest news, engineering culture, and financial health info for {selectedJob.company} using Google Search.
                     </div>
                   )}
                </div>

                <div>
                   <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                   <p className="text-sm text-gray-600 leading-relaxed">{selectedJob.description}</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
