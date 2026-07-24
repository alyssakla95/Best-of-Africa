import json
from typing import Dict, Any, Callable, Awaitable

async def reflect_on_audit(audit_result: Dict[str, Any], llm_func: Callable[[str], Awaitable[str]]) -> Dict[str, Any]:
    """
    Performs a live self-critique of the audit result using the Agent's LLM.
    """
    article_country = audit_result.get("country", "Unknown")
    article_topic = audit_result.get("topic", "Unknown")
    audit_report = json.dumps(audit_result.get("audit_report", {}), indent=2)
    variants = json.dumps(audit_result.get("variants", {}), indent=2)

    prompt = (
        f"You are a senior editor reviewing the work of an AI auditor.\n"
        f"Context: Article on {article_topic} in {article_country}.\n\n"
        f"Values: Best of Africa (Guardian-style, Premium, Pan-African).\n\n"
        f"The AI Auditor produced this Report:\n{audit_report}\n\n"
        f"And these Variants:\n{variants}\n\n"
        f"Please critique this work. Did it miss obvious bias? Is the tone correct? Are the facts checked?\n"
        f"Return your critique as a JSON object with keys: 'quality_score' (0.0-1.0), 'missed_issues' (list[str]), 'hallucination_check' (str), 'notes' (str)."
    )

    try:
        response_text = await llm_func(prompt)
        
        # simple cleanup for markdown code blocks if present
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        critique = json.loads(cleaned_text)
        
        # Ensure article_id is preserved
        critique["article_id"] = audit_result.get("article_id")
        return critique
    except Exception as e:
        return {
            "error": f"Reflection failed: {str(e)}",
            "raw_response": locals().get("response_text", "")
        }
