export enum JobStatus {
  INTERESTED = 'INTERESTED',
  APPLIED = 'APPLIED',
  RECRUITER_SCREEN = 'RECRUITER_SCREEN',
  TECHNICAL_ROUND = 'TECHNICAL_ROUND',
  ONSITE = 'ONSITE',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED'
}

export interface JobPosting {
  id: string;
  company: string;
  role: string;
  location: string;
  salaryRange?: string;
  status: JobStatus;
  dateAdded: string;
  lastUpdated: string;
  description: string;
  notes: string;
  url?: string;
  aiAnalysis?: string; // Stored Gemini analysis
  fitScore?: number; // 0-100
}

export interface EmailThread {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  category: 'RECRUITER' | 'APPLICATION_UPDATE' | 'NETWORKING' | 'OTHER';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  summary?: string;
  suggestedAction?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
  targetRoles: string[];
  skills: string[];
  resumeText: string; 
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'INTERVIEW' | 'NETWORKING' | 'DEADLINE';
  jobId?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  scopes: string[];
  clientId: string;
  setClientId: (id: string) => void;
}

export interface EmailAnalysis {
  category: 'RECRUITER' | 'APPLICATION_UPDATE' | 'NETWORKING' | 'OTHER';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  suggestedAction: string;
}

export interface ResearchResult {
  text: string;
  grounding?: {
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
}

export interface JobDescriptionAnalysis {
  role: string;
  company?: string;
  requirements: string[];
  responsibilities: string[];
}