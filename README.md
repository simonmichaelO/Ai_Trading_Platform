# AI Trading Analysis Platform

A professional AI-powered trading analysis platform that fetches live market data, performs multi-provider AI analysis, generates annotated charts, and maintains a comprehensive trading journal.

## Architecture

```
TradingView/API → Backend (Express) → Database (Supabase) → AI Providers → Dashboard (Next.js)
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth
- **AI:** OpenAI, Claude, Gemini (modular, extensible)

## Quick Start

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for complete setup instructions.

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Guide](docs/API_GUIDE.md)
- [Database Schema](docs/DATABASE.md)
- [AI System](docs/AI_SYSTEM.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [How to Update](docs/HOW_TO_UPDATE.md)

## Project Structure

```
ai-trading-platform/
├── backend/          # Express + TypeScript API server
├── frontend/         # Next.js + React dashboard
├── database/         # SQL migrations
└── docs/             # Complete documentation
```

## License

Proprietary — All rights reserved.
