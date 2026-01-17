import React, { useState } from 'react';
import { KANBAN_COLUMNS } from '../constants';
import { JobPosting, JobStatus, ResearchResult } from '../types';
import JobCard from '../components/JobCard';
import { Plus, Search, Save, Trash2 } from 'lucide-react';
import { researchCompany } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

const Pipeline: React.FC = () => {
  // Use global synced state instead of local mock state
  const { jobs, setJobs, isSyncing } = useAuth() as any; 
  
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [researchData, setResearchData] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');

  const moveJob = (id: string, newStatus: JobStatus) => {
    const updatedJobs = jobs.map((j: JobPosting) => j.id === id ? { ...j, status: newStatus, lastUpdated: new Date().toISOString() } : j);
    setJobs(updatedJobs);
  };

  const deleteJob = (id: string) => {
    if (confirm('Are you sure you want to remove this job from your pipeline?')) {
        const updatedJobs = jobs.filter((j: JobPosting) => j.id !== id);
        setJobs(updatedJobs);
        setSelectedJob(null);
    }
  }

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobCompany) return;

    const newJob: JobPosting = {
      id: Date.now().toString(),
      role: newJobTitle,
      company: newJobCompany,
      location: 'Remote/Hybrid',
      status: JobStatus.INTERESTED,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      description: 'Added manually.',
      notes: '',
      fitScore: 0
    };

    setJobs([...jobs, newJob]);
    setIsAdding(false);
    setNewJobTitle('');
    setNewJobCompany('');
  };

  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
    setResearchData(null);
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
    <div className="h-screen flex flex-col p-6 overflow-hidden bg-[#f8fafc]">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Application Pipeline</h1>
           <p className="text-xs text-gray-500 mt-1">{jobs.length} Active Applications • {isSyncing ? 'Syncing...' : 'Synced to Drive'}</p>
        </div>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg transition-transform active:scale-95"
        >
          <Plus size={18} /> Add Job
        </button>
      </div>

      {/* Add Job Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold mb-4">Add New Opportunity</h3>
                <form onSubmit={handleAddJob}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Title</label>
                        <input autoFocus value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Senior Engineer" />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input value={newJobCompany} onChange={e => setNewJobCompany(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Acme Corp" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={!newJobTitle} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium">Create</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full w-max">
          {KANBAN_COLUMNS.map(col => (
            <div key={col.id} className="w-80 flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-200 shadow-sm">
              <div className={`p-3 border-b border-gray-200 rounded-t-xl font-medium flex justify-between items-center ${col.color.split(' ')[0]}`}>
                 <span className="text-gray-900">{col.title}</span>
                 <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-100 font-mono text-gray-600">
                   {jobs.filter((j: JobPosting) => j.status === col.id).length}
                 </span>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">
                {jobs.filter((j: JobPosting) => j.status === col.id).map((job: JobPosting) => (
                  <JobCard key={job.id} job={job} onMove={moveJob} onClick={handleJobClick} />
                ))}
                {jobs.filter((j: JobPosting) => j.status === col.id).length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        Empty
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
             <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <h2 className="text-2xl font-bold text-gray-900">{selectedJob.role}</h2>
                     <p className="text-gray-600 text-lg flex items-center gap-2">
                        {selectedJob.company}
                        {selectedJob.url && <a href={selectedJob.url} target="_blank" className="text-xs text-brand-600 hover:underline">View Posting</a>}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => deleteJob(selectedJob.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={20} />
                     </button>
                     <button onClick={() => setSelectedJob(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full text-2xl leading-none">&times;</button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                      <select 
                        className="bg-transparent font-medium text-gray-900 w-full outline-none mt-1"
                        value={selectedJob.status}
                        onChange={(e) => moveJob(selectedJob.id, e.target.value as JobStatus)}
                      >
                         {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                      <p className="font-medium text-gray-900 mt-1">{selectedJob.location}</p>
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
                                 {researchData.grounding.groundingChunks.map((chunk, i) => (
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
                     <div className="text-gray-500 text-sm italic bg-gray-50 p-4 rounded-lg border border-gray-200">
                        Click "Run Deep Search" to have Gemini find the latest news, engineering culture, and financial health info for {selectedJob.company} using Google Search.
                     </div>
                   )}
                </div>

                <div>
                   <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                   <textarea 
                     className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                     rows={4}
                     value={selectedJob.notes}
                     onChange={(e) => {
                        const updated = jobs.map((j: JobPosting) => j.id === selectedJob.id ? {...j, notes: e.target.value} : j);
                        setJobs(updated);
                        setSelectedJob({...selectedJob, notes: e.target.value});
                     }}
                   />
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;