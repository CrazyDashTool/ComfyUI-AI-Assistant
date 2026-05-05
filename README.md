# ComfyUI LLM Assistant

An AI assistant for ComfyUI in the form of a sidebar panel. It helps analyze workflows, find errors, generate new workflow JSONs, suggest ideas based on installed models, and create a beginner's training course tailored to specific hardware.

Creator: **CrazyDashTool**

## Features

- Analysis of the current ComfyUI workflow: nodes, connections, parameters, and potential errors.
- Generation of new ComfyUI workflows in JSON format with an apply button in the interface.
- Parameter improvement and tips on models, nodes, and pipelines.
- Viewing installed models, saved workflows, and the ComfyUI folder structure directory.
- Beginner course generator: the user specifies GPU/graphics cards, VRAM, CPU, RAM, OS, experience, and goals.
- Course goals: photos/images, videos, audio, 3D models, LoRA/model training, workflow automation.
- Interface in three languages: **Russian**, **English**, and **Ukrainian**.
- Support for cloud and local LLM providers.

## Supported Providers

| Provider | Type | Key | Default Model / URL |
|---|---|---|---|
| OpenAI ChatGPT | Cloud API | Required | `gpt-4o` |
| Anthropic Claude | Cloud API | Required | `claude-3-5-sonnet-20241022` |
| Google Gemini | Cloud API | Required | `gemini-2.0-flash` |
| Groq | Cloud API | Required | `llama-3.3-70b-versatile` |
| xAI Grok | Cloud API | Required | `grok-3` |
| OpenRouter | Cloud API | Required | `openai/gpt-4o` or any model tag |
| Mistral API | Cloud API | Required | `mistral-large-latest` |
| Ollama | Local OpenAI-compatible | Not required | `http://127.0.0.1:11434` |
| LM Studio | Local OpenAI-compatible | Not required | `http://127.0.0.1:1234` |

Ollama and LM Studio use the OpenAI-compatible endpoint `/v1/chat/completions`. You can change the Base URL in the settings if the server is running on a different address.

<img width="569" height="1080" alt="image" src="https://github.com/user-attachments/assets/d975f79b-bd16-41be-8ceb-c7dbea817043" />


## Installation

1. Download or clone the repository.
2. Place the `ComfyUI-LLM-Assistant` folder into `ComfyUI/custom_nodes/`.

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

3. Install the dependencies if they are not already installed:

```bash
pip install -r requirements.txt
```

4. Restart ComfyUI.
5. Open the **LLM Assistant** tab in the sidebar.

## Quick Start

1. Open **Settings** in the LLM Assistant panel.
2. Select the interface language.
3. Select a provider.
4. For a cloud provider, insert your API key.
5. For Ollama or LM Studio, verify the Base URL and specify the local model name.
6. Save the settings and ask a question in the chat.

## Local Models

### Ollama

1. Install Ollama.
2. Download a model, for example:

```bash
ollama pull llama3.1:8b
```

3. In LLM Assistant, select **Ollama (local)**.
4. Default Base URL: `http://127.0.0.1:11434`.
5. Specify the model, for example `llama3.1:8b`.

### LM Studio

1. Open LM Studio.
2. Download and load a model.
3. Turn on the Local Server.
4. In LLM Assistant, select **LM Studio (local)**.
5. Default Base URL: `http://127.0.0.1:1234`.
6. Specify the model ID shown in LM Studio.

## Beginner Course

There is a tab with a course icon in the panel. Fill in the following:

- GPU / graphics cards and VRAM amount.
- CPU, RAM, and OS.
- Experience level.
- How much time you are willing to dedicate per week.
- What you want to do: photos, videos, audio, 3D, LoRA, or automation.

After submitting, the selected LLM will offer a personal study plan: ComfyUI setup, suitable models, VRAM limitations, exercises, beginner mistakes, and a final project.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/llm-assistant/chat` | Send messages to the selected LLM provider |
| `GET` | `/llm-assistant/files` | ComfyUI folder structure |
| `GET` | `/llm-assistant/models-list` | List of installed models |
| `GET` | `/llm-assistant/workflow-files` | List of saved workflow JSON files |

## Security

- API keys are stored only in the browser's `localStorage`.
- Requests are made through the local ComfyUI backend.
- Keys are not saved on the remote server of this extension.
- Ollama and LM Studio run locally and do not require an API key.

## Useful Links

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- [Mistral Chat Completions](https://docs.mistral.ai/api/endpoint/chat)
- [Ollama OpenAI compatibility](https://docs.ollama.com/openai)
- [LM Studio OpenAI compatibility](https://lmstudio.ai/docs/developer/openai-compat/)

## Project Structure

```text
ComfyUI-LLM-Assistant/
  __init__.py
  server.py
  requirements.txt
  pyproject.toml
  README.md
  web/
    llm_assistant.js
```

## Changelog

### v1.1.0

- Added support for Mistral API.
- Added support for Ollama.
- Added support for LM Studio.
- Added language selection: Russian, English, Ukrainian.
- Added a training course generator for beginners.

### v1.0.0

- First release of the LLM Assistant.
- Sidebar panel, chat, quick actions, view models, and workflows.

## License

MIT License. See the [LICENSE](LICENSE) file.
