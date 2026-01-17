import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { google } from 'googleapis';
// import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './utils/crypto';
import dotenv from 'dotenv';
import process from 'node:process';
import crypto from 'node:crypto';

dotenv.config();

// Initialize In-Memory Store (Replacing Prisma for this environment)
// const prisma = new PrismaClient();
interface GoogleAccount {
  sub: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: bigint;
  scope: string;
  lastSyncedAt: Date;
}

const db = {
  googleAccounts: new Map<string, GoogleAccount>()
};

const app = Fastify({ logger: true });

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
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly'
];

// --- Helpers ---

/**
 * Retrieves an authenticated Google OAuth2 client for a given user ID (sub).
 * Handles token decryption and automatic refreshing if supported.
 */
async function getAuthenticatedClient(sub: string) {
  // const account = await prisma.googleAccount.findUnique({ where: { sub } });
  const account = db.googleAccounts.get(sub);
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
      /*
      await prisma.googleAccount.update({
        where: { sub },
        data: {
          accessToken: encrypt(tokens.access_token),
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
          ...(tokens.refresh_token ? { refreshToken: encrypt(tokens.refresh_token) } : {})
        }
      });
      */
      const current = db.googleAccounts.get(sub);
      if (current) {
        db.googleAccounts.set(sub, {
            ...current,
            accessToken: encrypt(tokens.access_token),
            expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
            ...(tokens.refresh_token ? { refreshToken: encrypt(tokens.refresh_token) } : {})
        });
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

    // Encrypt and Store in SQLite via Prisma (Replaced with In-Memory)
    /*
    await prisma.googleAccount.upsert({
      where: { sub: userInfo.data.id },
      update: {
        accessToken: encrypt(tokens.access_token!),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
        email: userInfo.data.email,
        scope: tokens.scope || '',
        lastSyncedAt: new Date()
      },
      create: {
        sub: userInfo.data.id,
        email: userInfo.data.email,
        accessToken: encrypt(tokens.access_token!),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
        scope: tokens.scope || ''
      }
    });
    */
    
    const accountData: GoogleAccount = {
        sub: userInfo.data.id,
        email: userInfo.data.email,
        accessToken: encrypt(tokens.access_token!),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
        scope: tokens.scope || '',
        lastSyncedAt: new Date()
    };
    
    // Check if exists to preserve refreshToken if new one is not provided? 
    // Usually tokens.refresh_token is only provided if prompt=consent. We used prompt=consent.
    const existing = db.googleAccounts.get(userInfo.data.id);
    if (existing) {
        if (!tokens.refresh_token && existing.refreshToken) {
            accountData.refreshToken = existing.refreshToken;
        }
    }
    
    db.googleAccounts.set(userInfo.data.id, accountData);


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

    return reply.redirect(`${CONFIG.frontendUrl}/settings`);

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

  // const account = await prisma.googleAccount.findUnique({ 
  //   where: { sub },
  //   select: { email: true, lastSyncedAt: true }
  // });
  const account = db.googleAccounts.get(sub);

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