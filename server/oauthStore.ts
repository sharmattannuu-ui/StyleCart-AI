import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const OAUTH_FILE = path.join(DATA_DIR, 'oauth_session.json');

export interface StoredOAuthSession {
  connected: boolean;
  accessToken: string;
  userEmail: string;
  userName: string;
  userPhotoUrl?: string;
  connectedAt: string;
  lastVerifiedAt?: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadOAuthSession(): StoredOAuthSession | null {
  ensureDataDir();
  if (!fs.existsSync(OAUTH_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(OAUTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.connected && parsed.accessToken) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Error reading oauth_session.json:', err);
    return null;
  }
}

export function saveOAuthSession(session: {
  accessToken: string;
  userEmail: string;
  userName?: string;
  userPhotoUrl?: string;
}): StoredOAuthSession {
  ensureDataDir();
  const data: StoredOAuthSession = {
    connected: true,
    accessToken: session.accessToken,
    userEmail: session.userEmail,
    userName: session.userName || session.userEmail.split('@')[0],
    userPhotoUrl: session.userPhotoUrl || '',
    connectedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  };

  const tempFile = `${OAUTH_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, OAUTH_FILE);
  return data;
}

export function clearOAuthSession(): void {
  ensureDataDir();
  try {
    if (fs.existsSync(OAUTH_FILE)) {
      fs.unlinkSync(OAUTH_FILE);
    }
  } catch (err) {
    console.error('Error clearing oauth_session.json:', err);
  }
}

/**
 * Returns a valid access token from the active session or provided header.
 */
export async function getEffectiveAccessToken(providedToken?: string): Promise<string | null> {
  if (providedToken && providedToken.trim()) {
    return providedToken.trim();
  }
  const session = loadOAuthSession();
  if (session && session.accessToken) {
    return session.accessToken;
  }
  return null;
}
