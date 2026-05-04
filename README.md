# ComfyUI LLM Assistant

AI-помощник для ComfyUI в виде sidebar-панели. Помогает разбирать workflow, искать ошибки, генерировать новые workflow JSON, предлагать идеи по установленным моделям и создавать учебный курс для новичка под конкретное железо.

Создатель: **CrazyDashTool**

## Возможности

- Анализ текущего ComfyUI workflow: ноды, связи, параметры, возможные ошибки.
- Генерация новых ComfyUI workflow в JSON с кнопкой применения в интерфейсе.
- Улучшение параметров и подсказки по моделям, нодам и пайплайнам.
- Просмотр установленных моделей, сохраненных workflow и структуры папок ComfyUI.
- Генератор курса для новичка: пользователь указывает GPU/видеокарты, VRAM, CPU, RAM, ОС, опыт и цели.
- Цели курса: фото/изображения, видео, аудио, 3D-модели, LoRA/обучение моделей, автоматизация workflow.
- Интерфейс на трех языках: **Русский**, **English**, **Українська**.
- Поддержка облачных и локальных LLM-провайдеров.

## Поддерживаемые провайдеры

| Провайдер | Тип | Ключ | Модель по умолчанию / URL |
|---|---|---|---|
| OpenAI ChatGPT | Cloud API | нужен | `gpt-4o` |
| Anthropic Claude | Cloud API | нужен | `claude-3-5-sonnet-20241022` |
| Google Gemini | Cloud API | нужен | `gemini-2.0-flash` |
| Groq | Cloud API | нужен | `llama-3.3-70b-versatile` |
| xAI Grok | Cloud API | нужен | `grok-3` |
| OpenRouter | Cloud API | нужен | `openai/gpt-4o` или любой model tag |
| Mistral API | Cloud API | нужен | `mistral-large-latest` |
| Ollama | Local OpenAI-compatible | не нужен | `http://127.0.0.1:11434` |
| LM Studio | Local OpenAI-compatible | не нужен | `http://127.0.0.1:1234` |

Ollama и LM Studio используют OpenAI-compatible endpoint `/v1/chat/completions`. В настройках можно поменять Base URL, если сервер запущен на другом адресе.

## Установка

1. Скачайте или клонируйте репозиторий.
2. Поместите папку `ComfyUI-LLM-Assistant` в `ComfyUI/custom_nodes/`.

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

3. Установите зависимости, если они еще не установлены:

```bash
pip install -r requirements.txt
```

4. Перезапустите ComfyUI.
5. Откройте вкладку **LLM Assistant** в sidebar.

## Быстрый старт

1. Откройте **Settings** в панели LLM Assistant.
2. Выберите язык интерфейса.
3. Выберите провайдера.
4. Для cloud-провайдера вставьте API key.
5. Для Ollama или LM Studio проверьте Base URL и укажите имя локальной модели.
6. Сохраните настройки и задайте вопрос в чате.

## Локальные модели

### Ollama

1. Установите Ollama.
2. Скачайте модель, например:

```bash
ollama pull llama3.1:8b
```

3. В LLM Assistant выберите **Ollama (local)**.
4. Base URL по умолчанию: `http://127.0.0.1:11434`.
5. Укажите модель, например `llama3.1:8b`.

### LM Studio

1. Откройте LM Studio.
2. Скачайте и загрузите модель.
3. Включите Local Server.
4. В LLM Assistant выберите **LM Studio (local)**.
5. Base URL по умолчанию: `http://127.0.0.1:1234`.
6. Укажите model id, который показывает LM Studio.

## Курс для новичка

В панели есть вкладка с иконкой курса. Заполните:

- GPU / видеокарты и объем VRAM.
- CPU, RAM и ОС.
- Уровень опыта.
- Сколько времени готовы уделять в неделю.
- Что хотите делать: фото, видео, аудио, 3D, LoRA или автоматизацию.

После отправки выбранная LLM предложит персональный учебный план: настройка ComfyUI, подходящие модели, ограничения по VRAM, упражнения, ошибки новичков и финальный проект.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/llm-assistant/chat` | Отправка сообщений выбранному LLM-провайдеру |
| `GET` | `/llm-assistant/files` | Структура папок ComfyUI |
| `GET` | `/llm-assistant/models-list` | Список установленных моделей |
| `GET` | `/llm-assistant/workflow-files` | Список сохраненных workflow JSON |

## Безопасность

- API-ключи хранятся только в `localStorage` браузера.
- Запросы идут через локальный backend ComfyUI.
- Ключи не сохраняются на удаленном сервере этого расширения.
- Ollama и LM Studio работают локально и не требуют API-ключа.

## Полезные ссылки

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- [Mistral Chat Completions](https://docs.mistral.ai/api/endpoint/chat)
- [Ollama OpenAI compatibility](https://docs.ollama.com/openai)
- [LM Studio OpenAI compatibility](https://lmstudio.ai/docs/developer/openai-compat/)

## Структура проекта

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

- Добавлена поддержка Mistral API.
- Добавлена поддержка Ollama.
- Добавлена поддержка LM Studio.
- Добавлен выбор языка: русский, английский, украинский.
- Добавлен генератор учебного курса для новичков.

### v1.0.0

- Первый релиз LLM Assistant.
- Sidebar-панель, чат, быстрые действия, просмотр моделей и workflow.

## License

MIT License. См. файл [LICENSE](LICENSE).
