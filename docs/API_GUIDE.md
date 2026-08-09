# API Guide

> Last updated: Phase 5 — AI Service Layer

## Base URL

- **Development:** `http://localhost:5000/api/v1`
- **Production:** `https://your-backend-url.com/api/v1`

## Authentication

All API routes (except `/health`) require a Bearer token from Supabase Auth:

```
Authorization: Bearer <supabase-jwt-token>
```

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable description",
  "details": {}
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Endpoints (Planned)

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Server health check |
| GET | `/api/v1/health` | No | API health check |

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/auth/health` | No | Auth system health check |
| GET | `/api/v1/auth/me` | Yes | Get current user profile |
| POST | `/api/v1/auth/initialize` | Yes | Initialize new user account |

> **Note:** Login and registration are handled directly by Supabase Auth from the frontend.
> The backend only verifies tokens — it doesn't process passwords.

### Strategies
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/strategies` | Yes | List user strategies |
| POST | `/api/v1/strategies` | Yes | Create strategy |
| GET | `/api/v1/strategies/:id` | Yes | Get strategy |
| PUT | `/api/v1/strategies/:id` | Yes | Update strategy |
| DELETE | `/api/v1/strategies/:id` | Yes | Delete strategy |

### Preferences
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/preferences` | Yes | Get user preferences |
| PUT | `/api/v1/preferences` | Yes | Update preferences |

### Watchlist
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/watchlist` | Yes | Get watchlist |
| POST | `/api/v1/watchlist` | Yes | Add to watchlist |
| DELETE | `/api/v1/watchlist/:id` | Yes | Remove from watchlist |

### Analyses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/analysis` | Yes | List analyses (paginated) |
| POST | `/api/v1/analysis` | Yes | Run new AI analysis |
| GET | `/api/v1/analysis/:id` | Yes | Get analysis details |
| DELETE | `/api/v1/analysis/:id` | Yes | Delete analysis |
| GET | `/api/v1/analysis/providers` | Yes | List AI providers |

### Trades (Journal)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/trades` | Yes | List trades |
| POST | `/api/v1/trades` | Yes | Open new trade |
| PUT | `/api/v1/trades/:id` | Yes | Update trade |
| DELETE | `/api/v1/trades/:id` | Yes | Delete trade |

### Market Data
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/market/:symbol` | Yes | Get current price |
| GET | `/api/v1/market/:symbol/candles` | Yes | Get historical candles |
| POST | `/api/v1/market/batch/prices` | Yes | Batch price fetch (up to 20) |
| GET | `/api/v1/market/providers` | Yes | List available providers |
| GET | `/api/v1/market/cache/stats` | Yes | Cache statistics |

### User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/user/preferences` | Yes | Get preferences |
| PUT | `/api/v1/user/preferences` | Yes | Update preferences |
| GET | `/api/v1/user/watchlist` | Yes | Get watchlist |
| POST | `/api/v1/user/watchlist` | Yes | Add to watchlist |
| DELETE | `/api/v1/user/watchlist/:id` | Yes | Remove from watchlist |

## Rate Limits

- **Development:** 1000 requests per 15 minutes
- **Production:** 100 requests per 15 minutes
- Exceeding limit returns `429 Too Many Requests`

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
