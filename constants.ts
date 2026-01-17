import { LayoutDashboard, Inbox, Trello, FileText, Settings, Sparkles } from 'lucide-react';
import { JobStatus, EmailThread } from './types';

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Smart Inbox', icon: Inbox, path: '/inbox' },
  { label: 'Pipeline', icon: Trello, path: '/pipeline' },
  { label: 'Resume & Prep', icon: FileText, path: '/prep' },
  { label: 'Agent Settings', icon: Settings, path: '/settings' },
];

export const KANBAN_COLUMNS = [
  { id: JobStatus.INTERESTED, title: 'Interested', color: 'bg-gray-100 border-gray-200' },
  { id: JobStatus.APPLIED, title: 'Applied', color: 'bg-blue-50 border-blue-200' },
  { id: JobStatus.RECRUITER_SCREEN, title: 'Screening', color: 'bg-yellow-50 border-yellow-200' },
  { id: JobStatus.ONSITE, title: 'Interviews', color: 'bg-purple-50 border-purple-200' },
  { id: JobStatus.OFFER, title: 'Offer', color: 'bg-green-50 border-green-200' },
  { id: JobStatus.REJECTED, title: 'Rejected', color: 'bg-red-50 border-red-200' },
];

export const MOCK_EMAILS: EmailThread[] = [
  {
    id: '1',
    sender: 'recruiting@google.com',
    subject: 'Interview Invitation: Senior Software Engineer',
    snippet: 'Hi, we would like to schedule a technical screen...',
    date: new Date().toISOString(),
    isRead: false,
    category: 'RECRUITER',
    priority: 'HIGH',
  },
  {
    id: '2',
    sender: 'linkedin-alerts@linkedin.com',
    subject: '30 new jobs match your profile',
    snippet: 'Check out these new roles at Anthropic, OpenAI...',
    date: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    category: 'OTHER',
    priority: 'LOW',
  },
  {
    id: '3',
    sender: 'sarah@techstartup.io',
    subject: 'Following up on our chat',
    snippet: 'Great meeting you at the mixer yesterday. Let\'s grab coffee...',
    date: new Date(Date.now() - 172800000).toISOString(),
    isRead: false,
    category: 'NETWORKING',
    priority: 'MEDIUM',
  }
];

export const MOCK_JOBS = [
  {
    id: '101',
    company: 'Google',
    role: 'Staff Software Engineer',
    location: 'Mountain View, CA',
    status: JobStatus.RECRUITER_SCREEN,
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    description: 'Lead technical strategy for agentic systems...',
    notes: 'Referral from John D.',
    fitScore: 92
  },
  {
    id: '102',
    company: 'Anthropic',
    role: 'Product Engineer',
    location: 'San Francisco, CA',
    status: JobStatus.APPLIED,
    dateAdded: new Date(Date.now() - 200000000).toISOString(),
    lastUpdated: new Date().toISOString(),
    description: 'Build user-facing AI interfaces...',
    notes: '',
    fitScore: 88
  }
];