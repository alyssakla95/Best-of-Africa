from typing import List, Dict, Callable, Awaitable

async def evolve_instructions(feedbacks: List[Dict], reflections: List[Dict], llm_func: Callable[[str], Awaitable[str]]) -> str:
    """
    Synthesizes newly learned rules from feedback and reflections using the LLM.
    Returns a markdown string of new rules (or empty string if nothing to learn).
    """
    if not feedbacks and not reflections:
        return ""

    feedback_text = "\n".join([f"- Feedback: {f.get('notes')} (Correction: {f.get('human_correction')})" for f in feedbacks])
    reflection_text = "\n".join([f"- Reflection: {r.get('notes')} (Score: {r.get('quality_score')})" for r in reflections])

    prompt = (
        f"You are the System Instruction Optimizer for the BoA Agent.\n"
        f"We have received the following Feedbacks and Reflections on recent performance:\n\n"
        f"## Human Editor Feedback\n{feedback_text}\n\n"
        f"## Self-Reflections\n{reflection_text}\n\n"
        f"Based on this data, identify 1-3 specific, actionable rules to improve future performance.\n"
        f"Focus on Editorial Tone, Bias Detection, or Formatting.\n"
        f"Output ONLY the new rules as a Markdown list. Do not include preamble.\n"
        f"Example:\n- [Learned] Avoid using the word 'infrastructure' when 'projects' is more precise.\n- [Learned] Ensure Kenya tourism variants mention safety protocols."
    )

    try:
        new_rules = await llm_func(prompt)
        return new_rules.strip()
    except Exception as e:
        return f"<!-- Error evolving instructions: {str(e)} -->"
