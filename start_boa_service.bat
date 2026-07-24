@echo off
echo Starting BoA Editorial Agent Service...
REM Skipping redundant install to avoid network hang
REM ".venv\Scripts\python.exe" -m pip install -e nanobot > NUL 2>&1
REM Ensure critical runtime dependencies are present (fast check)
".venv\Scripts\python.exe" -m pip install fastapi uvicorn loguru pydantic litellm > NUL 2>&1
echo dependencies check complete.
REM Run Service
".venv\Scripts\python.exe" "services\boa-editorial-agent\boa_agent.py"
pause
