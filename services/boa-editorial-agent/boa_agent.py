import asyncio
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks, HTTPException
from loguru import logger
from pydantic import BaseModel

# Ensure nanobot is in python path if running from root
import sys
from pathlib import Path

# Add the 'nanobot' directory (where the inner 'nanobot' package lives) to sys.path
nanobot_root = Path(__file__).parent.parent.parent / "nanobot"
sys.path.append(str(nanobot_root))

from nanobot.config.loader import load_config
from nanobot.bus.queue import MessageBus
from nanobot.agent.loop import AgentLoop
from nanobot.session.manager import SessionManager
from nanobot.cli.commands import _make_provider
from nanobot.providers.litellm_provider import LiteLLMProvider
from nanobot.providers.base import LLMProvider, LLMResponse

class FallbackProvider(LLMProvider):
    """
    Wraps two providers: primary and fallback.
    Tries primary first; if it fails, tries fallback.
    """
    def __init__(self, primary: LiteLLMProvider, fallback: LiteLLMProvider):
        self.primary = primary
        self.fallback = fallback

    async def chat(self, messages, model=None, **kwargs) -> LLMResponse:
        try:
            # Try primary
            return await self.primary.chat(messages, model=self.primary.default_model, **kwargs)
        except Exception as e:
            logger.warning(f"Primary provider failed: {e}. Switching to fallback...")
            try:
                # Try fallback
                return await self.fallback.chat(messages, model=self.fallback.default_model, **kwargs)
            except Exception as e2:
                logger.error(f"Fallback provider also failed: {e2}")
                raise e2

    def get_default_model(self) -> str:
        return self.primary.get_default_model()

    async def stream(self, messages, model=None, **kwargs):
        # We don't use streaming in this agent yet, but valid implementation:
        try:
            async for chunk in self.primary.stream(messages, model=self.primary.default_model, **kwargs):
                yield chunk
        except Exception:
            async for chunk in self.fallback.stream(messages, model=self.fallback.default_model, **kwargs):
                yield chunk


# Import our custom skills
try:
    from services.boa_editorial_agent.boa_skills import StoreAuditResultTool, EnqueueAuditTool, ReflectTool, EvolveInstructionsTool, UpdateMarketMetricsTool
except ImportError:
    # Handle if running from services/boa-editorial-agent directly
    sys.path.append(str(Path(__file__).parent))
    from boa_skills import StoreAuditResultTool, EnqueueAuditTool, ReflectTool, EvolveInstructionsTool, UpdateMarketMetricsTool


# Import OpenSkills logic (Proactive Scanner)
# We assume .agent is at project root
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(str(PROJECT_ROOT / ".agent" / "skills" / "proactive-editorial"))
try:
    from scanner import scan_for_pending_audits
except ImportError:
    # Fallback or mock if path issue
    scan_for_pending_audits = lambda db, limit: []



# --- Data Models ---
class ArticleAuditRequest(BaseModel):
    article_id: str
    country: str
    topic: str
    raw_content: str
    priority: str = "medium"

class FeedbackRequest(BaseModel):
    article_id: str
    correction_type: str
    human_correction: str
    notes: str


# --- Globals ---
agent = None
bus = None
AUDIT_LOG_PATH = Path(__file__).parent / "audit_log.jsonl"

@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent, bus
    
    # Initialize Nanobot components
    config_path = Path(__file__).parent / "config.json"
    if not config_path.exists():
        logger.warning(f"Config not found at {config_path}, using defaults")
    
    
    config = load_config(config_path)
    # Set workspace relative to this file (must set the source field, not the property)
    config.agents.defaults.workspace = str(Path(__file__).parent.resolve())
    
    bus = MessageBus()
    # --- Provider Setup (Gemini + Kimi Fallback) ---
    import os
    
    # 1. Primary: Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        logger.warning("GEMINI_API_KEY not found in env. Primary provider likely to fail.")
        
    gemini_provider = LiteLLMProvider(
        api_key=gemini_key,
        default_model="gemini/gemini-1.5-pro-latest"
    )

    # 2. Fallback: Kimi (Moonshot)
    moonshot_key = os.environ.get("MOONSHOT_API_KEY")
    # LiteLLM compatible model for Kimi is typically 'moonshot/moonshot-v1-8k'
    # User asked for "kimi k2.5". We'll try to map it or use a standard one.
    # If the user has a specific model string they can set it, but we'll default to v1-8k or auto.
    kimi_provider = LiteLLMProvider(
        api_key=moonshot_key,
        default_model="moonshot/moonshot-v1-8k", 
        api_base="https://api.moonshot.cn/v1" # Explicit base for Kimi if needed, though LiteLLM handles it.
    )

    # 3. Combined Fallback Provider
    provider = FallbackProvider(primary=gemini_provider, fallback=kimi_provider)
    
    session_manager = SessionManager(config.workspace_path)
    
    # Verify provider key presence
    # (In production, we'd handle this more gracefully)
    
    agent = AgentLoop(
        bus=bus,
        provider=provider,
        workspace=config.workspace_path,
        model="gemini/gemini-1.5-pro-latest", # Default for agent loop, internally overridden by provider wrapper
        restrict_to_workspace=True,
    )

    # --- LLM Injection Callback ---
    # We create a simple async function that the tools can use to call the Agent's provider.
    # AgentLoop doesn't expose a raw "generate" easily, but we can access the provider directly.
    
    async def llm_generate(prompt: str) -> str:
        # Wrap the prompt in a user message
        messages = [{"role": "user", "content": prompt}] # LiteLLMProvider expects dicts, not Message objects usually, or depends on implementation.
        # Checking LiteLLMProvider.chat signature: it accepts list[dict].
        
        # Use simple generation (no tools)
        response = await provider.chat(messages=messages)
        return response.content
        
    # Register BoA Skills
    # Use Postgres-aware tool
    agent.tools.register(StoreAuditResultTool(db_path="")) # path ignored for Postgres logic
    agent.tools.register(EnqueueAuditTool())
    # PASS THE LIVE LLM FUNCTION
    agent.tools.register(ReflectTool(llm_func=llm_generate))
    agent.tools.register(EvolveInstructionsTool(llm_func=llm_generate))
    agent.tools.register(UpdateMarketMetricsTool())

    logger.info("BoA Agent initialized with StoreAuditResultTool, EnqueueAuditTool, UpdateMarketMetricsTool, ReflectTool (LIVE LLM)")
    
    # Start Agent Loop in background
    agent_task = asyncio.create_task(agent.run())

    # Start Proactive Loop
    proactive_task = asyncio.create_task(proactive_loop(db_path=""))
    
    # Start Self-Improvement Loop (simulated via cron-like task)
    learning_task = asyncio.create_task(learning_loop())

    yield
    
    # Cleanup
    agent.stop()
    await agent_task
    proactive_task.cancel()
    learning_task.cancel()


async def proactive_loop(db_path: str):
    """
    Background loop that scans for pending work and triggers the agent.
    """
    logger.info("Starting Proactive Loop...")
    while True:
        try:
            # 1. Scan for work
            # In a real app we'd query the actual content DB.
            # Here we query our simulated source.
            items = await asyncio.to_thread(scan_for_pending_audits, db_path)
            
            for item in items:
                logger.info(f"Proactive: Found pending article {item['article_id']}")
                
                # 2. Trigger the Agent
                # We can call `process_direct` to simulate the "EnqueueAudit" -> "Audit" flow.
                # Or just directly ask the agent to audit.
                #
                # "Proactive... calls enqueue_audit."
                #
                # If we act as the "System", we can say:
                # "System: Pending Article {id} found. Please audit it."
                instruction = (
                    f"Pending Article Found via Proactive Scan.\n"
                    f"ID: {item['article_id']}\n"
                    f"Country: {item['country']}\n"
                    f"Topic: {item['topic']}\n\n"
                    f"Article Content:\n{item['raw_content']}\n"
                    f"Please audit this now."
                )
                
                # We use a special session key to trace this
                session_id = f"audit:{item['article_id']}"
                
                # Fire and forget (or await if we want serial processing)
                if agent:
                    await agent.process_direct(instruction, session_key=session_id)
                    
                    # Track audit cycle
                    import json as _json
                    from datetime import datetime as _dt
                    log_entry = {"article_id": item['article_id'], "source": "proactive", "timestamp": _dt.now().isoformat(), "country": item.get('country', ''), "topic": item.get('topic', '')}
                    with open(AUDIT_LOG_PATH, "a") as _f:
                        _f.write(_json.dumps(log_entry) + "\n")
            
            await asyncio.sleep(10) # Scan every 10 seconds for demo
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Proactive loop error: {e}")
            await asyncio.sleep(60)


app = FastAPI(lifespan=lifespan)

@app.post("/boa/audit")
async def trigger_audit(request: ArticleAuditRequest, background_tasks: BackgroundTasks):
    """
    Submits an article for audit.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    # Construct the instruction
    instruction = (
        f"Perform an editorial audit for the following article.\n"
        f"ID: {request.article_id}\n"
        f"Country: {request.country}\n"
        f"Topic: {request.topic}\n\n"
        f"Article Content:\n{request.raw_content}\n"
    )

    # We use `process_direct` for simplicity in Phase 1 (Sync-ish)
    # Ideally, for high load, we'd queue this.
    # To keep response fast, we can run it in background if the caller doesn't need immediate result.
    # But for Phase 1 "Simple, manual trigger", let's wait and return the decision.
    
    try:
        # Using a unique session ID per article prevents context pollution
        session_id = f"audit:{request.article_id}"
        response = await agent.process_direct(instruction, session_key=session_id)
        
        # Trigger Reflection (Fire & Forget or Background)
        background_tasks.add_task(trigger_reflection, request.article_id)
        
        # Track audit cycle
        import json as _json
        from datetime import datetime as _dt
        log_entry = {"article_id": request.article_id, "source": "manual", "timestamp": _dt.now().isoformat(), "country": request.country, "topic": request.topic}
        with open(AUDIT_LOG_PATH, "a") as _f:
            _f.write(_json.dumps(log_entry) + "\n")
        
        return {"status": "success", "agent_response": response}
    except Exception as e:
        logger.error(f"Audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/boa/metrics/country/{country_code}")
async def get_country_metrics(country_code: str):
    """
    Returns metrics for a country.
    """
    # 1. Query Postgres for audit stats
    audit_count = 0
    
    try:
        import asyncpg
        conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
        # Count audits from Postgres
        audit_count = await conn.fetchval("SELECT COUNT(*) FROM article_audits")
        await conn.close()
    except Exception as e:
        logger.error(f"DB Error getting metrics: {e}")

    # 2. Real Metrics (No Mocks)
    # If we don't have real analytics data yet, return 0/None rather than fake values.
    
    return {
        "countryCode": country_code,
        "pageViews": 0, 
        "bounceRate": 0,
        "avgTimeOnPage": 0,
        "lastAuditDate": None, 
        "campaignActive": False,
        "totalAudits": audit_count,
        "dataSource": "postgres" 
    }

class StewardStatus(BaseModel):
    status: str
    tier: str
    credits: float
    usdc: float
    message: str

@app.post("/boa/steward-status/{country_code}")
async def post_steward_status(country_code: str, status: StewardStatus):
    """
    Receives heartbeat/status from the country steward.
    """
    logger.info(f"Steward {country_code} Update: [{status.status}] Tier={status.tier} Budget=${status.credits}")
    return {"status": "received"}


@app.post("/boa/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submits feedback for an article to improve the agent.
    """
    # In a real system, we'd store this in a DB.
    # For now, we'll append to a simple list or file to be picked up by the Learning Loop.
    feedback = request.dict()
    
    # Store in a temporary feedback queue (simulated)
    # Ideally, we should use `StoreAuditResultTool` (db) but let's use a global list for simplicity
    GLOBAL_FEEDBACK_QUEUE.append(feedback)
    
    return {"status": "received", "message": "Feedback queued for learning."}

GLOBAL_FEEDBACK_QUEUE = []

async def trigger_reflection(article_id: str):
    """
    Called after audit to make the agent reflect.
    """
    # 1. Fetch result from DB (mock fetch or real DB query)
    # In a real app we'd query the DB.
    # For now, we'll create a dummy result to demonstrate the flow if DB is empty
    # or just assume the tool will handle it if we pass ID?
    # The ReflectTool expects `audit_result` dict.
    
    # Let's verify if we can fetch from the DB using a helper or just mock it for the demo.
    import sqlite3
    db_path = str(Path(__file__).parent / "boa_content.db")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT audit_report, variants FROM article_audits WHERE article_id=?", (article_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            import json
            audit_result = {
                "article_id": article_id,
                "audit_report": json.loads(row[0]),
                # "variants": json.loads(row[1]) # Reflection might not need variants?
            }
            
            # 2. Call ReflectTool
            tool = ReflectTool(llm_func=agent.tools.get("reflect_on_audit").llm_func) # Access the function from the registered tool if possible OR reuse the one in scope if available.
            # wait, `agent.tools.get` returns the tool instance.
            # But here `agent` is global.
            registered_tool = agent.tools.get("reflect_on_audit")
            if registered_tool:
                critique = await registered_tool.execute(audit_result=audit_result)
                logger.info(f"Reflection for {article_id}: {critique}")
            else:
                logger.error("ReflectTool not found.")
            
            # Optionally store critique in DB
            
        else:
            logger.warning(f"Reflection failed: Article {article_id} not found in DB.")
            
    except Exception as e:
        logger.error(f"Reflection error: {e}")

async def learning_loop():
    """
    Periodically processes feedback to evolve instructions.
    """
    logger.info("Starting Learning Loop...")
    while True:
        try:
            await asyncio.sleep(10) # Every 10 seconds for demo
            
            if GLOBAL_FEEDBACK_QUEUE:
                logger.info(f"Learning: Processing {len(GLOBAL_FEEDBACK_QUEUE)} feedback items...")
                
                # Copy and clear queue
                batch = list(GLOBAL_FEEDBACK_QUEUE)
                GLOBAL_FEEDBACK_QUEUE.clear()
                
                # Verify agent is ready
                if agent:
                     registered_tool = agent.tools.get("evolve_instructions")
                     if registered_tool:
                         result = await registered_tool.execute(feedbacks=batch)
                         logger.info(f"Learning Result: {result}")
                     else:
                        logger.error("EvolveInstructionsTool not found.")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Learning loop error: {e}")
            await asyncio.sleep(60)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
