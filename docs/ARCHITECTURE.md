# Architecture Documentation

> Last updated: Phase 3 — Database Integration

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend (Port 3000)                   │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐    │   │
│  │  │  Pages   │  │  Components  │  │  React Query      │    │   │
│  │  │ (Routes) │  │  (shadcn/ui) │  │  (Data Fetching)  │    │   │
│  │  └──────────┘  └──────────────┘  └───────────────────┘    │   │
│  │                                                             │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ Supabase Client  │  │  API Client (Axios)          │   │   │
│  │  │ (Auth only)      │  │  → Backend REST API          │   │   │
│  │  └──────────────────┘  └──────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTPS (REST API)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER (Express.js)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Backend API (Port 5000)                        │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐     │   │
│  │  │  Routes  │→ │ Controllers  │→ │    Services      │     │   │
│  │  └──────────┘  └──────────────┘  └──────────────────┘     │   │
│  │                                          │                  │   │
│  │  ┌──────────────┐  ┌─────────────────────┤                 │   │
│  │  │  Middleware   │  │                     ▼                 │   │
│  │  │ (Auth, CORS,  │  │  ┌──────────────────────────────┐   │   │
│  │  │  Rate Limit)  │  │  │      Repositories            │   │   │
│  │  └──────────────┘  │  │  (Database Access Layer)      │   │   │
│  │                     │  └──────────────────────────────┘   │   │
│  │                     └─────────────────────────────────────│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AI Service Layer                          │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐     │   │
│  │  │  OpenAI  │  │   Anthropic  │  │    Gemini        │     │   │
│  │  │  (GPT)   │  │  (Claude)    │  │  (Gemini Pro)    │     │   │
│  │  └──────────┘  └──────────────┘  └──────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE (Supabase)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL (Managed)                            │   │
│  │                                                             │   │
│  │  Tables:                                                    │   │
│  │  ├── users (managed by Supabase Auth)                       │   │
│  │  ├── strategies                                              │   │
│  │  ├── analyses                                                │   │
│  │  ├── trades                                                  │   │
│  │  ├── watchlist                                               │   │
│  │  ├── user_preferences                                        │   │
│  │  ├── market_data_cache                                       │   │
│  │  └── audit_logs                                              │   │
│  │                                                             │   │
│  │  Features:                                                  │   │
│  │  ├── Row Level Security (RLS)                               │   │
│  │  ├── Realtime subscriptions                                  │   │
│  │  └── Storage (chart images)                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Analysis Flow
```
1. User requests analysis (Dashboard)
2. Frontend → Backend API (POST /api/v1/analysis)
3. Backend fetches market data
4. Backend calls AI provider with strategy context
5. AI returns analysis + trade levels
6. Backend saves to database
7. Backend returns result to frontend
8. Dashboard displays analysis + annotated chart
```

### Authentication Flow
```
1. User enters credentials (Dashboard)
2. Frontend → Supabase Auth (directly — it's designed for this)
3. Supabase returns JWT token
4. Frontend stores token, sends with every API request
5. Backend middleware validates JWT on every request
6. Backend uses service_role key for database operations
```

## Security Model

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Frontend | Supabase anon key | Auth only (public, safe) |
| API Gateway | Rate limiting | Prevent abuse |
| Backend Middleware | JWT validation | Verify user identity |
| Backend | service_role key | Full DB access (never exposed) |
| Database | Row Level Security | Users see only their data |
| Environment | .env files | Secrets never in code |

## Module Structure

### Backend Layers (top → bottom)

```
Routes → Controllers → Services → Repositories → Database
  │          │              │            │
  │          │              │            └── Database queries (Supabase)
  │          │              └── Business logic, AI calls
  │          └── HTTP parsing, validation, response formatting
  └── URL mapping, HTTP methods
```

**Rule:** Each layer only talks to the layer directly below it.
- Controllers never query the database directly
- Services never handle HTTP request/response objects
- Repositories only do database operations

### Frontend Layers

```
Pages → Components → Hooks → API Client → Backend
  │         │           │         │
  │         │           │         └── Axios calls to REST API
  │         │           └── Data fetching (React Query), state management
  │         └── UI rendering, user interaction
  └── URL routes, layout structure
```

## Technology Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 14 | SSR, routing, API routes, great DX |
| UI Library | shadcn/ui | Beautiful, accessible, copy-paste (no lock-in) |
| Styling | Tailwind CSS | Utility-first, fast, consistent |
| State | React Query + Zustand | Server state + client state separated |
| Backend | Express | Simple, proven, huge ecosystem |
| Database | Supabase | Managed Postgres, built-in Auth, Realtime, Storage |
| AI | Multi-provider | Vendor independence, fallback capability |
| Types | TypeScript | Catch bugs at compile time, better DX |
