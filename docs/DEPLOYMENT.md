# Deployment Guide

> Last updated: Phase 8 — Production Deployment

This guide walks you through deploying the AI Trading Platform to production, step by step.

## Recommended Stack (Cheapest + Most Reliable)

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| Frontend | **Vercel** | Free | Next.js hosting, auto-deploys from GitHub |
| Backend | **Railway** | $5 trial credit/mo | Express API hosting |
| Database | **Supabase** | Free (or $25/mo Pro) | PostgreSQL + Auth + Storage |

**Total: $0–30/month**

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub account
- [x] Code pushed to a GitHub repository
- [x] Supabase project created (from Phase 3 setup)
- [x] At least one AI provider API key (OpenAI, Anthropic, or Gemini)

---

## Step 1: Push Code to GitHub

```bash
cd ai-trading-platform

# Initialize git (if not already done)
git init
git add .
git commit -m "Production-ready: AI Trading Platform"

# Create repo on GitHub (github.com/new), then:
git remote add origin https://github.com/YOUR_USERNAME/ai-trading-platform.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Supabase (if not done)

1. Go to https://supabase.com → **New Project**
2. Note your **Project URL** and **API keys** from Settings → API
3. Run the database migration:
   - Go to SQL Editor → New Query
   - Paste contents of `database/migrations/001_initial_schema.sql`
   - Click Run
4. Configure Auth:
   - Go to Authentication → Providers → Email
   - Enable Email provider
   - **For production**: Enable "Confirm email"
   - Save

---

## Step 3: Deploy Backend to Railway

### 3a. Create Railway Account

1. Go to https://railway.app → Sign up (use GitHub)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository: `ai-trading-platform`
4. When asked for root directory, enter: `backend`

### 3b. Configure Environment Variables

In Railway dashboard, go to your service → **Variables** tab. Add these:

```
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1

# 🔴 CHANGE THIS — Your deployed frontend URL (from Step 4)
CORS_ORIGIN=https://your-app.vercel.app

# 🔴 CHANGE THIS — From Supabase Settings → API
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
SUPABASE_ANON_KEY=your-anon-public-key

# 🔴 CHANGE THIS — At least one AI key
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GEMINI_API_KEY=your-gemini-key

# Optional: For stocks/indices data
ALPHAVANTAGE_API_KEY=your-free-key

LOG_LEVEL=warn
```

⚠️ **CRITICAL**: The `SUPABASE_SERVICE_ROLE_KEY` is SECRET. Never share it or put it in frontend code.

### 3c. Deploy

Railway will automatically build using the Dockerfile. First deploy takes 2-3 minutes.

### 3d. Get Your Backend URL

1. Go to your service → **Settings** → **Networking** → **Generate Domain**
2. You'll get a URL like: `https://ai-trading-backend-production.up.railway.app`
3. **Copy this URL** — you'll need it for the frontend.

### 3e. Verify Backend

Open your backend URL + `/health` in a browser:
```
https://ai-trading-backend-production.up.railway.app/health
```

You should see:
```json
{"status":"ok","timestamp":"...","environment":"production","version":"1.0.0"}
```

---

## Step 4: Deploy Frontend to Vercel

### 4a. Create Vercel Account

1. Go to https://vercel.com → Sign up (use GitHub)
2. Click **Add New** → **Project**
3. Import your GitHub repository

### 4b. Configure Build Settings

Vercel auto-detects Next.js. Verify these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 4c. Configure Environment Variables

In Vercel project settings → **Environment Variables**. Add:

```
# 🔴 CHANGE THIS — From Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# 🔴 CHANGE THIS — Your Railway backend URL (from Step 3d)
NEXT_PUBLIC_API_URL=https://ai-trading-backend-production.up.railway.app
```

⚠️ **Note**: Frontend only uses PUBLIC keys. Never put service_role keys here.

### 4d. Deploy

Click **Deploy**. First build takes 1-2 minutes.

### 4e. Get Your Frontend URL

Vercel gives you a URL like: `https://ai-trading-platform.vercel.app`

### 4f. Update Backend CORS

Go back to Railway → Variables → Update `CORS_ORIGIN`:

```
CORS_ORIGIN=https://ai-trading-platform.vercel.app
```

Railway will automatically redeploy with the new CORS setting.

---

## Step 5: Verify Production

### 5a. Test the Full Flow

1. Open your Vercel URL
2. You should see the login page
3. Click **Create one** → Register a new account
4. After login, you'll see the dashboard
5. Test each feature:
   - ✅ Market page shows live prices
   - ✅ Strategies page shows default strategy
   - ✅ AI Analysis runs (if you added an AI key)
   - ✅ Journal lets you open/close trades
   - ✅ Settings saves preferences
   - ✅ Replay mode navigates through analyses

### 5b. Check Backend Health

Visit: `https://your-backend.up.railway.app/api/v1/health`

### 5c. Check Database

In Supabase Dashboard → Table Editor → Verify tables have data:
- `user_preferences` should have your row
- `strategies` should have the default strategy
- `analyses` should have any analyses you ran

---

## Step 6: Custom Domain (Optional)

### Frontend (Vercel)
1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `trading.yourdomain.com`)
3. Follow DNS instructions (add CNAME record)

### Backend (Railway)
1. Go to Railway service → Settings → Networking
2. Add custom domain
3. Follow DNS instructions

---

## Troubleshooting

### Backend returns CORS errors
- Check `CORS_ORIGIN` in Railway matches your Vercel URL exactly (including https://, no trailing slash)

### Frontend shows "Failed to fetch"
- Check `NEXT_PUBLIC_API_URL` in Vercel matches your Railway URL
- Ensure Railway service is running (check logs)

### AI analysis fails
- Verify your AI API key is correct and has credits
- Check Railway logs for specific error messages

### Database connection errors
- Verify Supabase project is active (free tier pauses after 7 days of inactivity)
- Check `SUPABASE_URL` and keys are correct

### Can't log in
- Check Supabase Auth settings (Email provider enabled)
- If "Confirm email" is on, check your email for verification link

---

## Cost Monitoring

| Service | Free Tier Limits | When You'll Need to Upgrade |
|---------|-----------------|---------------------------|
| Vercel | 100GB bandwidth/mo | High traffic (>10k daily users) |
| Railway | $5 trial credit/mo | Consistent usage (~$5-20/mo) |
| Supabase | 500MB DB, 1GB storage, 50k auth users | >500MB data or >50k users |

**Estimated cost at 100 daily users:** $10-25/month

---

## Ongoing Maintenance

### Updating the Platform

```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push origin main
```

Both Vercel and Railway will **automatically redeploy** when you push to main.

### Monitoring

- **Railway**: Dashboard → Logs (watch for errors)
- **Vercel**: Dashboard → Analytics (watch traffic)
- **Supabase**: Dashboard → Logs (watch database)

### Backups

- Supabase Pro ($25/mo) includes daily automated backups
- Free tier: Export data manually via Supabase dashboard

---

## Security Checklist

- [x] No secrets in frontend code
- [x] Service role key only in backend environment
- [x] CORS configured to only allow your frontend domain
- [x] Rate limiting enabled on backend
- [x] Helmet security headers enabled
- [x] Row Level Security enabled on all database tables
- [x] Environment variables not committed to Git
- [x] .env files in .gitignore
- [x] Non-root Docker user
- [x] HTTPS enforced (automatic on Vercel/Railway)

---

## Architecture in Production

```
┌──────────────────────────────────────┐
│            Users (Browser)           │
└──────────────┬───────────────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────────────┐
│         Vercel (Frontend)            │
│         Next.js + React              │
│         Auto-deploys from GitHub     │
└──────────────┬───────────────────────┘
               │ REST API (HTTPS)
               ▼
┌──────────────────────────────────────┐
│        Railway (Backend)             │
│        Express + TypeScript          │
│        Docker container              │
│        Auto-deploys from GitHub      │
└──────────────┬───────────────────────┘
               │ PostgreSQL + Auth
               ▼
┌──────────────────────────────────────┐
│          Supabase                    │
│    PostgreSQL │ Auth │ Storage       │
└──────────────────────────────────────┘
```

**Congratulations — your AI Trading Platform is live!** 🎉
