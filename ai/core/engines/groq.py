import re
import json
import time
import random
import logging
import httpx
from typing import List
from schemas.chat import ChatMessage
from core.config import settings
from .base import AIEngine, IntentClassification
from groq import (
    Groq,
    RateLimitError,
    APIError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    APIStatusError
)

logger = logging.getLogger(__name__)

class GroqEngine(AIEngine):
    """
    Dedicated AI Engine utilizing Groq's low-latency inference infrastructure.
    Supports primary model execution with automatic graceful fallback, exponential
    backoff, rate-limit (HTTP 429) mitigation, and structured JSON output.
    """

    def __init__(self, temperature: float = None):
        api_key = settings.GROQ_API_KEY
        if not api_key or api_key == "YOUR_GROQ_API_KEY_HERE":
            raise ValueError(
                "GROQ_API_KEY is missing or invalid. Please add your Groq API key to ai/.env to enable the Groq provider."
            )

        # Sanitize base_url so /openai/v1 is never duplicated by the Groq SDK
        raw_base_url = settings.GROQ_BASE_URL
        if raw_base_url:
            clean_base_url = raw_base_url.strip().rstrip("/")
            if clean_base_url.endswith("/openai/v1"):
                clean_base_url = clean_base_url[:-len("/openai/v1")].rstrip("/")
        else:
            clean_base_url = "https://api.groq.com"

        self.timeout = float(settings.AI_TIMEOUT)
        self.temperature = temperature if temperature is not None else float(settings.AI_TEMPERATURE)
        self.max_retries = int(settings.AI_MAX_RETRIES)

        # Pass custom httpx client to bypass httpx >=0.28 'proxies' incompatibility in older groq SDK
        http_client = httpx.Client(timeout=self.timeout)

        self.client = Groq(
            api_key=api_key,
            base_url=clean_base_url,
            timeout=self.timeout,
            http_client=http_client
        )

        # Assemble unique ordered list of models (Primary followed by Fallbacks)
        primary = settings.GROQ_MODEL or "qwen/qwen3.8-27b"
        fallbacks = settings.groq_fallbacks
        
        ordered_models = [primary]
        for fb in fallbacks:
            if fb and fb not in ordered_models:
                ordered_models.append(fb)
                
        self.models = ordered_models
        logger.info(f"[GroqEngine] Initialized with endpoint {clean_base_url}/openai/v1/chat/completions, models: {self.models} (timeout={self.timeout}s, temp={self.temperature})")

    def _extract_json(self, text: str) -> dict:
        """
        Extracts and parses JSON object from LLM output, handling markdown blocks or inline JSON.
        """
        if not text or not text.strip():
            raise json.JSONDecodeError("Empty output from model", "", 0)

        # Try to find a JSON block bounded by ```json ... ```
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1).strip()
            return json.loads(json_str)

        # Try finding the first '{' and matching last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1].strip()
            return json.loads(json_str)

        return json.loads(text.strip())

    def identify_intent(
        self,
        message: str,
        history: List[ChatMessage],
        user_context: dict,
        page_context: dict,
        system_prompt: str
    ) -> IntentClassification:
        """
        Executes intent classification using Groq's high-speed LLM inference.
        """
        enhanced_system_prompt = system_prompt + """

CRITICAL INSTRUCTION FOR OUTPUT FORMAT:
You must return ONLY a raw JSON object with no preamble, conversational wrapper, or markdown tags outside the JSON.
Your output must strictly match this JSON schema:
{
  "intent": "string",
  "parameters": {},
  "chat_reply": "string"
}
"""

        # Build chat messages
        messages = [{"role": "system", "content": enhanced_system_prompt}]
        for h in history:
            messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": message})

        last_error = ""

        for model_id in self.models:
            logger.info(f"[GroqEngine] Attempting model: {model_id}")
            current_messages = list(messages)

            for attempt in range(self.max_retries + 1):
                try:
                    kwargs = {
                        "model": model_id,
                        "messages": current_messages,
                        "temperature": self.temperature,
                        "response_format": {"type": "json_object"}
                    }

                    response = self.client.chat.completions.create(**kwargs)
                    raw_text = response.choices[0].message.content or ""

                    # Extract and parse JSON
                    parsed_json = self._extract_json(raw_text)

                    # Validate with Pydantic model
                    classification = IntentClassification.model_validate(parsed_json)
                    logger.info(f"[GroqEngine] Intent identified successfully via {model_id}: {classification.intent}")
                    return classification

                except AuthenticationError as e:
                    # Auth error is permanent, retrying won't help
                    logger.error(f"[GroqEngine] Authentication failure with Groq API: {e}")
                    raise RuntimeError(f"Groq API authentication failed. Please verify GROQ_API_KEY in ai/.env: {e}")

                except NotFoundError as e:
                    err_msg = str(e)
                    # Check if it is a 404 on the API URL path vs model not found
                    if "unknown request url" in err_msg.lower():
                        logger.critical(f"[GroqEngine] Fatal endpoint URL error (404): {err_msg}")
                        raise RuntimeError(f"Groq endpoint URL error: {err_msg}")
                    # Model not found or no access - do NOT retry the same model
                    logger.warning(f"[GroqEngine] Model '{model_id}' does not exist or account lacks access (404): {err_msg}. Switching to next model...")
                    last_error = f"Model {model_id} not found (404): {err_msg}"
                    break

                except BadRequestError as e:
                    err_msg = str(e)
                    # If model was decommissioned or rejected, switch to next fallback immediately
                    logger.warning(f"[GroqEngine] Bad request on model '{model_id}' (400): {err_msg}. Switching to next model...")
                    last_error = f"Model {model_id} rejected (400): {err_msg}"
                    break

                except RateLimitError as e:
                    # Handle HTTP 429 with Retry-After header or exponential backoff & jitter
                    retry_after_val = None
                    if hasattr(e, "response") and e.response is not None:
                        ra = e.response.headers.get("retry-after")
                        if ra:
                            try:
                                retry_after_val = float(ra)
                            except (ValueError, TypeError):
                                pass
                    if retry_after_val is None:
                        retry_after_val = getattr(e, "retry_after", None)

                    if retry_after_val and retry_after_val > 10.0:
                        logger.warning(f"[GroqEngine] Rate limit Retry-After ({retry_after_val:.1f}s) too long on {model_id}. Switching immediately to fallback model...")
                        last_error = f"Rate limit Retry-After ({retry_after_val}s) on {model_id}"
                        break

                    delay = retry_after_val if retry_after_val else (1.5 ** attempt) + random.uniform(0.5, 1.5)
                    logger.warning(f"[GroqEngine] Rate limit hit on {model_id}. Backing off for {delay:.2f}s (attempt {attempt+1}/{self.max_retries+1})")
                    if attempt < self.max_retries:
                        time.sleep(delay)
                        continue
                    else:
                        last_error = f"Rate limit exhausted on {model_id}: {e}"
                        break

                except APITimeoutError as e:
                    logger.warning(f"[GroqEngine] Timeout ({self.timeout}s) on {model_id} attempt {attempt+1}: {e}")
                    last_error = f"Timeout on {model_id}: {e}"
                    if attempt < self.max_retries:
                        time.sleep(1.0 + random.uniform(0.2, 0.8))
                        continue
                    break

                except (json.JSONDecodeError, ValueError) as e:
                    last_error = f"Invalid JSON format from {model_id}: {e}"
                    logger.warning(f"[GroqEngine] {last_error} on attempt {attempt+1}")
                    if attempt < self.max_retries:
                        current_messages.append({"role": "assistant", "content": raw_text if 'raw_text' in locals() else "{}"})
                        current_messages.append({
                            "role": "user",
                            "content": f"Your response did not match valid JSON: {str(e)}. Please output ONLY the exact JSON object schema: {{\"intent\": \"string\", \"parameters\": {{}}, \"chat_reply\": \"string\"}}."
                        })
                        time.sleep(0.5)
                        continue
                    break

                except Exception as e:
                    last_error = f"Unexpected error on {model_id}: {e}"
                    logger.warning(f"[GroqEngine] {last_error}")
                    if attempt < self.max_retries:
                        time.sleep(1.0)
                        continue
                    break

        raise RuntimeError(f"Groq engine exhausted all configured models ({self.models}) and retries. Last error: {last_error}")
