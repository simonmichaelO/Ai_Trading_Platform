# Troubleshooting Guide

> Last updated: Phase 8 — Production Deployment

## Common Issues & Solutions

### Backend won't start

**Error:** `❌ Missing required environment variable: SUPABASE_URL`
- **Cause:** Your `.env` file is missing or incomplete
- **Fix:** Copy `.env.example` to `.env` and fill in all required values

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`
- **Cause:** Another app is using port 5000
- **Fix:** Change PORT in `backend/.env` or kill the other process:
  ```bash
  # Mac/Linux
  lsof -i :5000
  kill -9 <PID>
  ```

### Frontend won't start

**Error:** `Module not found: Can't resolve '@/...'`
- **Cause:** Path aliases not configured
- **Fix:** Ensure you ran `npm install` in the `frontend/` directory

**Error:** `Warning: Supabase URL not configured`
- **Cause:** `.env.local` is missing
- **Fix:** Copy `.env.local.example` to `.env.local` and fill in values

### API requests fail with CORS errors

**Cause:** Frontend and backend are on different ports
**Fix:** Ensure `CORS_ORIGIN` in `backend/.env` matches your frontend URL:
```
CORS_ORIGIN=http://localhost:3000
```

### TypeScript errors

**Fix:**
```bash
# Backend
cd backend && npm run type-check

# Frontend  
cd frontend && npm run type-check
```

### Database connection issues

**Cause:** Supabase project URL or keys are incorrect
**Fix:** 
1. Go to Supabase Dashboard → Settings → API
2. Verify URL and keys match your `.env` values
3. Ensure the project is not paused (free tier pauses after 7 days of inactivity)

### AI provider errors

**Error:** `401 Unauthorized` from OpenAI/Anthropic/Gemini
- **Cause:** API key is invalid or expired
- **Fix:** Generate a new key from the provider's dashboard

**Error:** `429 Too Many Requests`
- **Cause:** Rate limit exceeded
- **Fix:** Wait a minute or switch to a different provider

## Getting Help

1. Check the [Architecture docs](ARCHITECTURE.md) for how data flows
2. Check backend logs for error details
3. Check browser console (F12) for frontend errors
4. Check Supabase dashboard → Logs for database errors
