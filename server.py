"""
Backend HTTP routes for the LLM Assistant plugin.
Handles API calls to various LLM providers and file listing.
"""

import os
import json
import logging
import traceback
import asyncio

from aiohttp import web, ClientSession, ClientTimeout

try:
    from server import PromptServer
    routes = PromptServer.instance.routes
except Exception:
    routes = None
    logging.warning("[LLM Assistant] Could not access PromptServer. Routes will not be registered.")


# ─────────────────────────────────────────────
#  Provider endpoint map
# ─────────────────────────────────────────────

PROVIDER_CONFIG = {
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "auth_header": "Bearer",
        "model_key": "model",
        "default_model": "gpt-4o",
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/messages",
        "auth_header": "x-api-key",
        "model_key": "model",
        "default_model": "claude-3-5-sonnet-20241022",
        "extra_headers": {"anthropic-version": "2023-06-01"},
    },
    "gemini": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "auth_header": "key",
        "model_key": "model",
        "default_model": "gemini-2.0-flash",
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "auth_header": "Bearer",
        "model_key": "model",
        "default_model": "llama-3.3-70b-versatile",
    },
    "xai": {
        "url": "https://api.x.ai/v1/chat/completions",
        "auth_header": "Bearer",
        "model_key": "model",
        "default_model": "grok-3",
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "auth_header": "Bearer",
        "model_key": "model",
        "default_model": "openai/gpt-4o",
        "extra_headers": {
            "HTTP-Referer": "https://github.com/ComfyUI-LLM-Assistant",
            "X-Title": "ComfyUI LLM Assistant",
        },
    },
    "mistral": {
        "url": "https://api.mistral.ai/v1/chat/completions",
        "auth_header": "Bearer",
        "model_key": "model",
        "default_model": "mistral-large-latest",
    },
    "ollama": {
        "url": "http://127.0.0.1:11434/v1/chat/completions",
        "auth_header": None,
        "model_key": "model",
        "default_model": "llama3.1:8b",
        "requires_api_key": False,
        "supports_base_url": True,
    },
    "lmstudio": {
        "url": "http://127.0.0.1:1234/v1/chat/completions",
        "auth_header": None,
        "model_key": "model",
        "default_model": "local-model",
        "requires_api_key": False,
        "supports_base_url": True,
    },
}

PROVIDER_ALIASES = {
    "lm-studio": "lmstudio",
    "lm_studio": "lmstudio",
}

# ─────────────────────────────────────────────
#  Helper: normalize messages → provider format
# ─────────────────────────────────────────────

def build_openai_payload(messages: list, model: str, max_tokens: int = 4096) -> dict:
    return {"model": model, "messages": messages, "max_tokens": max_tokens}


def build_anthropic_payload(messages: list, model: str, max_tokens: int = 4096) -> dict:
    system_msg = ""
    filtered = []
    for m in messages:
        if m["role"] == "system":
            system_msg = m["content"]
        else:
            filtered.append({"role": m["role"], "content": m["content"]})
    payload = {"model": model, "messages": filtered, "max_tokens": max_tokens}
    if system_msg:
        payload["system"] = system_msg
    return payload


def build_gemini_payload(messages: list, max_tokens: int = 4096) -> dict:
    contents = []
    system_instruction = None
    for m in messages:
        if m["role"] == "system":
            system_instruction = {"parts": [{"text": m["content"]}]}
        else:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
    payload = {
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens},
    }
    if system_instruction:
        payload["systemInstruction"] = system_instruction
    return payload


def normalize_provider(provider: str) -> str:
    provider_id = (provider or "openai").strip().lower()
    return PROVIDER_ALIASES.get(provider_id, provider_id)


def build_openai_compatible_url(cfg: dict, base_url: str = "") -> str:
    """Build a chat completions URL from a provider default or a user base URL."""
    if not cfg.get("supports_base_url") or not base_url:
        return cfg["url"]

    clean_url = base_url.strip().rstrip("/")
    if clean_url.endswith("/chat/completions"):
        return clean_url
    if clean_url.endswith("/v1"):
        return f"{clean_url}/chat/completions"
    return f"{clean_url}/v1/chat/completions"


async def read_json_response(resp):
    try:
        return await resp.json(content_type=None)
    except Exception:
        return {"error": await resp.text()}


# ─────────────────────────────────────────────
#  Core LLM call
# ─────────────────────────────────────────────

async def call_llm(
    provider: str,
    api_key: str,
    model: str,
    messages: list,
    max_tokens: int = 4096,
    base_url: str = "",
) -> str:
    provider = normalize_provider(provider)
    cfg = PROVIDER_CONFIG.get(provider)
    if not cfg:
        raise ValueError(f"Unknown provider: {provider}")

    timeout = ClientTimeout(total=120)

    async with ClientSession(timeout=timeout) as session:

        # ── Gemini ──────────────────────────────────────────────────────────
        if provider == "gemini":
            model_name = model or cfg["default_model"]
            url = cfg["url"].format(model=model_name)
            url = f"{url}?key={api_key}"
            payload = build_gemini_payload(messages, max_tokens)
            async with session.post(url, json=payload) as resp:
                data = await read_json_response(resp)
                if resp.status != 200:
                    raise RuntimeError(f"Gemini API error {resp.status}: {data}")
                return data["candidates"][0]["content"]["parts"][0]["text"]

        # ── Anthropic ───────────────────────────────────────────────────────
        elif provider == "anthropic":
            url = cfg["url"]
            headers = {
                "x-api-key": api_key,
                "content-type": "application/json",
                **cfg.get("extra_headers", {}),
            }
            payload = build_anthropic_payload(messages, model or cfg["default_model"], max_tokens)
            async with session.post(url, json=payload, headers=headers) as resp:
                data = await read_json_response(resp)
                if resp.status != 200:
                    raise RuntimeError(f"Anthropic API error {resp.status}: {data}")
                return data["content"][0]["text"]

        # ── OpenAI-compatible (openai, groq, xai, openrouter, mistral, ollama, lmstudio) ──
        else:
            url = build_openai_compatible_url(cfg, base_url)
            headers = {
                "Content-Type": "application/json",
                **cfg.get("extra_headers", {}),
            }
            if cfg.get("auth_header") == "Bearer" and api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            payload = build_openai_payload(messages, model or cfg["default_model"], max_tokens)
            async with session.post(url, json=payload, headers=headers) as resp:
                data = await read_json_response(resp)
                if resp.status != 200:
                    raise RuntimeError(f"{provider} API error {resp.status}: {data}")
                return data["choices"][0]["message"]["content"]


# ─────────────────────────────────────────────
#  Route handlers
# ─────────────────────────────────────────────

def get_comfyui_root() -> str:
    """Try to find the ComfyUI root directory."""
    # Walk up from this file's location
    path = os.path.dirname(os.path.realpath(__file__))
    for _ in range(5):
        path = os.path.dirname(path)
        if os.path.isfile(os.path.join(path, "main.py")):
            return path
    return os.path.expanduser("~")


def list_directory_tree(base_path: str, max_depth: int = 3, current_depth: int = 0) -> dict:
    """Recursively list directory contents."""
    if current_depth >= max_depth:
        return {"type": "directory", "name": os.path.basename(base_path), "children": ["..."]}

    result = {"type": "directory", "name": os.path.basename(base_path), "path": base_path, "children": []}
    try:
        entries = sorted(os.listdir(base_path))
        for entry in entries[:50]:  # limit entries
            full_path = os.path.join(base_path, entry)
            if os.path.isdir(full_path):
                # Skip hidden dirs and common noise dirs
                if entry.startswith(".") or entry in {"__pycache__", "node_modules", ".git", "venv", ".venv"}:
                    continue
                result["children"].append(
                    list_directory_tree(full_path, max_depth, current_depth + 1)
                )
            else:
                result["children"].append({
                    "type": "file",
                    "name": entry,
                    "path": full_path,
                    "size": os.path.getsize(full_path),
                })
    except PermissionError:
        result["children"].append({"type": "error", "message": "Permission denied"})
    return result


def setup_routes():
    if routes is None:
        return

    # ── POST /llm-assistant/chat ──────────────────────────────────────────
    @routes.post("/llm-assistant/chat")
    async def chat_handler(request: web.Request) -> web.Response:
        try:
            data = await request.json()
            provider = normalize_provider(data.get("provider", "openai"))
            api_key = data.get("api_key", "")
            model = data.get("model", "")
            messages = data.get("messages", [])
            max_tokens = int(data.get("max_tokens", 4096))
            base_url = data.get("base_url", "")

            cfg = PROVIDER_CONFIG.get(provider)
            if not cfg:
                return web.json_response({"error": f"Unknown provider: {provider}"}, status=400)

            if cfg.get("requires_api_key", True) and not api_key:
                return web.json_response({"error": "API key is required"}, status=400)
            if not messages:
                return web.json_response({"error": "Messages are required"}, status=400)

            response_text = await call_llm(provider, api_key, model, messages, max_tokens, base_url)
            return web.json_response({"response": response_text})

        except Exception as e:
            logging.error(f"[LLM Assistant] Chat error: {e}\n{traceback.format_exc()}")
            return web.json_response({"error": str(e)}, status=500)

    # ── GET /llm-assistant/files ──────────────────────────────────────────
    @routes.get("/llm-assistant/files")
    async def list_files_handler(request: web.Request) -> web.Response:
        try:
            root = get_comfyui_root()
            # Collect key directories
            sections = {}

            key_dirs = {
                "models": os.path.join(root, "models"),
                "custom_nodes": os.path.join(root, "custom_nodes"),
                "workflows": os.path.join(root, "user", "default", "workflows"),
                "output": os.path.join(root, "output"),
                "input": os.path.join(root, "input"),
            }

            for name, path in key_dirs.items():
                if os.path.isdir(path):
                    sections[name] = list_directory_tree(path, max_depth=2)
                else:
                    sections[name] = {"type": "directory", "name": name, "path": path, "children": [], "missing": True}

            return web.json_response({
                "root": root,
                "sections": sections,
            })
        except Exception as e:
            logging.error(f"[LLM Assistant] Files error: {e}")
            return web.json_response({"error": str(e)}, status=500)

    # ── GET /llm-assistant/workflow-files ─────────────────────────────────
    @routes.get("/llm-assistant/workflow-files")
    async def workflow_files_handler(request: web.Request) -> web.Response:
        """List workflow JSON files for suggestion context."""
        try:
            root = get_comfyui_root()
            workflows_path = os.path.join(root, "user", "default", "workflows")
            workflows = []

            if os.path.isdir(workflows_path):
                for fname in os.listdir(workflows_path):
                    if fname.endswith(".json"):
                        fpath = os.path.join(workflows_path, fname)
                        try:
                            with open(fpath, "r", encoding="utf-8") as f:
                                content = json.load(f)
                            workflows.append({
                                "name": fname,
                                "path": fpath,
                                "node_count": len(content) if isinstance(content, dict) else 0,
                            })
                        except Exception:
                            workflows.append({"name": fname, "path": fpath, "error": "Could not parse"})

            return web.json_response({"workflows": workflows})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    # ── GET /llm-assistant/models-list ────────────────────────────────────
    @routes.get("/llm-assistant/models-list")
    async def models_list_handler(request: web.Request) -> web.Response:
        """List downloaded models by category."""
        try:
            root = get_comfyui_root()
            models_root = os.path.join(root, "models")
            result = {}

            if os.path.isdir(models_root):
                for category in os.listdir(models_root):
                    cat_path = os.path.join(models_root, category)
                    if os.path.isdir(cat_path):
                        files = []
                        for fname in os.listdir(cat_path):
                            if os.path.isfile(os.path.join(cat_path, fname)):
                                size = os.path.getsize(os.path.join(cat_path, fname))
                                files.append({"name": fname, "size_mb": round(size / (1024 * 1024), 1)})
                        result[category] = files

            return web.json_response({"models": result})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    logging.info("[LLM Assistant] All routes registered.")
