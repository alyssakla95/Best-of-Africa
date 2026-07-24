# BoA Video Narrator Agent

A standalone microservice that generates cinematic AI videos for Best of Africa articles using the Seedance API.

## Architecture

- **Service**: Node.js + TypeScript
- **Database**: Hybrid SQLite (Dev) / Postgres (Prod)
- **Queue**: Polling-based worker loop
- **API**: Express server (Internal only)

## Setup

1. **Install Dependencies**

    ```bash
    cd services/boa-video-agent
    npm install
    ```

2. **Configuration**
    Create a `.env` file in `services/boa-video-agent/`:

    ```env
    # Seedance API
    SEEDANCE_API_KEY=your_key_here
    SEEDANCE_API_BASE_URL=https://api.seedance.app

    # BoA Content API
    BOA_API_URL=http://localhost:8787/api
    BOA_API_KEY=your_admin_key
    BOA_INTERNAL_SECRET=my_secret_token

    # Worker Config
    VIDEO_MAX_REQUESTS_PER_HOUR=8
    VIDEO_STATUS_POLL_INTERVAL_SECONDS=30
    MAX_ATTEMPTS=2
    
    # Database (Optional for Dev, defaults to SQLite)
    # DATABASE_URL=postgresql://user:pass@host:5432/db
    ```

## Usage

### 1. Start the API Server

Runs on port 3001 by default.

```bash
npm run dev
# OR
npm start
```

### 2. Start the Worker

Runs the background queue processor.

```bash
npm run worker
```

### 3. API Endpoints

#### `POST /api/videos/article/:id/generate`

Enqueue a video generation job.

- **Headers**: `Authorization: my_secret_token`
- **Body**: `{ "priority": "normal" }` (optional)

#### `GET /api/videos/article/:id`

Check status of a video.

- **Response**: `{ "status": "ready", "video_url": "..." }`

## Development

- **Mock Mode**: If `SEEDANCE_API_KEY` is missing, the agent runs in simulation mode (generates fake IDs and URLs).
- **Database**: Uses `video_agent.db` (SQLite) in the root directory by default.
