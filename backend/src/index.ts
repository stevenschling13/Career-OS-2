import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { google } from 'googleapis';
import { encrypt, decrypt } from './utils/crypto';
import dotenv from 'dotenv';
import process from 'node:process';
import crypto from 'node:crypto';

dotenv.config();

const app = Fastify({ logger: true });

// --- Mock Database (In-Memory) ---
// Replacing Prisma to ensure code runs without DB generation steps
interface GoogleAccount {
  sub: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: bigint;
  scope: string;
  lastSyncedAt?: Date;
}

const db = new Map<string, GoogleAccount>();

// --- Types & Schema Validation ---
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// --- Configuration ---
const CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || 'fallback-secret-for-dev-only-change-me',
};

// --- Plugins ---
app.register(cors, {
  origin: [CONFIG.frontendUrl],
  credentials: true,
});

app.register(cookie, {
  secret: CONFIG.cookieSecret,
  parseOptions: {} 
});

// --- Google OAuth Setup ---
const oauth2Client = new google.auth.OAuth2(
  CONFIG.clientId,
  CONFIG.clientSecret,
  CONFIG.redirectUri
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.file'
];

// --- Helpers ---

/**
 * Retrieves an authenticated Google OAuth2 client for a given user ID (sub).
 * Handles token decryption and automatic refreshing if supported.
 */
async function getAuthenticatedClient(sub: string) {
  const account = db.get(sub);
  if (!account) return null;

  const client = new google.auth.OAuth2(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.redirectUri
  );

  client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: account.refreshToken ? decrypt(account.refreshToken) : undefined,
    // Convert BigInt to Number for the googleapis library
    expiry_date: account.expiryDate ? Number(account.expiryDate) : undefined
  });

  // Handle refresh if needed (middleware-like behavior)
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const existing = db.get(sub);
      if (existing) {
        const updated: GoogleAccount = {
          ...existing,
          accessToken: encrypt(tokens.access_token),
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : existing.expiryDate,
        };
        
        if (tokens.refresh_token) {
          updated.refreshToken = encrypt(tokens.refresh_token);
        }

        db.set(sub, updated);
      }
    }
  });

  return client;
}

// --- Routes ---

// 1. Start OAuth Flow
app.get('/auth/google/start', async (req, reply) => {
  const state = crypto.randomUUID();
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for refresh token
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: 'consent', // Force consent to ensure refresh token on first connect
    state: state
  });

  // Store state in a signed cookie to verify on callback
  reply.setCookie('oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    signed: true
  });

  return reply.redirect(authUrl);
});

// 2. OAuth Callback
app.get('/auth/google/callback', async (req, reply) => {
  const { code, state } = req.query as { code: string; state: string };
  const storedState = req.cookies.oauth_state ? req.unsignCookie(req.cookies.oauth_state) : null;

  if (!storedState || !storedState.valid || storedState.value !== state) {
    return reply.status(400).send({ error: 'Invalid state parameter' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get basic profile info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    if (!userInfo.data.id || !userInfo.data.email) {
      throw new Error('Failed to retrieve user info');
    }

    // Encrypt and Store in Memory
    const sub = userInfo.data.id;
    const existing = db.get(sub);
    
    const accountData: GoogleAccount = {
      sub,
      email: userInfo.data.email,
      accessToken: encrypt(tokens.access_token!),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : (existing?.refreshToken),
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : (existing?.expiryDate),
      scope: tokens.scope || existing?.scope || '',
      lastSyncedAt: new Date()
    };

    db.set(sub, accountData);

    // Create a simple session cookie
    reply.setCookie('career_os_session', userInfo.data.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      signed: true,
      sameSite: 'lax'
    });
    
    // Clear state cookie
    reply.clearCookie('oauth_state');

    // Redirect to frontend (HashRouter)
    return reply.redirect(`${CONFIG.frontendUrl}/#/settings`);

  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: 'Authentication failed' });
  }
});

// 3. Disconnect
app.post('/auth/google/disconnect', async (req, reply) => {
  reply.clearCookie('career_os_session');
  return { success: true };
});

// 4. Status Check
app.get('/api/google/status', async (req, reply) => {
  const sub = req.cookies.career_os_session ? req.unsignCookie(req.cookies.career_os_session).value : null;
  
  if (!sub) {
    return { connected: false };
  }

  const account = db.get(sub);

  if (!account) {
    return { connected: false };
  }

  return { 
    connected: true, 
    email: account.email,
    lastSyncedAt: account.lastSyncedAt
  };
});

// 5. API: Upcoming Calendar Events
app.get('/api/google/calendar/upcoming', async (req, reply) => {
  const sub = req.cookies.career_os_session ? req.unsignCookie(req.cookies.career_os_session).value : null;
  if (!sub) return reply.status(401).send({ error: 'Unauthorized' });

  const auth = await getAuthenticatedClient(sub);
  if (!auth) return reply.status(401).send({ error: 'Session expired' });

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return { events: response.data.items };
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch calendar events' });
  }
});

// 6. API: Gmail Profile
app.get('/api/google/gmail/profile', async (req, reply) => {
  const sub = req.cookies.career_os_session ? req.unsignCookie(req.cookies.career_os_session).value : null;
  if (!sub) return reply.status(401).send({ error: 'Unauthorized' });

  const auth = await getAuthenticatedClient(sub);
  if (!auth) return reply.status(401).send({ error: 'Session expired' });

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    const response = await gmail.users.getProfile({ userId: 'me' });
    return response.data;
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch Gmail profile' });
  }
});

// 7. API: Gmail Threads
app.get('/api/google/gmail/threads', async (req, reply) => {
  const sub = req.cookies.career_os_session ? req.unsignCookie(req.cookies.career_os_session).value : null;
  if (!sub) return reply.status(401).send({ error: 'Unauthorized' });

  const auth = await getAuthenticatedClient(sub);
  if (!auth) return reply.status(401).send({ error: 'Session expired' });

  const maxResultsParam = (req.query as { maxResults?: string }).maxResults;
  const maxResults = Number.isFinite(Number(maxResultsParam)) ? Number(maxResultsParam) : 15;

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    const listResponse = await gmail.users.threads.list({
      userId: 'me',
      maxResults,
      q: 'in:inbox',
    });

    const threads = listResponse.data.threads ?? [];
    const detailedThreads = await Promise.all(
      threads.map(async (thread) => {
        if (!thread.id) return null;

        const detailResponse = await gmail.users.threads.get({
          userId: 'me',
          id: thread.id,
        });

        const messages = detailResponse.data.messages ?? [];
        const latestMsg = messages[messages.length - 1];

        if (!latestMsg || !latestMsg.payload?.headers) return null;

        const headers = latestMsg.payload.headers;
        const subject = headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';

        return {
          id: thread.id,
          sender: from,
          subject,
          snippet: latestMsg.snippet ?? '',
          date: new Date(Number(latestMsg.internalDate)).toISOString(),
          isRead: !(latestMsg.labelIds ?? []).includes('UNREAD'),
          category: 'OTHER',
          priority: 'MEDIUM',
        };
      })
    );

    return { threads: detailedThreads.filter(Boolean) };
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch Gmail threads' });
  }
});

// Start Server
const start = async () => {
  try {
    await app.listen({ port: 8787, host: '0.0.0.0' });
    console.log(`Backend listening on http://localhost:8787`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
