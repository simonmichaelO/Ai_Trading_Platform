# Database Documentation

> Last updated: Phase 8 — Production Deployment

## Overview

The platform uses **Supabase PostgreSQL** as its database. Supabase provides:
- Managed PostgreSQL (no setup/maintenance)
- Built-in authentication
- Row Level Security (RLS) for data isolation
- Real-time subscriptions
- File storage (for chart images)
- Free tier: 500MB database, 1GB storage

## Schema Overview

### Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `strategies` | User-defined trading strategies | → `auth.users` |
| `analyses` | Every AI analysis performed | → `auth.users`, → `strategies` |
| `trades` | Trading journal entries | → `auth.users`, → `analyses`, → `strategies` |
| `watchlist` | Monitored symbols | → `auth.users` |
| `user_preferences` | User settings | → `auth.users` |
| `market_data_cache` | Cached market data | None (shared) |
| `audit_logs` | System event log | → `auth.users` |

### Entity Relationship

```
users (Supabase Auth)
  ├── strategies (1:N)
  │     └── analyses (1:N via strategy_id)
  ├── analyses (1:N)
  │     └── trades (1:N via analysis_id)
  ├── trades (1:N)
  ├── watchlist (1:N)
  ├── user_preferences (1:1)
  └── audit_logs (1:N)
```

## Security (Row Level Security)

Every table (except `market_data_cache`) has RLS enabled with policies that ensure:
- **Users can only see their own data** — enforced at the database level
- **Service role** (backend) can access all data for administrative operations
- **Market cache** is readable by all authenticated users (shared resource)

## Setup Instructions

See [INSTALLATION.md](INSTALLATION.md) for initial setup and [DEPLOYMENT.md](DEPLOYMENT.md) for production configuration.

### Running Migrations

1. Log in to your Supabase dashboard
2. Go to **SQL Editor** → **New Query**
3. Paste the contents of `database/migrations/001_initial_schema.sql`
4. Click **Run**

## JSONB Fields

Several tables use PostgreSQL's `JSONB` type for flexible data:

- `strategies.entry_rules` — Array of entry rule descriptions
- `strategies.exit_rules` — Array of exit rule descriptions
- `analyses.market_snapshot` — Full OHLCV + indicator data
- `analyses.chart_annotations` — Detected patterns, levels, zones
- `user_preferences.notifications` — Notification toggle settings

This allows us to evolve the data shape without migrations for every change.

## Indexes

Critical queries are indexed for performance:
- User lookups on every table (by `user_id`)
- Time-based sorting (by `created_at DESC`)
- Symbol filtering on analyses and trades
- Strategy lookups

## Backups

Supabase provides automated daily backups on the Pro plan ($25/month). On the free tier, you can manually export data via the dashboard.
