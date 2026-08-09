# Installation Guide

> Last updated: Phase 8 — Production Deployment

## Prerequisites

Before you begin, you'll need to install these on your computer:

### 1. Node.js (v18 or higher)

**What it is:** The runtime that runs JavaScript/TypeScript on your computer.

🔴 **Download:** https://nodejs.org/ — Choose the **LTS** version (not Current)

**Verify it's installed:**
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
```

### 2. Git

**What it is:** Version control system to track code changes.

🔴 **Download:** https://git-scm.com/downloads

**Verify:**
```bash
git --version
```

### 3. VS Code (recommended editor)

🔴 **Download:** https://code.visualstudio.com/

Recommended extensions:
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prisma (for database visualization)

---

## Step 1: Get the Code

```bash
# Navigate to where you want the project
cd ~/projects

# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-trading-platform.git
cd ai-trading-platform
```

---

## Step 2: Backend Setup

```bash
# Navigate to the backend folder
cd backend

# Install all dependencies (this may take 1-2 minutes)
npm install

# Create your environment file from the template
cp .env.example .env
```

### Configure .env

Open `backend/.env` in your editor. You'll see entries marked with 🔴 CHANGE THIS.

**For Phase 1, you only need to set these:**

```env
# Keep these as-is for local development:
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# 🔴 CHANGE THIS — You'll get these from Supabase (Phase 3)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# AI keys can stay empty for now (Phase 5+)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

### Start the Backend

```bash
npm run dev
```

You should see:
```
🚀 Server is running { port: 5000, env: 'development' }
📡 Health check: http://localhost:5000/health
```

**Test it:** Open http://localhost:5000/health in your browser. You should see:
```json
{ "status": "ok", "timestamp": "...", "environment": "development" }
```

---

## Step 3: Frontend Setup

Open a **new terminal** (keep the backend running in the first one):

```bash
# Navigate to the frontend folder
cd frontend

# Install all dependencies
npm install

# Create your environment file from the template
cp .env.local.example .env.local
```

### Configure .env.local

```env
# 🔴 CHANGE THIS — Same as backend, but use the anon key only
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Leave empty for local dev (uses Next.js proxy)
NEXT_PUBLIC_API_URL=
```

### Start the Frontend

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
```

**Test it:** Open http://localhost:3000 in your browser. You should see the Phase 1 status page.

---

## Step 4: Supabase Setup

> **This step is required for Phase 2 (Authentication) to work.**

### 4a. Create a Supabase Project

1. Go to https://supabase.com and sign up (free)
2. Click **New Project**
3. Give it a name (e.g., "AI Trading Platform")
4. Set a strong database password (save it somewhere safe!)
5. Choose the region closest to you
6. Click **Create new project** (takes ~2 minutes)

### 4b. Get Your API Keys

Once the project is created:

1. Go to **Settings** (gear icon, left sidebar) → **API**
2. Copy these values:

| Value | Where to find it | Paste it in |
|-------|------------------|-------------|
| Project URL | "Project URL" at top | `backend/.env` → `SUPABASE_URL` AND `frontend/.env.local` → `NEXT_PUBLIC_SUPABASE_URL` |
| service_role key | Under "Project API keys" → **service_role** (secret!) | `backend/.env` → `SUPABASE_SERVICE_ROLE_KEY` ONLY |
| anon public key | Under "Project API keys" → **anon public** | `backend/.env` → `SUPABASE_ANON_KEY` AND `frontend/.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

⚠️ **NEVER put the service_role key in the frontend!** It has full database access.

### 4c. Enable Email Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Expand **Email**
3. Make sure **Enable Email provider** is ON
4. For development: turn OFF **Confirm email** (so you don't need to verify emails)
5. Click **Save**

### 4d. Run the Database Migration

1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `database/migrations/001_initial_schema.sql` from the project
4. Copy its entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### 4e. Restart Both Servers

After configuring the keys:

```bash
# Terminal 1 — restart backend
cd backend
npm run dev

# Terminal 2 — restart frontend
cd frontend
npm run dev
```

### 4f. Test Authentication

1. Open http://localhost:3000
2. You'll be redirected to the login page
3. Click **Create one** to go to the register page
4. Enter your email and a password (6+ characters)
5. Click **Create Account**
6. You'll be redirected to the dashboard!

---

## What's Next

Once authentication is working, you're ready for **Phase 3** where we'll connect the backend to the database and build the data layer.
