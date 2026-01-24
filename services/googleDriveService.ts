
// Declare gapi and google globals to fix TypeScript errors.
declare const gapi: any;
declare const google: any;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let accessToken: string | null = null;
let isInitializing = false;

/**
 * Initialize the Google API client
 */
export const initGoogleApi = (): Promise<void> => {
  if (isInitializing) return Promise.resolve();
  isInitializing = true;

  return new Promise((resolve) => {
    if (typeof gapi === 'undefined') {
      console.error('GAPI script not detected in index.html');
      isInitializing = false;
      return resolve();
    }
    
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
      } catch (e) {
        console.error('Error during gapi client init:', e);
      }
      resolve();
    });
  });
};

/**
 * Requesting access token via Google Identity Services
 */
export const authenticateGoogle = (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined') {
      return reject(new Error('Google Identity Services script not loaded.'));
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(response);
          }
          accessToken = response.access_token;
          resolve(response.access_token);
        },
      });
      client.requestAccessToken();
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Upload or Update a file on Google Drive using multipart upload
 */
export const saveToDrive = async (fileName: string, content: string, mimeType: string = 'application/json') => {
  if (!accessToken) throw new Error('Not authenticated with Google. Please log in.');

  // 1. Search for existing file to perform update instead of duplicate
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  if (searchResponse.status === 401) {
    accessToken = null; // Clear stale token
    throw new Error('Session expired. Please click Backup again to re-authenticate.');
  }

  const searchResult = await searchResponse.json();
  const existingFile = searchResult.files?.[0];

  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (existingFile) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload to Google Drive.');
  }

  return response.json();
};

export const isAuthenticated = () => !!accessToken;
