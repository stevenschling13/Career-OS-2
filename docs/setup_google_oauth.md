# Google OAuth Setup Guide

To enable Google Workspace integration (Gmail, Calendar), you must set up a Google Cloud Project and configure the backend environment.

## 1. Google Cloud Console Setup

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** named "Career OS".
3.  **Enable APIs:**
    *   Navigate to **APIs & Services > Library**.
    *   Search for and enable:
        *   **Gmail API**
        *   **Google Calendar API**

4.  **Configure OAuth Consent Screen:**
    *   Go to **APIs & Services > OAuth consent screen**.
    *   Select **External** (unless you have a Workspace organization, then Internal is fine).
    *   Fill in app name and email.
    *   **Scopes:** Add `.../auth/gmail.readonly`, `.../auth/calendar.readonly`, `userinfo.email`, `userinfo.profile`.
    *   **Test Users:** Add your own Google email address (Critical for External apps in Testing mode).

5.  **Create Credentials:**
    *   Go to **Credentials > Create Credentials > OAuth client ID**.
    *   Application Type: **Web application**.
    *   Name: "Career OS Dev".
    *   **Authorized JavaScript origins:**
        *   `http://localhost:5173` (Frontend)
    *   **Authorized redirect URIs:**
        *   `http://localhost:8787/auth/google/callback` (Backend)
    *   **Verify** your redirect URIs include `http://localhost:8787/auth/google/callback` (or your deployed backend URL).
    *   Click **Create**.
    *   **COPY** the `Client ID` and `Client Secret`.

## 2. Backend Configuration

1.  Navigate to the `backend` folder.
2.  Copy `.env.example` to `.env`.
3.  Fill in the values:

```bash
GOOGLE_CLIENT_ID=your_pasted_client_id
GOOGLE_CLIENT_SECRET=your_pasted_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/google/callback
FRONTEND_URL=http://localhost:5173

# Generate secure keys (run these in terminal node REPL):
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY=...
COOKIE_SECRET=...
```

## 3. Running the App

1.  **Install Dependencies:**
    ```bash
    npm install
    cd backend && npm install
    ```

2.  **Initialize Database:**
    ```bash
    cd backend
    npx prisma generate
    npx prisma db push
    ```

3.  **Start Development:**
    Return to the root folder and run:
    ```bash
    npm run dev
    ```
    This starts both Frontend (5173) and Backend (8787).

## 4. Verification

1.  Open `http://localhost:5173`.
2.  Go to **Settings**.
3.  Click **Connect Google Account**.
4.  You should be redirected to Google, ask for consent, and redirect back to Settings with a "SECURELY CONNECTED" status.
5.  Check the **Dashboard** to see your upcoming calendar events.
