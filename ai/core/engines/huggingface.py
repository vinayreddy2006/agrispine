import re
import json
import logging
from typing import List
from schemas.chat import ChatMessage
from core.config import settings
from .base import AIEngine, IntentClassification
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

class HuggingFaceEngine(AIEngine):
    def __init__(self, temperature: float = 0.1):
        hf_token = settings.HUGGINGFACEHUB_API_TOKEN
        if not hf_token or hf_token == "YOUR_HUGGINGFACE_TOKEN_HERE":
            raise ValueError("HUGGINGFACEHUB_API_TOKEN is missing or invalid.")
            
        self.client = InferenceClient(token=hf_token)
        self.temperature = temperature
        
        # Priority list of robust chat models. We dynamically fallback if one is unsupported on the free tier.
        self.fallback_models = [
            "Qwen/Qwen2.5-Coder-32B-Instruct",
            "meta-llama/Llama-3.2-3B-Instruct",
            "HuggingFaceH4/zephyr-7b-beta",
            "mistralai/Mistral-7B-Instruct-v0.3"
        ]

    def _extract_json(self, text: str) -> dict:
        """
        Attempts to find and parse a JSON block within the LLM's text output.
        """
        # Try to find a JSON block bounded by ```json ... ```
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
            return json.loads(json_str)
            
        # If no markdown block, try to find the first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1]
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
        
        max_retries = 2
        last_error = ""
        
        # Loop through fallback models
        for model_id in self.fallback_models:
            for attempt in range(max_retries + 1):
                try:
                    # Invoke LLM Native Chat Completion
                    response = self.client.chat_completion(
                        model=model_id,
                        messages=messages,
                        temperature=self.temperature
                    )
                    raw_text = response.choices[0].message.content
                    
                    # Extract and parse JSON
                    parsed_json = self._extract_json(raw_text)
                    
                    # Validate with Pydantic
                    classification = IntentClassification.model_validate(parsed_json)
                    return classification
                    
                except json.JSONDecodeError as e:
                    last_error = f"Invalid JSON format. {str(e)}"
                except Exception as e:
                    error_str = str(e)
                    # If model is not supported, immediately break out of the retry loop and try the next model
                    if "not supported" in error_str.lower() or "not a chat model" in error_str.lower() or "400 Client Error" in error_str:
                        logger.warning(f"Model {model_id} unsupported or failed: {error_str}. Falling back to next model...")
                        break
                    last_error = f"Schema validation failed. {error_str}"
                    
                # If we failed due to JSON extraction (not model support), prompt again for the next retry
                messages.append({"role": "assistant", "content": raw_text if 'raw_text' in locals() else "{}"})
                messages.append({"role": "user", "content": f"Your last response caused an error: {last_error}. Please output ONLY a valid JSON object matching the exact schema requested without any extra text or markdown formatting."})
            
        # If ALL models and ALL retries fail, raise error
        raise RuntimeError(f"HuggingFace engine exhausted all fallback models and retries. Last error: {last_error}")
