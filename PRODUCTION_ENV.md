# ============================================
# PRODUCTION ENVIRONMENT REFERENCE
# ============================================
# This file shows what your PRODUCTION environment
# variables should look like. Copy relevant sections
# to your hosting provider's environment settings.
#
# ⚠️ NEVER commit real values to Git.
# ⚠️ Set these in your hosting provider's dashboard.

# ════════════════════════════════════════════
# BACKEND (Railway / Render / Docker)
# ════════════════════════════════════════════

NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1

# 🔴 Your deployed frontend URL (Vercel)
CORS_ORIGIN=https://your-app.vercel.app

# 🔴 From Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # SECRET! Backend only!
SUPABASE_ANON_KEY=eyJhbGciOi...           # Public key (also in frontend)

# 🔴 AI Provider Keys (at least one required)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...

# 🔴 Optional: For stock/index data
ALPHAVANTAGE_API_KEY=...

LOG_LEVEL=warn


# ════════════════════════════════════════════
# FRONTEND (Vercel)
# ════════════════════════════════════════════

# 🔴 From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# 🔴 Your deployed backend URL (Railway)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
