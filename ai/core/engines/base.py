from abc import ABC, abstractmethod
from typing import List
from schemas.chat import ChatMessage
from pydantic import BaseModel, Field

class IntentClassification(BaseModel):
    intent: str = Field(description="The matching task intent from the registry (e.g., MESSENGER_SEND, MACHINERY_SEARCH) or CHAT if no specific task matches.")
    parameters: dict = Field(description="The extracted parameters required for the intent.")
    chat_reply: str = Field(description="If the intent is CHAT, provide your natural language response here.")

class AIEngine(ABC):
    @abstractmethod
    def identify_intent(
        self, 
        message: str, 
        history: List[ChatMessage], 
        user_context: dict, 
        page_context: dict,
        system_prompt: str
    ) -> IntentClassification:
        """
        Parses the user message and history against the provided system prompt 
        and returns an IntentClassification structured object.
        """
        pass
