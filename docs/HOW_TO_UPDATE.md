# How to Update the Platform

> Last updated: Phase 1 — Foundation Setup

## Updating Dependencies

### Backend
```bash
cd backend

# Check for outdated packages
npm outdated

# Update all packages (safe — minor/patch only)
npm update

# Update a specific package
npm install package-name@latest
```

### Frontend
```bash
cd frontend

# Check for outdated packages
npm outdated

# Update all packages (safe — minor/patch only)
npm update

# Update a specific package
npm install package-name@latest
```

## Updating the Codebase

When new phases are added:

1. **Pull the latest code:**
   ```bash
   git pull origin main
   ```

2. **Install new dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Run database migrations** (if any):
   - Check `database/migrations/` for new files
   - Run them in Supabase SQL Editor in order

4. **Update environment variables:**
   - Compare `.env.example` with your `.env`
   - Add any new variables that were introduced

5. **Restart both servers:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

## Version Tracking

The platform doesn't use semantic versioning during active development. Instead, each phase represents a milestone:

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation & Architecture | ✅ Complete |
| 2 | Authentication System | ✅ Complete |
| 3 | Database Integration | ✅ Complete |
| 4 | Market Data Engine | ✅ Complete |
| 5 | AI Service Layer | ✅ Complete |
| 6 | Dashboard UI | ✅ Complete |
| 7 | Trading Journal | ✅ Complete |
| 8 | Strategy Manager | ✅ Complete |
| 9 | Chart Vision & Annotations | ✅ Complete |
| 10 | Replay Mode & Polish | ✅ Complete |
| 11 | Production Deployment | ✅ Complete |

## Rollback

If something breaks after an update:

```bash
# Go back to the previous working version
git log --oneline  # Find the commit hash
git checkout <commit-hash>

# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```
