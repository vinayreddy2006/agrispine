# AgriSpine AI Architecture Overview

This document provides a technical overview of the **GramSathi AI** FastAPI microservice (`ai/`), designed for multilingual intent classification, parameter validation, Human-in-the-Loop confirmation, and multi-agent task execution.

## Folder Structure

The `ai/` microservice is organized into decoupled modules matching the codebase:

- **`main.py`**: FastAPI application entrypoint, CORS middleware, `/health` & `/api/ai/health` diagnostics, and router registration under `/api/ai`.
- **`router/`**: FastAPI HTTP endpoints:
  - `chat.py`: `POST /api/ai/chat` (conversational intent + slot-filling pipeline) and `POST /api/ai/action/execute` (executes confirmed tasks).
  - `voice.py`: `POST /api/ai/transcribe` (Speech-to-Text preview via Groq `whisper-large-v3` with Google Speech Recognition fallback) and `POST /api/ai/voice` (transcribe + process).
- **`schemas/chat.py`**: Pydantic request/response models (`ChatMessage`, `ChatRequest`, `ChatResponse`) carrying `history`, `pending_action`, `conversation_summary`, `context_facts`, `requires_confirmation`, and `action`.
- **`engines/engine.py`**: Core orchestration pipeline (`process_request`, `execute_task_directly`), handling:
  - Provider resolution (`get_engine()`).
  - Active `pending_action` fast-paths (unambiguous multilingual confirmations/cancellations, slot-filling, and edits).
  - Read-only immediate execution vs. mandatory validation and confirmation card generation for data-modifying intents.
- **`prompts/system_prompts.py`**: Dynamic prompt builder (`build_system_prompt`) injecting `user_context`, `page_context`, `pending_action`, `conversation_summary`, `context_facts`, and target language rules (`en`, `te`, `hi`).
- **`core/`**:
  - `config.py`: `pydantic-settings` loader reading `ai/.env` (`AI_PROVIDER`, `GROQ_*`, `HF_*`, `GEMINI_API_KEY`, `AI_TEMPERATURE`, `AI_MAX_RETRIES`, `AI_TIMEOUT`).
  - `action_validator.py`: Defines `DATA_MODIFYING_INTENTS`, mandatory field checks (`validate_action`), parameter normalization (`normalize_parameters`, `parse_relative_date`), localized missing-field questions (`generate_missing_info_question`), and confirmation card builders (`build_confirmation_card_data`).
  - `task_registry.py`: Maps 27 registered task intents in `TASK_REGISTRY` to specialized agent functions.
  - `context_resolver.py` & `smart_matcher.py`: Fuzzy entity resolution (`difflib.SequenceMatcher`, 90% threshold) resolving crop, conversation, and machinery names to MongoDB `_id`s.
  - `route_registry.py`: Maps frontend route keys (e.g., `crop_details`, `my_bookings`) to SPA URL paths (`FRONTEND_ROUTES`).
  - `api_client.py`: Synchronous `requests` client calling the Node.js backend (`BACKEND_URL`, default `http://localhost:5000`) with the user's `auth-token`.
  - **`engines/`**: Provider implementations inheriting `AIEngine` (`base.py`):
    - `groq.py` (`GroqEngine` — default): `qwen/qwen3.8-27b` with fallbacks (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `allam-2-7b`), custom `httpx.Client`, and base URL sanitization.
    - `huggingface.py` (`HuggingFaceEngine`): `InferenceClient` with multi-model fallback (`Qwen/Qwen2.5-Coder-32B-Instruct`, `meta-llama/Llama-3.2-3B-Instruct`, `HuggingFaceH4/zephyr-7b-beta`).
    - `gemini.py` (`GeminiEngine`): `ChatGoogleGenerativeAI` (`gemini-2.5-flash`) with structured Pydantic output.
  - **`agents/`**: Domain workers (`crop_agent.py`, `expense_agent.py`, `machinery_agent.py`, `messenger_agent.py`, `community_agent.py`, `market_agent.py`, `weather_agent.py`, `group_agent.py`).

---

## Request & Human-in-the-Loop Execution Flow

1. **Client Input (Web & Android)**:
   - User types or records voice input in `GramSathiFullScreen.jsx` (Web) or `GramSathiScreen.js` (Android).
   - Mobile voice input records `.m4a` via `expo-audio` and calls `POST /api/ai/transcribe` (Groq Whisper) for review/submission.
2. **Backend Proxy (`backend/controllers/aiController.js` & `backend/services/aiService.js`)**:
   - Loads `AIChat` session from MongoDB, appends the user message, slices the last 15 messages (token-aware window), and attaches `pending_action`, `summary`, `context_facts`, and `userContext`.
   - Forwards payload to FastAPI `POST /api/ai/chat`.
3. **Intent Classification & Context Resolution (`ai/engines/engine.py`)**:
   - Evaluates active `pending_action` for confirmations, cancellations, edits, or slot-filling answers across turns.
   - Otherwise calls the configured `AIEngine` (`GroqEngine` by default) to classify intent (`GREETING`, `CHAT`, `GENERAL_CONVERSATION`, or a task key in `TASK_REGISTRY`).
4. **Validation & Confirmation Gate (`ai/core/action_validator.py`)**:
   - **Conversational / Read-Only Intents** (`CHAT`, `NAVIGATE`, `WEATHER_GET`, `MACHINERY_SEARCH`, `CROP_OPEN`, etc.) execute immediately without confirmation.
   - **Data-Modifying Intents** (`CROP_ADD`, `CROP_ADD_EXPENSE`, `CROP_SELL`, `MACHINERY_BOOK`, etc.):
     - If mandatory fields are missing $\rightarrow$ persists `pending_action` with `status: "needs_info"` and asks a targeted question in `en`, `te`, or `hi`.
     - If all mandatory fields are present $\rightarrow$ returns `requires_confirmation: true` and `action: { type: "CONFIRMATION_REQUIRED", pending_action: ... }` without modifying the database.
5. **Explicit Confirmation & Execution**:
   - User clicks `[Confirm & Execute]` (calling `POST /api/ai/actions/confirm` $\rightarrow$ FastAPI `POST /api/ai/action/execute`) or sends an explicit confirmation phrase.
   - The mapped agent executes the real REST call against the Express backend (`BACKEND_URL`) with the farmer's `auth-token`, clears `pending_action`, and returns the verified result and optional `NAVIGATE` / `REFRESH_UI` action.
