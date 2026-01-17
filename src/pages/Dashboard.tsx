import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { MOCK_JOBS, MOCK_EMAILS } from '../constants';
import { Bell, Calendar, Briefcase, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { JobStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { isConnected } = useAuth();
  const [stats, setStats] = useState<{name: string, count: number}[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    // Calculate stats from mock data
    const counts = MOCK_JOBS.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = [
      { name: 'Applied', count: counts[JobStatus.APPLIED] || 0 },
      { name: 'Screening', count: counts[JobStatus.RECRUITER_SCREEN] || 0 },
      { name: 'Interview', count: counts[JobStatus.ONSITE] || 0 },
      { name: 'Offer', count: counts[JobStatus.OFFER] || 0 },
    ];
    setStats(data);
  }, []);

  useEffect(() => {
    if (isConnected) {
      setLoadingEvents(true);
      fetch('/api/google/calendar/upcoming')
        .then(res => res.json())
        .then(data => {
          if (data.events) setEvents(data.events);
        })
        .catch(console.error)
        .finally(() => setLoadingEvents(false));
    }
  }, [isConnected]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good Morning, Alex</h1>
        <p className="text-gray-500">Here is your daily briefing powered by Gemini.</p>
      </header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Bell size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Action Items</p>
              <h3 className="text-2xl font-bold text-gray-900">3 Pending</h3>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              Reply to Google Recruiter
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              Prep for Anthropic Screen
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <h3 className="text-2xl font-bold text-gray-900">{isConnected ? events.length : 0} Events</h3>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-32">
             {!isConnected ? (
               <div className="text-xs text-gray-400 italic">Connect Google in Settings to see events</div>
             ) : loadingEvents ? (
               <Loader2 size={16} className="animate-spin text-purple-600" />
             ) : events.length > 0 ? (
               events.map((evt: any) => (
                 <div key={evt.id} className="bg-gray-50 p-2 rounded text-sm border-l-2 border-purple-400">
                    <span className="font-semibold block truncate">{evt.summary}</span>
                    <span className="text-gray-500 text-xs">
                      {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleDateString() : 'All Day'}
                    </span>
                 </div>
               ))
             ) : (
                <div className="text-sm text-gray-500">No upcoming events found.</div>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pipeline Health</p>
              <h3 className="text-2xl font-bold text-gray-900">Active</h3>
            </div>
          </div>
          <div className="h-24 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                   <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={20} />
                   <XAxis dataKey="name" hide />
                   <Tooltip cursor={{fill: 'transparent'}} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Recent Inbox Activity</h2>
          <button className="text-brand-600 text-sm font-medium hover:text-brand-700 flex items-center gap-1">
            View Inbox <ArrowRight size={16} />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
           {MOCK_EMAILS.slice(0, 3).map(email => (
             <div key={email.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                   <h4 className="font-medium text-gray-900 text-sm">{email.subject}</h4>
                   <p className="text-gray-500 text-xs mt-1">{email.snippet.substring(0, 60)}...</p>
                </div>
                <div className="text-right">
                   <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                      email.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                   }`}>
                      {email.priority}
                   </span>
                   <p className="text-gray-400 text-xs">{new Date(email.date).toLocaleDateString()}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;