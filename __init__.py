"""
ComfyUI LLM Assistant Plugin
============================
Adds an AI-powered sidebar panel to ComfyUI for workflow debugging,
generation, prompt enhancement, streaming chat, image-aware messages,
Ollama web-search context, and intelligent suggestions using multiple
LLM providers.

Installation:
  Copy this folder to ComfyUI/custom_nodes/ComfyUI-LLM-Assistant/
  Then restart ComfyUI.
"""

import logging
import os
import sys

ext_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, ext_dir)

WEB_DIRECTORY = os.path.join(ext_dir, "web")

try:
    from .server import setup_routes

    setup_routes()
    logging.info("[LLM Assistant] Backend routes registered successfully.")
except Exception as e:
    logging.error(f"[LLM Assistant] Failed to register backend routes: {e}")

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
