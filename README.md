# Support Ticket System

Full-stack ticketing system built for the Tech Intern Assessment.

## What This Project Includes
- Django + DRF backend for tickets API
- React (Vite) frontend for form, list, filters, and dashboard
- PostgreSQL for containerized runtime
- Gemini-based ticket classification (`/api/tickets/classify/`)
- Docker + Docker Compose setup

## Architecture
- `frontend` sends requests to backend API
- `backend` handles validation, DB operations, aggregations, and LLM classification
- `db` stores tickets in PostgreSQL (Docker mode)

Request path:
1. `config/urls.py` mounts `tickets/urls.py`
2. `tickets/views.py` handles endpoint logic
3. `tickets/serializers.py` validates payloads
4. `tickets/models.py` persists through Django ORM

## Core Features
- Ticket create/list/update
- Combined filtering and search (`category`, `priority`, `status`, `search`)
- Stats endpoint with database-side aggregations
- LLM suggestion flow with graceful fallback when LLM fails
- Frontend form prefill from classify endpoint with user override

## Data Model (`Ticket`)
- `title`: required, max length 200
- `description`: required
- `category`: `billing | technical | account | general`
- `priority`: `low | medium | high | critical`
- `status`: `open | in_progress | resolved | closed`, default `open`
- `created_at`: auto timestamp

DB constraints enforce:
- non-empty `title`, `description`
- valid enum values for `category`, `priority`, `status`

## API
- `POST /api/tickets/`
- `GET /api/tickets/?category=&priority=&status=&search=`
- `PATCH /api/tickets/<id>/`
- `GET /api/tickets/stats/`
- `POST /api/tickets/classify/`

Example classify request:
```json
{
  "description": "Checkout is down for all users in production."
}
```

Example classify response:
```json
{
  "suggested_category": "technical",
  "suggested_priority": "critical",
  "used_fallback": false
}
```

## LLM Integration
- File: `backend/tickets/llm.py`
- Env vars:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL` (recommended: `gemini-2.5-flash`)
- Fallback behavior:
  - category -> `general`
  - priority -> `medium`
  - `used_fallback` -> `true`

## Run Locally (No Docker)

Backend (SQLite quick mode, PowerShell):
```powershell
cd backend
$env:USE_SQLITE="1"
$env:GEMINI_API_KEY="YOUR_KEY"
$env:GEMINI_MODEL="gemini-2.5-flash"
& ..\.venv\Scripts\python.exe manage.py migrate
& ..\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Frontend:
```powershell
cd frontend
npm install
npm run dev
```

URLs:
- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`

## Run With Docker
1. Copy env file:
```bash
cp .env.example .env
```
2. Set at least:
```env
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-2.5-flash
```
3. Start:
```bash
docker compose up --build
```

## Docker Hub Images
- `piyushm1501/clootrack-backend:latest`
- `piyushm1501/clootrack-frontend:latest`

## Domain Deployment (`clootrack.piyushmishra.site`)

Production URL:
- [clootrack.piyushmishra.site](https://clootrack.piyushmishra.site)