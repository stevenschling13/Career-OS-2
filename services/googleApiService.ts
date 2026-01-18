import { EmailThread, JobPosting } from "../types";

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Fetches recent threads from the user's inbox.
 */
export const fetchGmailThreads = async (maxResults = 15): Promise<EmailThread[]> => {
  try {
    const response = await fetch(`/api/google/gmail/threads?maxResults=${maxResults}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error || 'Failed to fetch Gmail threads';
      throw new Error(message);
    }

    const data = await response.json();
    return data.threads ?? [];
  } catch (error) {
    console.error('Error fetching Gmail threads:', error);
    throw error;
  }
};

/**
 * SYNC: Loads Career OS data (Jobs, Settings) from a specific file in Google Drive.
 * Uses the 'drive.file' scope to find a file named 'career-os-data.json'.
 */
export const loadDataFromDrive = async (accessToken: string): Promise<{ jobs: JobPosting[] } | null> => {
  try {
    // 1. Search for our file
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}?q=name='career-os-data.json' and trashed=false&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      // 2. Download content
      const fileId = searchData.files[0].id;
      const fileResponse = await fetch(`${DRIVE_API_BASE}/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return await fileResponse.json();
    }
    
    return null; // File doesn't exist yet
  } catch (error) {
    console.error('Error loading from Drive:', error);
    return null;
  }
};

/**
 * SYNC: Saves Career OS data to Google Drive.
 * Creates the file if it doesn't exist, updates it if it does.
 */
export const saveDataToDrive = async (accessToken: string, data: { jobs: JobPosting[] }) => {
  try {
    // 1. Check if file exists
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}?q=name='career-os-data.json' and trashed=false&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchResponse.json();
    
    const fileContent = JSON.stringify(data);
    const fileMetadata = {
      name: 'career-os-data.json',
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    if (searchData.files && searchData.files.length > 0) {
      // Update existing file
      const fileId = searchData.files[0].id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
    } else {
      // Create new file
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
    }
    console.log('Data synced to Drive successfully');
  } catch (error) {
    console.error('Error saving to Drive:', error);
    throw error;
  }
};
