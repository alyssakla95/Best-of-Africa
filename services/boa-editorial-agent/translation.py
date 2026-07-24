import sys
from pathlib import Path

# Add nanobot to path
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
nanobot_path = project_root / "nanobot"
if str(nanobot_path) not in sys.path:
    sys.path.append(str(nanobot_path))

from nanobot.providers.litellm_provider import LiteLLMProvider

class TranslationService:
    """
    Dedicated service for translating content using Kimi K2.5 (Moonshot).
    Enforces strict rules to preserve facts, numbers, and tone.
    """

    def __init__(self):
        api_key = os.environ.get("MOONSHOT_API_KEY")
        if not api_key:
            logger.warning("MOONSHOT_API_KEY is missing. Translations will fail.")
        
        # Use Kimi (Moonshot) exclusively for translation
        # model="moonshot-v1-8k" or similar stable identifier
        self.provider = LiteLLMProvider(
            api_key=api_key,
            default_model="moonshot-v1-8k",
            api_base="https://api.moonshot.cn/v1" 
        )

    async def translate_text(self, text: str, source_lang: str, target_lang: str, context_type: str = "general") -> Optional[str]:
        """
        Translates text from source to target language.
        
        Args:
            text: Content to translate
            source_lang: e.g., 'en'
            target_lang: e.g., 'fr', 'ar', 'zh'
            context_type: 'editorial', 'legal', or 'general' to tune strictness.
        """
        if not text:
            return None
            
        if source_lang == target_lang:
            return text

        # Tone/Context adjustment
        context_instruction = ""
        if context_type == "editorial":
            context_instruction = "Maintain the journalistic tone. Keep it engaging but professional."
        elif context_type == "legal":
            context_instruction = "Preserve all disclaimers, risk warnings, and legal terminology EXACTLY."

        # Strict Prompt Contract
        system_prompt = (
            f"You are a professional translator for a high-end business intelligence platform. "
            f"Translate the following text from {source_lang} to {target_lang}. \n\n"
            f"STRICT RULES:\n"
            f"1. Preserve all facts, numbers, dates, proper nouns, and currency figures exactly. Do NOT rounds numbers.\n"
            f"2. {context_instruction}\n"
            f"3. Adjust idioms and phrasing for natural reading in {target_lang}, but do not change the meaning.\n"
            f"4. Do NOT add new claims or remove existing ones.\n"
            f"5. If provided with Markdown formatting, preserve it exactly.\n"
            f"6. Output ONLY the translated text, no preamble or explanation."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]

        try:
            response = await self.provider.chat(messages=messages)
            return response.content.strip()
        except Exception as e:
            logger.error(f"Translation failed ({source_lang}->{target_lang}): {e}")
            return None

# Singleton instance
translator = TranslationService()
