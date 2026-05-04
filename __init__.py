"""
ComfyUI LLM Assistant Plugin
==============================
Adds an AI-powered sidebar panel to ComfyUI for workflow debugging,
generation, and intelligent suggestions using multiple LLM providers.

Supported providers:
- Google Gemini API
- Groq API
- xAI (Grok) API
- OpenAI ChatGPT API
- Anthropic Claude API
- OpenRouter API (with custom model tags)
- Mistral API
- Ollama local server
- LM Studio local server

Installation:
  Copy this folder to ComfyUI/custom_nodes/ComfyUI-LLM-Assistant/
  Then restart ComfyUI.
"""

import os
import sys
import json
import logging

# Ensure this directory is on the path
ext_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, ext_dir)

# The JS files in the /web directory will be auto-served by ComfyUI
WEB_DIRECTORY = os.path.join(ext_dir, "web")

# Import backend routes
try:
    from .server import setup_routes
    setup_routes()
    logging.info("[LLM Assistant] Backend routes registered successfully.")
except Exception as e:
    logging.error(f"[LLM Assistant] Failed to register backend routes: {e}")

# This plugin adds only UI / backend routes — no custom nodes required,
# but we still export empty mappings so ComfyUI is happy.
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
