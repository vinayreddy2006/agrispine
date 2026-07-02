from typing import List
from schemas.chat import ChatMessage
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import settings
from .base import AIEngine, IntentClassification

class GeminiEngine(AIEngine):
    def __init__(self, model_name: str = "gemini-2.5-flash", temperature: float = 0):
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=settings.GEMINI_API_KEY or "dummy_key"
        )
        self.structured_llm = self.llm.with_structured_output(IntentClassification)

    def identify_intent(
        self, 
        message: str, 
        history: List[ChatMessage], 
        user_context: dict, 
        page_context: dict,
        system_prompt: str
    ) -> IntentClassification:
        
        # Build Messages
        messages = [SystemMessage(content=system_prompt)]
        for h in history:
            if h.role == "user":
                messages.append(HumanMessage(content=h.content))
            else:
                messages.append(AIMessage(content=h.content))
                
        messages.append(HumanMessage(content=message))
        
        # Invoke via Langchain structured output
        return self.structured_llm.invoke(messages)
