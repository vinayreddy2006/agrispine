# AgriSpine AI Architecture Overview

This document provides a high-level overview of the AgriSpine AI Microservice architecture, designed for maintainability and scalability in production.

## Folder Structure

The `ai/` folder is organized into clear, decoupled modules:

- **`engines/`**: Contains the core logic for intent classification and NLP processing (e.g., `engine.py`, `huggingface.py`). This is the brain of the routing system.
- **`tasks/`**: Defines specific task extraction models or logic used by the engine to map user intents to executable actions.
- **`agents/`**: Houses the specialized domain agents (e.g., `crop_agent.py`, `expense_agent.py`, `weather_agent.py`). Each agent handles a specific business domain.
- **`tools/`**: Reusable Python tools that agents might invoke (e.g., calling external weather APIs).
- **`memory/`**: Components responsible for managing conversation context, history truncation, and state retention across requests.
- **`router/`**: FastAPI endpoints that handle incoming HTTP requests (`chat.py`, `voice.py`) and translate them for the engine.
- **`prompts/`**: Centralized location for LLM prompt templates, keeping strings separated from logic.
- **`schemas/`**: Pydantic models for request/response validation (e.g., `chat.py` schemas).
- **`services/`**: Integration layers with third-party APIs or the primary Node.js backend.
- **`utils/`**: Shared helper functions (e.g., `route_registry.py`, formatting helpers).

---

## The Request Flow

When a user submits a message, the system follows a deterministic pipeline to ensure the correct action is taken on the frontend.

1. **User Prompt**: The user sends a text or voice message from the React Frontend.
2. **Backend Proxy (`aiController.js`)**: The Node.js backend receives the request, attaches user database context (e.g., village, crops owned), saves the message to the DB, and forwards it to the FastAPI microservice.
3. **Intent Classification (`engines.engine`)**: The FastAPI engine analyzes the prompt and context to determine the core intent (e.g., `ADD_CROP`, `GET_WEATHER`).
4. **Task Selection (`route_registry.py`)**: Based on the intent, the engine routes the request to the appropriate Domain Agent (e.g., `CropAgent`).
5. **Agent Execution**: The domain agent processes the request, extracts required entities (like crop name and area), and formats a structured response.
6. **Response**: The engine packages the agent's output into a standard JSON schema containing the `reply`, `intent`, and an `action` object.
7. **Frontend Navigation**: The Node.js backend returns this JSON to the frontend. The `GramSathiFullScreen.jsx` component reads the `action` object and automatically navigates the user to the correct page or opens the relevant modal.
