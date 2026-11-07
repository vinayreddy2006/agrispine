import re
import json
import time
import random
import logging
from typing import List
from schemas.chat import ChatMessage
from core.config import settings
from .base import AIEngine, IntentClassification
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

class HuggingFaceEngine(AIEngine):
    """
    Hugging Face Inference Engine supporting primary and fallback chat models,
    exponential backoff, JSON extraction, and provider resilience.
    """

    def __init__(self, temperature: float = None):
        hf_token = settings.hf_token
        if not hf_token or hf_token == "YOUR_HUGGINGFACE_TOKEN_HERE":
            raise ValueError(
                "HUGGINGFACEHUB_API_TOKEN / HF_API_KEY is missing or invalid. Please set HF_API_KEY in ai/.env to enable the Hugging Face provider."
            )
            
        self.timeout = float(settings.AI_TIMEOUT)
        self.temperature = temperature if temperature is not None else float(settings.AI_TEMPERATURE)
        self.max_retries = int(settings.AI_MAX_RETRIES)
        self.client = InferenceClient(token=hf_token, timeout=self.timeout)

        # Assemble unique ordered list of models from configuration
        primary = settings.HF_MODEL or "Qwen/Qwen2.5-Coder-32B-Instruct"
        fallbacks = settings.hf_fallbacks
        
        ordered_models = [primary]
        for fb in fallbacks:
            if fb and fb not in ordered_models:
                ordered_models.append(fb)

        self.fallback_models = ordered_models
        logger.info(f"HuggingFaceEngine initialized with models: {self.fallback_models}")

    def _extract_json(self, text: str) -> dict:
        """
        Attempts to find and parse a JSON block within the LLM's text output.
        """
        if not text or not text.strip():
            raise json.JSONDecodeError("Empty output from model", "", 0)

        # Try to find a JSON block bounded by ```json ... ```
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1).strip()
            return json.loads(json_str)
            
        # If no markdown block, try to find the first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1].strip()
            return json.loads(json_str)
            
        # If all else fails, attempt to load the entire text as JSON
        return json.loads(text.strip())

    def identify_intent(
        self, 
        message: str, 
        history: List[ChatMessage], 
        user_context: dict, 
        page_context: dict,
        system_prompt: str
    ) -> IntentClassification:
        
        # Append specific instructions to the system prompt to force JSON output
        enhanced_system_prompt = system_prompt + """
        
CRITICAL INSTRUCTION FOR OUTPUT FORMAT:
You must return ONLY a raw JSON object. Do not include conversational filler, explanations, or markdown formatting. 
Your output must exactly match the following JSON schema:
{
  "intent": "string",
  "parameters": {},
  "chat_reply": "string"
}
"""
        
        # Build Messages in standard chat format
        messages = [{"role": "system", "content": enhanced_system_prompt}]
        for h in history:
            messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": message})
        
        last_error = ""
        
        # Loop through fallback models
        for model_id in self.fallback_models:
            logger.info(f"[HuggingFaceEngine] Attempting model: {model_id}")
            current_messages = list(messages)

            for attempt in range(self.max_retries + 1):
                try:
                    # Invoke LLM Native Chat Completion
                    response = self.client.chat_completion(
                        model=model_id,
                        messages=current_messages,
                        temperature=self.temperature
                    )
                    raw_text = response.choices[0].message.content or ""
                    
                    # Extract and parse JSON
                    parsed_json = self._extract_json(raw_text)
                    
                    # Validate with Pydantic
                    classification = IntentClassification.model_validate(parsed_json)
                    logger.info(f"[HuggingFaceEngine] Intent identified successfully via {model_id}: {classification.intent}")
                    return classification
                    
                except json.JSONDecodeError as e:
                    last_error = f"Invalid JSON format. {str(e)}"
                    logger.warning(f"[HuggingFaceEngine] {last_error} on {model_id} (attempt {attempt+1})")
                    if attempt < self.max_retries:
                        current_messages.append({"role": "assistant", "content": raw_text if 'raw_text' in locals() else "{}"})
                        current_messages.append({
                            "role": "user",
                            "content": f"Your last response caused an error: {last_error}. Please output ONLY a valid JSON object matching the exact schema requested without any extra text or markdown formatting."
                        })
                        time.sleep(0.5)
                        continue
                    break

                except Exception as e:
                    error_str = str(e)
                    # If model is not supported, 400 Client Error, 402 Payment Required or not a chat model, immediately break to next model
                    if any(phrase in error_str.lower() for phrase in [
                        "not supported", "not a chat model", "400 client error", "402 payment required", "model_not_supported"
                    ]):
                        logger.warning(f"[HuggingFaceEngine] Model {model_id} unsupported or unavailable: {error_str}. Falling back to next model...")
                        last_error = f"Model {model_id} unsupported: {error_str}"
                        break
                    
                    if "429" in error_str or "rate limit" in error_str.lower():
                        delay = (1.5 ** attempt) + random.uniform(0.5, 1.5)
                        logger.warning(f"[HuggingFaceEngine] Rate limit (429) hit on {model_id}. Backing off for {delay:.2f}s...")
                        if attempt < self.max_retries:
                            time.sleep(delay)
                            continue
                        break

                    last_error = f"Schema validation/invocation failed: {error_str}"
                    logger.warning(f"[HuggingFaceEngine] Error on {model_id} attempt {attempt+1}: {error_str}")
                    if attempt < self.max_retries:
                        time.sleep(1.0)
                        continue
                    break
            
        # If ALL models and ALL retries fail, raise error
        raise RuntimeError(f"HuggingFace engine exhausted all fallback models ({self.fallback_models}) and retries. Last error: {last_error}")
