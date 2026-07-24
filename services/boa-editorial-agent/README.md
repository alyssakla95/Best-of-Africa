# BoA Editorial Auditor Agent

A Nanobot-powered agent that audits content, generates audience variants, and improves itself over time.

## Architecture

- **Runtime**: Nanobot (Gateway/Server Mode)
- **Service**: FastAPI wrapper (`boa_agent.py`)
- **Skills**: OpenSkills-compatible local skills in `.agent/skills/`
- **Storage**: SQLite (`boa_content.db`)

## Features

1. **Editorial Audit**: Checks for accuracy, bias, toxicity, and brand alignment.
2. **Variant Generation**: Creates Tourist, Investor, and Policy versions.
3. **Proactive Scanning**: Background loop finds `pending` work in the DB.
4. **Self-Improvement**: Critiques its own work and learns from human feedback.

## Setup

1. **Install Nanobot**:

    ```bash
    pip install nanobot-ai
    ```

2. **Install Dependencies**:

    ```bash
    pip install fastapi uvicorn aiohttp
    ```

3. **Config**:
    Ensure `config.json` has your LLM provider details (default: Anthropic).
    Set `ANTHROPIC_API_KEY` in your environment.

## Running

Start the agent service:

```bash
python services/boa-editorial-agent/boa_agent.py
```

The service runs on `http://localhost:8000`.

## API Usage

### 1. Submit an Audit

```bash
curl -X POST "http://localhost:8000/boa/audit" \
     -H "Content-Type: application/json" \
     -d '{
           "article_id": "123",
           "country": "Kenya",
           "topic": "Tourism",
           "raw_content": "Kenya is a great place..."
         }'
```

### 2. Submit Feedback

```bash
curl -X POST "http://localhost:8000/boa/feedback" \
     -H "Content-Type: application/json" \
     -d '{
           "article_id": "123",
           "correction_type": "tone",
           "human_correction": "Make it more professional",
           "notes": "Too casual for policy audience"
         }'
```

## Self-Improvement

- **Reflection**: Runs automatically after each audit (logged to console).
- **Learning**: Every 2 minutes, the agent processes queued feedback and updates `instructions/learned.md`.

## Directory Structure

- `services/boa-editorial-agent/`: Main service code.
- `.agent/skills/`: OpenSkills logic (Proactive, Self-Improving).
