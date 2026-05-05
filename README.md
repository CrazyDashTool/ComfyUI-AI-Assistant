# ComfyUI LLM Assistant

AI assistant sidebar for ComfyUI.

Creator: **CrazyDashTool**

Version: **1.2.1**

## Features

- Multi-chat history: create, switch, delete, and keep separate chat sessions.
- Context-aware answers: the assistant can include the current workflow, saved workflows, installed models, and recent chat history.
- Streaming responses over SSE: text appears while the model is generating.
- Cancel button for long generations.
- Markdown rendering for assistant replies: headings, lists, inline code, code blocks, copy buttons, and workflow JSON apply buttons.
- Prompt Enhancer tab: expand a simple prompt into a detailed ComfyUI prompt with weights, style, camera, lighting, negative prompt, and technical parameters.
- Insert enhanced prompts into the selected ComfyUI node when it has a compatible text/prompt widget.
- Image upload for vision-capable models/providers.
- Ollama Web Search context: optional web search results are injected into the prompt before the LLM call.
- Voice input through the browser Web Speech API.
- ComfyUI-style dark interface instead of the older futuristic look.
- File/model browser and beginner course builder are still included.

## Supported Providers

| Provider | Key | Default model |
|---|---:|---|
| OpenAI | Required | `gpt-5.5` |
| Anthropic Claude | Required | `claude-sonnet-4-6` |
| Google Gemini | Required | `gemini-3-pro-preview` |
| Groq | Required | `openai/gpt-oss-120b` |
| xAI Grok | Required | `grok-4.20-reasoning` |
| OpenRouter | Required | `minimax/minimax-m2.5:free` |
| Mistral API | Required | `mistral-medium-3-5` |
| Ollama local | Not required | `local-models` |
| LM Studio local | Not required | `local-models` |

Model fields are editable. Some model names are aliases or preview models and may depend on your provider account access.

## Ollama Web Search

Ollama Web Search uses Ollama's hosted endpoint:

```text
POST https://ollama.com/api/web_search
Authorization: Bearer <OLLAMA_API_KEY>
```

This is separate from the local Ollama server. Create a free Ollama account key, put it into **Settings -> Ollama Web Search API key**, and enable **Ollama web search** below the chat input.

## Installation

1. Download or clone the repository.
2. Place the folder into `ComfyUI/custom_nodes/`.

```text
ComfyUI/
  custom_nodes/
    ComfyUI-LLM-Assistant/
      __init__.py
      server.py
      web/
        llm_assistant.js
      requirements.txt
      README.md
```

3. Install dependencies if needed:

```bash
pip install -r requirements.txt
```

4. Restart ComfyUI.
5. Open the **LLM Assistant** sidebar tab or the floating **AI** button.

## Local Models

### Ollama

1. Install Ollama.
2. Pull a model, for example:

```bash
ollama pull qwen3:8b
```

3. Select **Ollama local** in the assistant settings.
4. Default Base URL: `http://127.0.0.1:11434`.
5. Use a vision-capable local model if you want image input.

### LM Studio

1. Open LM Studio.
2. Download and load a model.
3. Turn on the Local Server.
4. Select **LM Studio local** in the assistant settings.
5. Default Base URL: `http://127.0.0.1:1234`.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/llm-assistant/chat` | Non-streaming chat fallback |
| `POST` | `/llm-assistant/chat/stream` | SSE streaming chat |
| `POST` | `/llm-assistant/web-search` | Ollama web search helper |
| `GET` | `/llm-assistant/files` | ComfyUI folder structure |
| `GET` | `/llm-assistant/models-list` | Installed model files |
| `GET` | `/llm-assistant/workflow-files` | Saved workflow JSON files |

## Security

- Provider keys are stored only in browser `localStorage`.
- Requests go through the local ComfyUI backend.
- Local Ollama and LM Studio chat calls do not require provider keys.
- Ollama Web Search requires its own Ollama account API key only when the web search checkbox is enabled.

## Useful Links

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- [OpenAI models](https://platform.openai.com/docs/models)
- [Anthropic models](https://docs.anthropic.com/en/docs/about-claude/models/all-models)
- [Google Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [Groq models](https://console.groq.com/docs/models)
- [Mistral models](https://docs.mistral.ai/getting-started/models/)
- [Ollama Web Search](https://docs.ollama.com/capabilities/web-search)
- [Ollama OpenAI compatibility](https://docs.ollama.com/openai)
- [LM Studio OpenAI compatibility](https://lmstudio.ai/docs/developer/openai-compat/)

## Changelog

### v1.2.1

- Added multi-chat sessions with persistent history.
- Added streaming responses through `/llm-assistant/chat/stream`.
- Added generation cancel support.
- Added image upload and provider payload adapters for vision-capable models.
- Added Ollama Web Search context injection.
- Added Prompt Enhancer tab and insertion into selected ComfyUI text/prompt widgets.
- Added Markdown rendering.
- Added thinking indicator with animated dots.
- Added voice input via Web Speech API.
- Updated provider defaults and model suggestions.
- Restyled the UI to better match ComfyUI.

### v1.1.0

- Added Mistral API.
- Added Ollama.
- Added LM Studio.
- Added language selection: Russian, English, Ukrainian.
- Added beginner course generator.

### v1.0.0

- First release with sidebar chat, quick actions, model/workflow browsing, and workflow helpers.

## License

MIT License. See [LICENSE](LICENSE).
