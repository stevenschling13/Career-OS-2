import React from 'react';
import { JobPosting, JobStatus } from '../types';
import { MapPin, DollarSign, Building } from 'lucide-react';

interface JobCardProps {
  job: JobPosting;
  onMove: (id: string, newStatus: JobStatus) => void;
  onClick: (job: JobPosting) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onMove, onClick }) => {
  return (
    <div 
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group relative"
      onClick={() => onClick(job)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{job.role}</h3>
        {job.fitScore && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            job.fitScore > 85 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {job.fitScore}% Fit
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
        <Building size={14} /> {job.company}
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-3 mb-3">
        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
      </div>
      
      {/* Quick Move Actions */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <select 
          className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
          value={job.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onMove(job.id, e.target.value as JobStatus)}
        >
          {Object.values(JobStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default JobCard;
