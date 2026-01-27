import { getRegisteredUsers, getStoredTrades, saveUsers, saveTrades } from "./storageService";

const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const VAULT_FILE_NAME = "TradeMind_AI_Vault.json";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes Google API Client and Identity Services.
 * Assumes scripts are loaded in index.html.
 */
export const initializeGoogleSync = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkInit = () => {
      if (gapiInited && gisInited) resolve();
    };

    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google) {
      setTimeout(() => initializeGoogleSync().then(resolve), 500);
      return;
    }

    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: process.env.API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      checkInit();
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: (process.env as any).GOOGLE_CLIENT_ID || "",
      scope: SCOPES,
      callback: "", // defined at runtime
    });
    gisInited = true;
    checkInit();
  });
};

/**
 * Authenticates the user and returns the access token.
 */
export const authenticateCloud = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
        }
        resolve(resp.access_token);
      };

      const gapi = (window as any).gapi;
      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        tokenClient.requestAccessToken({ prompt: "" });
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Uploads current local storage data to Google Drive.
 */
export const syncToCloud = async (): Promise<boolean> => {
  try {
    const gapi = (window as any).gapi;
    const data = {
      users: getRegisteredUsers(),
      trades: getStoredTrades(),
      syncedAt: new Date().toISOString()
    };
    const content = JSON.stringify(data);

    // Search for existing file
    const response = await gapi.client.drive.files.list({
      q: `name = '${VAULT_FILE_NAME}' and trashed = false`,
      fields: "files(id)",
    });

    const existingFile = response.result.files[0];
    const fileId = existingFile ? existingFile.id : null;

    const metadata = {
      name: VAULT_FILE_NAME,
      mimeType: "application/json",
    };

    const boundary = "314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      content +
      close_delim;

    const request = gapi.client.request({
      path: fileId ? `/upload/drive/v3/files/${fileId}` : "/upload/drive/v3/files",
      method: fileId ? "PATCH" : "POST",
      params: { uploadType: "multipart" },
      headers: {
        "Content-Type": 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });

    await request;
    return true;
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    return false;
  }
};

/**
 * Downloads data from Google Drive and restores it to local storage.
 */
export const restoreFromCloud = async (): Promise<boolean> => {
  try {
    const gapi = (window as any).gapi;
    const response = await gapi.client.drive.files.list({
      q: `name = '${VAULT_FILE_NAME}' and trashed = false`,
      fields: "files(id)",
    });

    const file = response.result.files[0];
    if (!file) {
      alert("No vault found in your Google Drive.");
      return false;
    }

    const fileData = await gapi.client.drive.files.get({
      fileId: file.id,
      alt: "media",
    });

    const data = typeof fileData.result === 'string' ? JSON.parse(fileData.result) : fileData.result;
    
    if (data.users && data.trades) {
      saveUsers(data.users);
      saveTrades(data.trades);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Cloud Restore Error:", error);
    return false;
  }
};