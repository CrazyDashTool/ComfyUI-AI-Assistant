"""
Backend HTTP routes for the ComfyUI LLM Assistant plugin.

The backend keeps provider secrets away from browser-side provider APIs, adapts
chat messages for different vendors, streams text chunks through SSE, and can
inject Ollama web-search results as extra context.
"""

import copy
import json
import logging
import os
import traceback
from typing import AsyncIterator, Dict, Iterable, List, Optional, Tuple

from aiohttp import ClientSession, ClientTimeout, web

try:
    from server import PromptServer

    routes = PromptServer.instance.routes
except Exception:
    routes = None
    logging.warning("[LLM Assistant] Could not access PromptServer. Routes will not be registered.")


PROVIDER_CONFIG = {
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "auth_header": "Bearer",
        "default_model": "gpt-5.2",
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/messages",
        "auth_header": "x-api-key",
        "default_model": "claude-sonnet-4-6",
        "extra_headers": {"anthropic-version": "2023-06-01"},
    },
    "gemini": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "stream_url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent",
        "auth_header": "key",
        "default_model": "gemini-3-pro-preview",
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "auth_header": "Bearer",
        "default_model": "openai/gpt-oss-120b",
    },
    "xai": {
        "url": "https://api.x.ai/v1/chat/completions",
        "auth_header": "Bearer",
        "default_model": "grok-4.20-reasoning",
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "auth_header": "Bearer",
        "default_model": "openai/gpt-5.2",
        "extra_headers": {
            "HTTP-Referer": "https://github.com/ComfyUI-LLM-Assistant",
            "X-Title": "ComfyUI LLM Assistant",
        },
    },
    "mistral": {
        "url": "https://api.mistral.ai/v1/chat/completions",
        "auth_header": "Bearer",
        "default_model": "mistral-medium-3-5",
    },
    "ollama": {
        "url": "http://127.0.0.1:11434/v1/chat/completions",
        "auth_header": None,
        "default_model": "qwen3:8b",
        "requires_api_key": False,
        "supports_base_url": True,
    },
    "lmstudio": {
        "url": "http://127.0.0.1:1234/v1/chat/completions",
        "auth_header": None,
        "default_model": "local-model",
        "requires_api_key": False,
        "supports_base_url": True,
    },
}

PROVIDER_ALIASES = {
    "lm-studio": "lmstudio",
    "lm_studio": "lmstudio",
}

OLLAMA_WEB_SEARCH_URL = "https://ollama.com/api/web_search"


def normalize_provider(provider: str) -> str:
    provider_id = (provider or "openai").strip().lower()
    return PROVIDER_ALIASES.get(provider_id, provider_id)


def build_openai_compatible_url(cfg: dict, base_url: str = "") -> str:
    if not cfg.get("supports_base_url") or not base_url:
        return cfg["url"]

    clean_url = base_url.strip().rstrip("/")
    if clean_url.endswith("/chat/completions"):
        return clean_url
    if clean_url.endswith("/v1"):
        return f"{clean_url}/chat/completions"
    return f"{clean_url}/v1/chat/completions"


def message_text(message: dict) -> str:
    content = message.get("content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(str(item.get("text") or item.get("content") or ""))
            else:
                parts.append(str(item))
        return "\n".join(part for part in parts if part)
    return str(content or "")


def normalize_image(image: dict) -> Optional[dict]:
    if not isinstance(image, dict):
        return None

    mime_type = image.get("mime_type") or image.get("mime") or image.get("type") or "image/png"
    data_url = image.get("data_url") or image.get("url") or ""
    base64_data = image.get("data") or image.get("base64") or ""

    if data_url.startswith("data:"):
        try:
            header, payload = data_url.split(",", 1)
            mime_type = header.split(":", 1)[1].split(";", 1)[0] or mime_type
            base64_data = payload
        except ValueError:
            return None
    elif base64_data:
        data_url = f"data:{mime_type};base64,{base64_data}"

    if not data_url and not base64_data:
        return None

    return {
        "mime_type": mime_type,
        "data_url": data_url,
        "data": base64_data,
        "name": image.get("name", "image"),
    }


def message_images(message: dict) -> List[dict]:
    images = message.get("images") or []
    normalized = [normalize_image(img) for img in images]
    return [img for img in normalized if img]


def to_openai_messages(messages: List[dict]) -> List[dict]:
    converted = []
    for msg in messages:
        role = msg.get("role", "user")
        text = message_text(msg)
        images = message_images(msg)

        if images and role == "user":
            content = []
            if text:
                content.append({"type": "text", "text": text})
            for image in images:
                content.append({"type": "image_url", "image_url": {"url": image["data_url"]}})
        else:
            content = text

        converted.append({"role": role, "content": content})
    return converted


def to_anthropic_payload(messages: List[dict], model: str, max_tokens: int) -> dict:
    system_parts = []
    converted = []

    for msg in messages:
        role = msg.get("role", "user")
        text = message_text(msg)
        images = message_images(msg)

        if role == "system":
            if text:
                system_parts.append(text)
            continue

        anthropic_role = "assistant" if role == "assistant" else "user"
        if images and anthropic_role == "user":
            content = []
            if text:
                content.append({"type": "text", "text": text})
            for image in images:
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": image["mime_type"],
                            "data": image["data"],
                        },
                    }
                )
        else:
            content = text

        converted.append({"role": anthropic_role, "content": content})

    payload = {"model": model, "messages": converted, "max_tokens": max_tokens}
    if system_parts:
        payload["system"] = "\n\n".join(system_parts)
    return payload


def to_gemini_payload(messages: List[dict], max_tokens: int) -> dict:
    contents = []
    system_parts = []

    for msg in messages:
        role = msg.get("role", "user")
        text = message_text(msg)
        images = message_images(msg)

        if role == "system":
            if text:
                system_parts.append({"text": text})
            continue

        gemini_role = "model" if role == "assistant" else "user"
        parts = []
        if text:
            parts.append({"text": text})
        if gemini_role == "user":
            for image in images:
                parts.append(
                    {
                        "inline_data": {
                            "mime_type": image["mime_type"],
                            "data": image["data"],
                        }
                    }
                )
        if parts:
            contents.append({"role": gemini_role, "parts": parts})

    payload = {"contents": contents, "generationConfig": {"maxOutputTokens": max_tokens}}
    if system_parts:
        payload["systemInstruction"] = {"parts": system_parts}
    return payload


def build_openai_payload(
    messages: List[dict],
    model: str,
    max_tokens: int,
    provider: str,
    stream: bool = False,
) -> dict:
    payload = {"model": model, "messages": to_openai_messages(messages)}
    if provider == "openai" and model.startswith(("gpt-5", "o1", "o3", "o4")):
        payload["max_completion_tokens"] = max_tokens
    else:
        payload["max_tokens"] = max_tokens
    if stream:
        payload["stream"] = True
    return payload


async def read_json_response(resp):
    try:
        return await resp.json(content_type=None)
    except Exception:
        return {"error": await resp.text()}


def get_last_user_text(messages: Iterable[dict]) -> str:
    for msg in reversed(list(messages)):
        if msg.get("role") == "user":
            return message_text(msg)
    return ""


def append_system_context(messages: List[dict], title: str, body: str) -> List[dict]:
    patched = copy.deepcopy(messages)
    context = f"\n\n---\n{title}\n{body}\n---"
    for msg in patched:
        if msg.get("role") == "system":
            msg["content"] = f"{message_text(msg)}{context}"
            return patched
    return [{"role": "system", "content": context.strip()}] + patched


def format_ollama_search_results(data: dict, max_results: int = 5) -> str:
    raw_results = data.get("results") or data.get("search_results") or data.get("items") or []
    if isinstance(raw_results, dict):
        raw_results = raw_results.get("results") or []

    lines = []
    for idx, item in enumerate(raw_results[:max_results], start=1):
        if not isinstance(item, dict):
            continue
        title = item.get("title") or item.get("name") or item.get("url") or f"Result {idx}"
        url = item.get("url") or item.get("link") or ""
        snippet = item.get("content") or item.get("snippet") or item.get("text") or item.get("description") or ""
        block = f"{idx}. {title}"
        if url:
            block += f"\nURL: {url}"
        if snippet:
            block += f"\nSnippet: {snippet[:1200]}"
        lines.append(block)

    return "\n\n".join(lines) if lines else "No web results returned."


async def ollama_web_search(api_key: str, query: str, max_results: int = 5) -> str:
    if not api_key:
        raise RuntimeError("Ollama Web Search API key is required. Create a free Ollama account key and add it in Settings.")
    if not query.strip():
        raise RuntimeError("Web search query is empty.")

    timeout = ClientTimeout(total=30)
    async with ClientSession(timeout=timeout) as session:
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"query": query}
        async with session.post(OLLAMA_WEB_SEARCH_URL, json=payload, headers=headers) as resp:
            data = await read_json_response(resp)
            if resp.status != 200:
                raise RuntimeError(f"Ollama web search error {resp.status}: {data}")
            return format_ollama_search_results(data, max_results)


async def prepare_messages(data: dict) -> List[dict]:
    messages = data.get("messages", [])
    if not isinstance(messages, list) or not messages:
        raise ValueError("Messages are required")

    if data.get("web_search"):
        query = data.get("web_search_query") or get_last_user_text(messages)
        search_key = data.get("ollama_search_api_key") or data.get("web_search_api_key") or ""
        max_results = int(data.get("web_search_max_results", 5))
        results = await ollama_web_search(search_key, query, max_results)
        messages = append_system_context(
            messages,
            "OLLAMA WEB SEARCH CONTEXT",
            (
                "Use these fresh search results as context when relevant. "
                "Cite source URLs in the answer when you use them.\n\n"
                f"Query: {query}\n\n{results}"
            ),
        )

    return messages


async def call_llm(
    provider: str,
    api_key: str,
    model: str,
    messages: List[dict],
    max_tokens: int = 4096,
    base_url: str = "",
) -> str:
    chunks = []
    async for chunk in call_llm_stream(provider, api_key, model, messages, max_tokens, base_url):
        chunks.append(chunk)
    return "".join(chunks)


async def iter_sse_data(resp) -> AsyncIterator[str]:
    buffer = ""
    async for raw in resp.content:
        buffer += raw.decode("utf-8", errors="ignore")
        buffer = buffer.replace("\r\n", "\n")
        while "\n\n" in buffer:
            event, buffer = buffer.split("\n\n", 1)
            for line in event.splitlines():
                line = line.strip()
                if line.startswith("data:"):
                    yield line[5:].strip()

    for line in buffer.splitlines():
        line = line.strip()
        if line.startswith("data:"):
            yield line[5:].strip()


def openai_chunk_text(data: dict) -> str:
    choices = data.get("choices") or []
    if not choices:
        return ""
    delta = choices[0].get("delta") or {}
    content = delta.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(item.get("text", "") for item in content if isinstance(item, dict))
    message = choices[0].get("message") or {}
    return message.get("content") or ""


def anthropic_chunk_text(data: dict) -> str:
    if data.get("type") == "content_block_delta":
        delta = data.get("delta") or {}
        return delta.get("text") or ""
    if data.get("type") == "content_block_start":
        block = data.get("content_block") or {}
        return block.get("text") or ""
    return ""


def gemini_chunk_text(data: dict) -> str:
    parts = []
    for candidate in data.get("candidates") or []:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            if "text" in part:
                parts.append(part["text"])
    return "".join(parts)


async def call_llm_stream(
    provider: str,
    api_key: str,
    model: str,
    messages: List[dict],
    max_tokens: int = 4096,
    base_url: str = "",
) -> AsyncIterator[str]:
    provider = normalize_provider(provider)
    cfg = PROVIDER_CONFIG.get(provider)
    if not cfg:
        raise ValueError(f"Unknown provider: {provider}")

    model_name = model or cfg["default_model"]
    timeout = ClientTimeout(total=180)

    async with ClientSession(timeout=timeout) as session:
        if provider == "gemini":
            url = f"{cfg['stream_url'].format(model=model_name)}?alt=sse&key={api_key}"
            payload = to_gemini_payload(messages, max_tokens)
            async with session.post(url, json=payload) as resp:
                if resp.status != 200:
                    data = await read_json_response(resp)
                    raise RuntimeError(f"Gemini API error {resp.status}: {data}")
                async for raw in iter_sse_data(resp):
                    if not raw or raw == "[DONE]":
                        continue
                    text = gemini_chunk_text(json.loads(raw))
                    if text:
                        yield text
            return

        if provider == "anthropic":
            headers = {
                "x-api-key": api_key,
                "content-type": "application/json",
                **cfg.get("extra_headers", {}),
            }
            payload = to_anthropic_payload(messages, model_name, max_tokens)
            payload["stream"] = True
            async with session.post(cfg["url"], json=payload, headers=headers) as resp:
                if resp.status != 200:
                    data = await read_json_response(resp)
                    raise RuntimeError(f"Anthropic API error {resp.status}: {data}")
                async for raw in iter_sse_data(resp):
                    if not raw or raw == "[DONE]":
                        continue
                    text = anthropic_chunk_text(json.loads(raw))
                    if text:
                        yield text
            return

        url = build_openai_compatible_url(cfg, base_url)
        headers = {"Content-Type": "application/json", **cfg.get("extra_headers", {})}
        if cfg.get("auth_header") == "Bearer" and api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        payload = build_openai_payload(messages, model_name, max_tokens, provider, stream=True)

        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status != 200:
                data = await read_json_response(resp)
                raise RuntimeError(f"{provider} API error {resp.status}: {data}")
            async for raw in iter_sse_data(resp):
                if not raw or raw == "[DONE]":
                    continue
                text = openai_chunk_text(json.loads(raw))
                if text:
                    yield text


async def sse_write(resp: web.StreamResponse, payload) -> None:
    if isinstance(payload, str):
        data = payload
    else:
        data = json.dumps(payload, ensure_ascii=False)
    await resp.write(f"data: {data}\n\n".encode("utf-8"))


def get_comfyui_root() -> str:
    path = os.path.dirname(os.path.realpath(__file__))
    for _ in range(5):
        path = os.path.dirname(path)
        if os.path.isfile(os.path.join(path, "main.py")):
            return path
    return os.path.expanduser("~")


def list_directory_tree(base_path: str, max_depth: int = 3, current_depth: int = 0) -> dict:
    if current_depth >= max_depth:
        return {"type": "directory", "name": os.path.basename(base_path), "children": ["..."]}

    result = {"type": "directory", "name": os.path.basename(base_path), "path": base_path, "children": []}
    try:
        entries = sorted(os.listdir(base_path))
        for entry in entries[:50]:
            full_path = os.path.join(base_path, entry)
            if os.path.isdir(full_path):
                if entry.startswith(".") or entry in {"__pycache__", "node_modules", ".git", "venv", ".venv"}:
                    continue
                result["children"].append(list_directory_tree(full_path, max_depth, current_depth + 1))
            else:
                result["children"].append(
                    {
                        "type": "file",
                        "name": entry,
                        "path": full_path,
                        "size": os.path.getsize(full_path),
                    }
                )
    except PermissionError:
        result["children"].append({"type": "error", "message": "Permission denied"})
    return result


def setup_routes():
    if routes is None:
        return

    @routes.post("/llm-assistant/chat")
    async def chat_handler(request: web.Request) -> web.Response:
        try:
            data = await request.json()
            provider = normalize_provider(data.get("provider", "openai"))
            api_key = data.get("api_key", "")
            model = data.get("model", "")
            max_tokens = int(data.get("max_tokens", 4096))
            base_url = data.get("base_url", "")

            cfg = PROVIDER_CONFIG.get(provider)
            if not cfg:
                return web.json_response({"error": f"Unknown provider: {provider}"}, status=400)
            if cfg.get("requires_api_key", True) and not api_key:
                return web.json_response({"error": "API key is required"}, status=400)

            messages = await prepare_messages(data)
            response_text = await call_llm(provider, api_key, model, messages, max_tokens, base_url)
            return web.json_response({"response": response_text})
        except Exception as e:
            logging.error(f"[LLM Assistant] Chat error: {e}\n{traceback.format_exc()}")
            return web.json_response({"error": str(e)}, status=500)

    @routes.post("/llm-assistant/chat/stream")
    async def chat_stream_handler(request: web.Request) -> web.StreamResponse:
        resp = web.StreamResponse(
            status=200,
            reason="OK",
            headers={
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
        await resp.prepare(request)

        try:
            data = await request.json()
            provider = normalize_provider(data.get("provider", "openai"))
            api_key = data.get("api_key", "")
            model = data.get("model", "")
            max_tokens = int(data.get("max_tokens", 4096))
            base_url = data.get("base_url", "")

            cfg = PROVIDER_CONFIG.get(provider)
            if not cfg:
                raise ValueError(f"Unknown provider: {provider}")
            if cfg.get("requires_api_key", True) and not api_key:
                raise ValueError("API key is required")

            messages = await prepare_messages(data)
            await sse_write(resp, {"type": "ready"})
            async for chunk in call_llm_stream(provider, api_key, model, messages, max_tokens, base_url):
                await sse_write(resp, {"type": "delta", "delta": chunk})
            await sse_write(resp, "[DONE]")
        except ConnectionResetError:
            logging.info("[LLM Assistant] Client disconnected from stream.")
        except Exception as e:
            logging.error(f"[LLM Assistant] Stream error: {e}\n{traceback.format_exc()}")
            try:
                await sse_write(resp, {"type": "error", "error": str(e)})
                await sse_write(resp, "[DONE]")
            except Exception:
                pass
        finally:
            try:
                await resp.write_eof()
            except Exception:
                pass

        return resp

    @routes.post("/llm-assistant/web-search")
    async def web_search_handler(request: web.Request) -> web.Response:
        try:
            data = await request.json()
            query = data.get("query", "")
            api_key = data.get("api_key", "")
            max_results = int(data.get("max_results", 5))
            results = await ollama_web_search(api_key, query, max_results)
            return web.json_response({"results": results})
        except Exception as e:
            logging.error(f"[LLM Assistant] Web search error: {e}")
            return web.json_response({"error": str(e)}, status=500)

    @routes.get("/llm-assistant/files")
    async def list_files_handler(request: web.Request) -> web.Response:
        try:
            root = get_comfyui_root()
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
                    sections[name] = {
                        "type": "directory",
                        "name": name,
                        "path": path,
                        "children": [],
                        "missing": True,
                    }

            return web.json_response({"root": root, "sections": sections})
        except Exception as e:
            logging.error(f"[LLM Assistant] Files error: {e}")
            return web.json_response({"error": str(e)}, status=500)

    @routes.get("/llm-assistant/workflow-files")
    async def workflow_files_handler(request: web.Request) -> web.Response:
        try:
            root = get_comfyui_root()
            workflows_path = os.path.join(root, "user", "default", "workflows")
            workflows = []

            if os.path.isdir(workflows_path):
                for fname in os.listdir(workflows_path):
                    if not fname.endswith(".json"):
                        continue
                    fpath = os.path.join(workflows_path, fname)
                    try:
                        with open(fpath, "r", encoding="utf-8") as f:
                            content = json.load(f)
                        workflows.append(
                            {
                                "name": fname,
                                "path": fpath,
                                "node_count": len(content) if isinstance(content, dict) else 0,
                            }
                        )
                    except Exception:
                        workflows.append({"name": fname, "path": fpath, "error": "Could not parse"})

            return web.json_response({"workflows": workflows})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    @routes.get("/llm-assistant/models-list")
    async def models_list_handler(request: web.Request) -> web.Response:
        try:
            root = get_comfyui_root()
            models_root = os.path.join(root, "models")
            result = {}

            if os.path.isdir(models_root):
                for category in os.listdir(models_root):
                    cat_path = os.path.join(models_root, category)
                    if not os.path.isdir(cat_path):
                        continue
                    files = []
                    for fname in os.listdir(cat_path):
                        fpath = os.path.join(cat_path, fname)
                        if os.path.isfile(fpath):
                            size = os.path.getsize(fpath)
                            files.append({"name": fname, "size_mb": round(size / (1024 * 1024), 1)})
                    result[category] = files

            return web.json_response({"models": result})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    logging.info("[LLM Assistant] All routes registered.")
