/**
 * ComfyUI LLM Assistant - Sidebar Extension v1.2.1
 *
 * Chat sessions, streaming responses, image input, Ollama web search context,
 * prompt enhancement, voice input, and a ComfyUI-style interface.
 */

import { app } from "../../scripts/app.js";

const PLUGIN_ID = "llm-assistant";
const VERSION = "1.2.1";
const STORAGE_KEY = "llm_assistant_settings_v121";
const CHATS_KEY = "llm_assistant_chats_v121";
const ACTIVE_CHAT_KEY = "llm_assistant_active_chat_v121";
const COURSE_PROFILE_KEY = "llm_assistant_course_profile";
const LEGACY_SETTINGS_KEY = "llm_assistant_settings";
const LEGACY_HISTORY_KEY = "llm_assistant_history";
const MAX_CONTEXT_MESSAGES = 30;
const MAX_SAVED_MESSAGES = 300;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGES = 4;

const PROVIDERS = [
  { id: "openai", label: "OpenAI", placeholder: "sk-...", defaultModel: "gpt-5.2", requiresApiKey: true, supportsImages: true },
  { id: "anthropic", label: "Claude", placeholder: "sk-ant-...", defaultModel: "claude-sonnet-4-6", requiresApiKey: true, supportsImages: true },
  { id: "gemini", label: "Gemini", placeholder: "AIza...", defaultModel: "gemini-3-pro-preview", requiresApiKey: true, supportsImages: true },
  { id: "groq", label: "Groq", placeholder: "gsk_...", defaultModel: "openai/gpt-oss-120b", requiresApiKey: true, supportsImages: true },
  { id: "xai", label: "xAI Grok", placeholder: "xai-...", defaultModel: "grok-4.20-reasoning", requiresApiKey: true, supportsImages: true },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-...", defaultModel: "openai/gpt-5.2", requiresApiKey: true, supportsImages: true },
  { id: "mistral", label: "Mistral", placeholder: "Mistral API key", defaultModel: "mistral-medium-3-5", requiresApiKey: true, supportsImages: true },
  { id: "ollama", label: "Ollama local", placeholder: "Optional", defaultModel: "qwen3:8b", requiresApiKey: false, supportsBaseUrl: true, baseUrl: "http://127.0.0.1:11434", supportsImages: true },
  { id: "lmstudio", label: "LM Studio local", placeholder: "Optional", defaultModel: "local-model", requiresApiKey: false, supportsBaseUrl: true, baseUrl: "http://127.0.0.1:1234", supportsImages: true },
];

const MODEL_SUGGESTIONS = {
  openai: ["gpt-5.2", "gpt-5.2-pro", "gpt-5.2-chat-latest", "gpt-5-mini", "gpt-5-nano", "gpt-4.1", "gpt-4.1-mini"],
  anthropic: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-1-20250805", "claude-sonnet-4-5"],
  gemini: ["gemini-3-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
  groq: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct", "qwen/qwen3-32b", "llama-3.3-70b-versatile"],
  xai: ["grok-4.20-reasoning", "grok-4.1-fast-reasoning", "grok-4.1-fast-non-reasoning", "grok-4", "grok-3-mini"],
  openrouter: ["openai/gpt-5.2", "anthropic/claude-sonnet-4.6", "google/gemini-3-pro-preview", "x-ai/grok-4.20", "mistralai/mistral-medium-3.5", "qwen/qwen3-max"],
  mistral: ["mistral-medium-3-5", "mistral-small-4-0", "mistral-large-3-latest", "pixtral-large-latest", "codestral-latest"],
  ollama: ["qwen3:8b", "qwen3:14b", "gpt-oss:20b", "gemma3:4b", "deepseek-r1:8b", "qwen2.5vl:7b", "llava:7b"],
  lmstudio: ["local-model"],
};

const LANGUAGES = [
  { id: "ru", label: "Русский", promptName: "Russian" },
  { id: "en", label: "English", promptName: "English" },
  { id: "uk", label: "Українська", promptName: "Ukrainian" },
];

const I18N = {
  en: {
    chat: "Chat",
    enhancer: "Prompt Enhancer",
    files: "Files",
    coursePlanner: "Course",
    settings: "Settings",
    newChat: "New chat",
    deleteChat: "Delete chat",
    clearChat: "Clear chat",
    clearChatConfirm: "Clear this chat?",
    deleteChatConfirm: "Delete this chat?",
    chatTitle: "Chat history",
    noChats: "No chats",
    welcomeTitle: "LLM Assistant",
    welcomeText: "Ask about the current workflow, models, errors, or prompt ideas.",
    quickActions: "Quick actions",
    thinking: "Thinking",
    cancel: "Cancel",
    inputPlaceholder: "Ask about ComfyUI, the current workflow, or a new workflow...",
    includeWorkflow: "Workflow context",
    includeModels: "Models context",
    webSearch: "Ollama web search",
    attachImage: "Attach image",
    voiceInput: "Voice input",
    listening: "Listening...",
    imagesAttached: "Images attached",
    remove: "Remove",
    send: "Send",
    you: "You",
    assistant: "Assistant",
    system: "System",
    copy: "Copy",
    copied: "Copied",
    applyWorkflow: "Apply workflow",
    applyConfirm: "Apply this JSON as the current workflow?",
    applied: "Applied",
    failed: "Failed",
    needKey: "Set the provider API key in Settings first.",
    needOllamaSearchKey: "Set the Ollama Web Search API key in Settings first.",
    error: "Error",
    stopped: "Generation cancelled.",
    settingsTitle: "Provider settings",
    aiProvider: "AI provider",
    language: "Interface language",
    apiKey: "API key",
    apiKeyOptional: "API key (optional)",
    baseUrl: "Base URL",
    baseUrlHint: "/v1/chat/completions is added automatically when needed.",
    model: "Model",
    modelTagOpenRouter: "Model tag",
    modelSuggestions: "Model suggestions",
    ollamaSearchKey: "Ollama Web Search API key",
    ollamaSearchHint: "Used only when the Ollama web search checkbox is enabled. A free Ollama account key is required.",
    saveSettings: "Save settings",
    settingsSaved: "Settings saved",
    securityTitle: "Security",
    securityText: "Keys are stored in browser localStorage and sent only to the local ComfyUI backend.",
    supportsImages: "Image input supported by selected model/provider when the model has vision capability.",
    filesTitle: "ComfyUI files and models",
    refresh: "Refresh",
    loading: "Loading...",
    suggestWorkflow: "Suggest workflow",
    refreshHint: "Refresh to load local models, workflows, and folders.",
    installedModels: "Installed models",
    savedWorkflows: "Saved workflows",
    directoryStructure: "Folder structure",
    courseTitle: "Beginner course builder",
    courseIntro: "Describe your hardware and goals. The assistant will build a practical ComfyUI learning plan.",
    gpu: "GPU",
    vram: "VRAM",
    cpu: "CPU",
    ram: "RAM",
    os: "OS",
    experience: "Experience",
    timeBudget: "Time per week",
    goals: "Goals",
    generateCourse: "Generate course",
    courseChooseGoal: "Choose at least one goal.",
    back: "Back",
    beginner: "Beginner",
    someExperience: "Some experience",
    imageGoal: "Images",
    videoGoal: "Video",
    audioGoal: "Audio",
    models3dGoal: "3D",
    loraGoal: "LoRA training",
    automationGoal: "Automation",
    enhancerTitle: "Prompt Enhancer",
    enhancerIntro: "Write a simple idea. The LLM will expand it into a detailed generation prompt with weights, style, camera, lighting, negative prompt, and technical settings.",
    enhancerInput: "Simple prompt",
    enhancerPlaceholder: "girl in a forest",
    enhance: "Enhance prompt",
    enhancedPrompt: "Enhanced prompt",
    insertSelectedNode: "Insert into selected node",
    insertOk: "Inserted into selected node.",
    insertFail: "Select a ComfyUI node with a text/prompt widget first.",
  },
  ru: {
    chat: "Чат",
    enhancer: "Prompt Enhancer",
    files: "Файлы",
    coursePlanner: "Курс",
    settings: "Настройки",
    newChat: "Новый чат",
    deleteChat: "Удалить чат",
    clearChat: "Очистить чат",
    clearChatConfirm: "Очистить этот чат?",
    deleteChatConfirm: "Удалить этот чат?",
    chatTitle: "История чатов",
    noChats: "Нет чатов",
    welcomeTitle: "LLM Assistant",
    welcomeText: "Спроси про текущий workflow, модели, ошибки или идеи для промпта.",
    quickActions: "Быстрые действия",
    thinking: "Думаю",
    cancel: "Отмена",
    inputPlaceholder: "Спроси про ComfyUI, текущий workflow или новый workflow...",
    includeWorkflow: "Контекст workflow",
    includeModels: "Контекст моделей",
    webSearch: "Поиск Ollama",
    attachImage: "Прикрепить изображение",
    voiceInput: "Голосовой ввод",
    listening: "Слушаю...",
    imagesAttached: "Изображения",
    remove: "Удалить",
    send: "Отправить",
    you: "Вы",
    assistant: "Ассистент",
    system: "Система",
    copy: "Копировать",
    copied: "Скопировано",
    applyWorkflow: "Применить workflow",
    applyConfirm: "Применить этот JSON как текущий workflow?",
    applied: "Применено",
    failed: "Ошибка",
    needKey: "Сначала укажите API-ключ провайдера в настройках.",
    needOllamaSearchKey: "Сначала укажите Ollama Web Search API key в настройках.",
    error: "Ошибка",
    stopped: "Генерация отменена.",
    settingsTitle: "Настройки провайдера",
    aiProvider: "ИИ-провайдер",
    language: "Язык интерфейса",
    apiKey: "API-ключ",
    apiKeyOptional: "API-ключ (необязательно)",
    baseUrl: "Base URL",
    baseUrlHint: "/v1/chat/completions добавляется автоматически, если нужно.",
    model: "Модель",
    modelTagOpenRouter: "Тег модели",
    modelSuggestions: "Подсказки моделей",
    ollamaSearchKey: "Ollama Web Search API key",
    ollamaSearchHint: "Используется только при включенном чекбоксе поиска Ollama. Нужен бесплатный ключ аккаунта Ollama.",
    saveSettings: "Сохранить настройки",
    settingsSaved: "Настройки сохранены",
    securityTitle: "Безопасность",
    securityText: "Ключи хранятся в localStorage браузера и отправляются только в локальный backend ComfyUI.",
    supportsImages: "Изображения отправляются, если выбранная модель умеет vision.",
    filesTitle: "Файлы и модели ComfyUI",
    refresh: "Обновить",
    loading: "Загрузка...",
    suggestWorkflow: "Предложить workflow",
    refreshHint: "Обновите список, чтобы загрузить локальные модели, workflows и папки.",
    installedModels: "Установленные модели",
    savedWorkflows: "Сохраненные workflows",
    directoryStructure: "Структура папок",
    courseTitle: "Конструктор курса для новичка",
    courseIntro: "Опишите железо и цели. Ассистент соберет практичный план изучения ComfyUI.",
    gpu: "GPU",
    vram: "VRAM",
    cpu: "CPU",
    ram: "RAM",
    os: "OS",
    experience: "Опыт",
    timeBudget: "Время в неделю",
    goals: "Цели",
    generateCourse: "Создать курс",
    courseChooseGoal: "Выберите хотя бы одну цель.",
    back: "Назад",
    beginner: "Новичок",
    someExperience: "Есть небольшой опыт",
    imageGoal: "Изображения",
    videoGoal: "Видео",
    audioGoal: "Аудио",
    models3dGoal: "3D",
    loraGoal: "LoRA обучение",
    automationGoal: "Автоматизация",
    enhancerTitle: "Prompt Enhancer",
    enhancerIntro: "Введите простой промпт. LLM развернет его в детальный промпт с весами, стилем, камерой, светом, negative prompt и техническими параметрами.",
    enhancerInput: "Простой промпт",
    enhancerPlaceholder: "девушка в лесу",
    enhance: "Улучшить промпт",
    enhancedPrompt: "Расширенный промпт",
    insertSelectedNode: "Вставить в выбранную ноду",
    insertOk: "Вставлено в выбранную ноду.",
    insertFail: "Сначала выберите ноду ComfyUI с текстовым/prompt-виджетом.",
  },
  uk: {
    chat: "Чат",
    enhancer: "Prompt Enhancer",
    files: "Файли",
    coursePlanner: "Курс",
    settings: "Налаштування",
    newChat: "Новий чат",
    deleteChat: "Видалити чат",
    clearChat: "Очистити чат",
    clearChatConfirm: "Очистити цей чат?",
    deleteChatConfirm: "Видалити цей чат?",
    chatTitle: "Історія чатів",
    noChats: "Немає чатів",
    welcomeTitle: "LLM Assistant",
    welcomeText: "Запитайте про поточний workflow, моделі, помилки або ідеї для промпта.",
    quickActions: "Швидкі дії",
    thinking: "Думаю",
    cancel: "Скасувати",
    inputPlaceholder: "Запитайте про ComfyUI, поточний workflow або новий workflow...",
    includeWorkflow: "Контекст workflow",
    includeModels: "Контекст моделей",
    webSearch: "Пошук Ollama",
    attachImage: "Додати зображення",
    voiceInput: "Голосовий ввід",
    listening: "Слухаю...",
    imagesAttached: "Зображення",
    remove: "Видалити",
    send: "Надіслати",
    you: "Ви",
    assistant: "Асистент",
    system: "Система",
    copy: "Копіювати",
    copied: "Скопійовано",
    applyWorkflow: "Застосувати workflow",
    applyConfirm: "Застосувати цей JSON як поточний workflow?",
    applied: "Застосовано",
    failed: "Помилка",
    needKey: "Спочатку вкажіть API-ключ провайдера в налаштуваннях.",
    needOllamaSearchKey: "Спочатку вкажіть Ollama Web Search API key в налаштуваннях.",
    error: "Помилка",
    stopped: "Генерацію скасовано.",
    settingsTitle: "Налаштування провайдера",
    aiProvider: "ШІ-провайдер",
    language: "Мова інтерфейсу",
    apiKey: "API-ключ",
    apiKeyOptional: "API-ключ (необов'язково)",
    baseUrl: "Base URL",
    baseUrlHint: "/v1/chat/completions додається автоматично, якщо потрібно.",
    model: "Модель",
    modelTagOpenRouter: "Тег моделі",
    modelSuggestions: "Підказки моделей",
    ollamaSearchKey: "Ollama Web Search API key",
    ollamaSearchHint: "Використовується лише коли ввімкнено пошук Ollama. Потрібен безкоштовний ключ акаунта Ollama.",
    saveSettings: "Зберегти налаштування",
    settingsSaved: "Налаштування збережено",
    securityTitle: "Безпека",
    securityText: "Ключі зберігаються у localStorage браузера та надсилаються лише в локальний backend ComfyUI.",
    supportsImages: "Зображення надсилаються, якщо обрана модель має vision.",
    filesTitle: "Файли та моделі ComfyUI",
    refresh: "Оновити",
    loading: "Завантаження...",
    suggestWorkflow: "Запропонувати workflow",
    refreshHint: "Оновіть список, щоб завантажити локальні моделі, workflows і папки.",
    installedModels: "Встановлені моделі",
    savedWorkflows: "Збережені workflows",
    directoryStructure: "Структура папок",
    courseTitle: "Конструктор курсу для новачка",
    courseIntro: "Опишіть залізо та цілі. Асистент збере практичний план вивчення ComfyUI.",
    gpu: "GPU",
    vram: "VRAM",
    cpu: "CPU",
    ram: "RAM",
    os: "OS",
    experience: "Досвід",
    timeBudget: "Час на тиждень",
    goals: "Цілі",
    generateCourse: "Створити курс",
    courseChooseGoal: "Оберіть хоча б одну ціль.",
    back: "Назад",
    beginner: "Новачок",
    someExperience: "Є невеликий досвід",
    imageGoal: "Зображення",
    videoGoal: "Відео",
    audioGoal: "Аудіо",
    models3dGoal: "3D",
    loraGoal: "LoRA навчання",
    automationGoal: "Автоматизація",
    enhancerTitle: "Prompt Enhancer",
    enhancerIntro: "Введіть простий промпт. LLM розгорне його у детальний промпт із вагами, стилем, камерою, світлом, negative prompt і технічними параметрами.",
    enhancerInput: "Простий промпт",
    enhancerPlaceholder: "дівчина в лісі",
    enhance: "Покращити промпт",
    enhancedPrompt: "Розширений промпт",
    insertSelectedNode: "Вставити в обрану ноду",
    insertOk: "Вставлено в обрану ноду.",
    insertFail: "Спочатку оберіть ноду ComfyUI з текстовим/prompt-віджетом.",
  },
};

const QUICK_ACTIONS = {
  en: [
    { label: "Debug workflow", prompt: "Analyze my current workflow. Find broken links, missing nodes, risky settings, and exact fixes." },
    { label: "Improve workflow", prompt: "Suggest practical improvements for my current workflow, including models, sampler settings, and node structure." },
    { label: "Generate workflow", prompt: "Generate a complete ComfyUI text-to-image SDXL workflow JSON. Output only a ```json code block." },
    { label: "Explain graph", prompt: "Explain what the current workflow does, step by step, with the main data flow and important settings." },
    { label: "Model ideas", prompt: "Based on my installed models and current workflow, suggest 5 creative ComfyUI workflow ideas." },
    { label: "Fix errors", prompt: "Diagnose possible ComfyUI errors in this workflow and give precise fixes for each relevant node." },
  ],
  ru: [
    { label: "Проверить workflow", prompt: "Проанализируй текущий workflow. Найди сломанные связи, отсутствующие ноды, рискованные настройки и точные исправления." },
    { label: "Улучшить workflow", prompt: "Предложи практичные улучшения текущего workflow: модели, sampler-настройки и структуру нод." },
    { label: "Создать workflow", prompt: "Создай полный ComfyUI workflow JSON для text-to-image SDXL. Выведи только ```json code block." },
    { label: "Объяснить граф", prompt: "Объясни, что делает текущий workflow, по шагам: поток данных и важные настройки." },
    { label: "Идеи по моделям", prompt: "На основе установленных моделей и текущего workflow предложи 5 творческих идей для ComfyUI workflow." },
    { label: "Исправить ошибки", prompt: "Диагностируй возможные ошибки ComfyUI в этом workflow и дай точные исправления по нодам." },
  ],
  uk: [
    { label: "Перевірити workflow", prompt: "Проаналізуй поточний workflow. Знайди зламані зв'язки, відсутні ноди, ризикові налаштування та точні виправлення." },
    { label: "Покращити workflow", prompt: "Запропонуй практичні покращення поточного workflow: моделі, sampler-налаштування та структуру нод." },
    { label: "Створити workflow", prompt: "Створи повний ComfyUI workflow JSON для text-to-image SDXL. Виведи тільки ```json code block." },
    { label: "Пояснити граф", prompt: "Поясни, що робить поточний workflow, крок за кроком: потік даних і важливі налаштування." },
    { label: "Ідеї по моделях", prompt: "На основі встановлених моделей і поточного workflow запропонуй 5 творчих ідей для ComfyUI workflow." },
    { label: "Виправити помилки", prompt: "Діагностуй можливі помилки ComfyUI у цьому workflow і дай точні виправлення по нодах." },
  ],
};

const COURSE_GOALS = [
  { id: "image", labelKey: "imageGoal" },
  { id: "video", labelKey: "videoGoal" },
  { id: "audio", labelKey: "audioGoal" },
  { id: "3d", labelKey: "models3dGoal" },
  { id: "lora", labelKey: "loraGoal" },
  { id: "automation", labelKey: "automationGoal" },
];

const state = {
  provider: "openai",
  apiKey: "",
  baseUrl: "",
  model: "",
  language: "ru",
  ollamaSearchApiKey: "",
  settingsPerProvider: {},
  chats: [],
  activeChatId: "",
  view: "chat",
  isLoading: false,
  isEnhancing: false,
  isListening: false,
  abortController: null,
  pendingImages: [],
  filesData: null,
  modelsData: null,
  workflowFiles: [],
  enhancerInput: "",
  enhancerOutput: "",
  courseProfile: {
    gpu: "",
    vram: "",
    cpu: "",
    ram: "",
    os: "",
    experience: "beginner",
    timeBudget: "",
    goals: [],
  },
};

let rootEl = null;

function t(key) {
  return (I18N[state.language] && I18N[state.language][key]) || I18N.en[key] || key;
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getCurrentProvider() {
  return PROVIDERS.find(p => p.id === state.provider) || PROVIDERS[0];
}

function getPromptLanguageName() {
  const lang = LANGUAGES.find(l => l.id === state.language) || LANGUAGES[0];
  return lang.promptName;
}

function titleFromText(text) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return t("newChat");
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean;
}

function createChat(title = t("newChat"), messages = []) {
  return {
    id: uid("chat"),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages,
  };
}

function getActiveChat() {
  let chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) {
    chat = state.chats[0] || createChat();
    if (!state.chats.includes(chat)) state.chats.push(chat);
    state.activeChatId = chat.id;
  }
  return chat;
}

function getMessages() {
  return getActiveChat().messages;
}

function sanitizeMessageForSave(message) {
  const clean = { ...message };
  if (clean.images) {
    clean.images = clean.images.map(img => ({
      name: img.name,
      mime_type: img.mime_type,
      data_url: "",
      data: "",
      persisted: false,
    }));
  }
  delete clean.streaming;
  return clean;
}

function saveChats() {
  const chats = state.chats.map(chat => ({
    ...chat,
    messages: (chat.messages || []).slice(-MAX_SAVED_MESSAGES).map(sanitizeMessageForSave),
  }));
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  localStorage.setItem(ACTIVE_CHAT_KEY, state.activeChatId);
}

function saveSettings() {
  state.settingsPerProvider[state.provider] = {
    apiKey: state.apiKey,
    baseUrl: state.baseUrl,
    model: state.model,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    provider: state.provider,
    language: state.language,
    settingsPerProvider: state.settingsPerProvider,
    ollamaSearchApiKey: state.ollamaSearchApiKey,
  }));
}

function saveCourseProfile() {
  localStorage.setItem(COURSE_PROFILE_KEY, JSON.stringify(state.courseProfile));
}

function applyProviderSettings() {
  const saved = state.settingsPerProvider[state.provider] || {};
  const provider = getCurrentProvider();
  state.apiKey = saved.apiKey || "";
  state.baseUrl = saved.baseUrl || provider.baseUrl || "";
  state.model = saved.model || provider.defaultModel;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.settingsPerProvider = saved.settingsPerProvider || {};
      state.provider = saved.provider || "openai";
      state.language = saved.language || state.language;
      state.ollamaSearchApiKey = saved.ollamaSearchApiKey || "";
    }
  } catch (_) {}

  applyProviderSettings();

  try {
    const rawChats = localStorage.getItem(CHATS_KEY);
    if (rawChats) {
      state.chats = JSON.parse(rawChats).filter(chat => chat && chat.id);
      state.activeChatId = localStorage.getItem(ACTIVE_CHAT_KEY) || (state.chats[0] && state.chats[0].id) || "";
    }
  } catch (_) {}

  if (!state.chats.length) {
    try {
      const legacy = localStorage.getItem(LEGACY_HISTORY_KEY);
      const legacyMessages = legacy ? JSON.parse(legacy) : [];
      if (legacyMessages.length) {
        state.chats = [createChat("Imported chat", legacyMessages)];
      }
    } catch (_) {}
  }

  if (!state.chats.length) state.chats = [createChat()];
  if (!state.activeChatId) state.activeChatId = state.chats[0].id;

  try {
    const profile = localStorage.getItem(COURSE_PROFILE_KEY);
    if (profile) state.courseProfile = { ...state.courseProfile, ...JSON.parse(profile) };
  } catch (_) {}
}

function addSystemMessage(text) {
  const chat = getActiveChat();
  chat.messages.push({ id: uid("msg"), role: "system-note", content: text });
  chat.updatedAt = Date.now();
  saveChats();
}

function getCurrentWorkflowSummary() {
  try {
    const graph = app.graph;
    if (!graph || !graph._nodes) return "No workflow loaded.";

    const nodes = graph._nodes.map(node => {
      const widgets = (node.widgets || [])
        .map(w => `${w.name}: ${String(w.value).slice(0, 160)}`)
        .join(", ");
      return `- ${node.id}: ${node.type || node.title || "Node"}${widgets ? ` | ${widgets}` : ""}`;
    });

    const links = [];
    Object.values(graph.links || {}).forEach(link => {
      if (!link) return;
      links.push(`${link.origin_id}:${link.origin_slot} -> ${link.target_id}:${link.target_slot}`);
    });

    return [
      `Nodes: ${graph._nodes.length}`,
      nodes.slice(0, 80).join("\n"),
      links.length ? `\nLinks:\n${links.slice(0, 120).join("\n")}` : "",
    ].join("\n");
  } catch (e) {
    return `Could not read workflow: ${e.message}`;
  }
}

function getCurrentWorkflowJSON() {
  try {
    if (app.graph && typeof app.graph.serialize === "function") {
      return JSON.stringify(app.graph.serialize(), null, 2);
    }
  } catch (_) {}
  return "";
}

async function applyWorkflowFromJSON(jsonText) {
  try {
    const data = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
    await app.loadGraphData(data);
    return true;
  } catch (e) {
    console.error("[LLM Assistant] Apply workflow failed:", e);
    return false;
  }
}

function buildSystemPrompt(includeWorkflow = true, includeModels = false) {
  let sys = `You are an expert ComfyUI assistant embedded inside the ComfyUI interface.
You help users debug workflows, improve node graphs, choose models, write prompts, and generate valid workflow JSON.
Use the active chat history as ongoing context.
When generating ComfyUI workflow JSON, output only the JSON wrapped in a markdown json code block.
When suggesting node parameters, give concrete values.
Be practical, concise, and precise.
Always answer in ${getPromptLanguageName()}.`;

  if (includeWorkflow) {
    sys += `\n\n---\nCURRENT WORKFLOW SUMMARY\n${getCurrentWorkflowSummary()}\n---`;
  }

  if (includeModels && state.modelsData && state.modelsData.models) {
    const models = Object.entries(state.modelsData.models)
      .map(([category, files]) => `${category}: ${files.map(f => f.name).join(", ")}`)
      .join("\n");
    sys += `\n\n---\nINSTALLED MODELS\n${models}\n---`;
  }

  if (state.workflowFiles && state.workflowFiles.length) {
    const workflows = state.workflowFiles.map(w => `- ${w.name} (${w.node_count || "?"} nodes)`).join("\n");
    sys += `\n\n---\nSAVED WORKFLOWS\n${workflows}\n---`;
  }

  return sys;
}

function buildCoursePrompt(profile) {
  const goalLabels = (profile.goals || [])
    .map(id => {
      const goal = COURSE_GOALS.find(g => g.id === id);
      return goal ? t(goal.labelKey) : id;
    })
    .join(", ");
  const experience = profile.experience === "some" ? t("someExperience") : t("beginner");

  return `Create a beginner-friendly ComfyUI learning course.
Answer in ${getPromptLanguageName()}.

Hardware:
- GPU: ${profile.gpu || "not specified"}
- VRAM: ${profile.vram || "not specified"}
- CPU: ${profile.cpu || "not specified"}
- RAM: ${profile.ram || "not specified"}
- OS: ${profile.os || "not specified"}

Experience: ${experience}
Time per week: ${profile.timeBudget || "not specified"}
Goals: ${goalLabels || "not specified"}

Include hardware assessment, setup path, must-have custom nodes, weekly plan, practical exercises, VRAM-safe settings, common mistakes, and a final project.`;
}

function buildEnhancerMessages(simplePrompt) {
  return [
    {
      role: "system",
      content: `You are a ComfyUI prompt engineer. Expand short user ideas into production-ready image generation prompts.
Answer in ${getPromptLanguageName()}.
Return markdown with:
1. Positive prompt with weighted phrases using syntax like (phrase:1.2).
2. Negative prompt.
3. Style, composition, camera, lighting, color, mood.
4. Suggested technical parameters for ComfyUI: model family, sampler, steps, CFG, size, seed guidance.
Make it directly usable in a prompt node.`,
    },
    { role: "user", content: simplePrompt },
  ];
}

function toApiMessage(message) {
  const result = { role: message.role, content: message.content || "" };
  const usableImages = (message.images || []).filter(img => img.data_url || img.data);
  if (usableImages.length && message.role === "user") {
    result.images = usableImages.map(img => ({
      name: img.name,
      mime_type: img.mime_type,
      data_url: img.data_url,
      data: img.data,
    }));
  }
  return result;
}

function buildApiMessages(chat, assistantMessageId, includeWorkflow, includeModels) {
  const messages = [{ role: "system", content: buildSystemPrompt(includeWorkflow, includeModels) }];
  const history = chat.messages
    .filter(m => (m.role === "user" || m.role === "assistant") && m.id !== assistantMessageId)
    .slice(-MAX_CONTEXT_MESSAGES)
    .map(toApiMessage);
  messages.push(...history);
  return messages;
}

async function fetchFiles() {
  const resp = await fetch("/llm-assistant/files");
  return resp.json();
}

async function fetchModels() {
  const resp = await fetch("/llm-assistant/models-list");
  return resp.json();
}

async function fetchWorkflowFiles() {
  const resp = await fetch("/llm-assistant/workflow-files");
  return resp.json();
}

async function sendToLLMStream(messages, options = {}) {
  state.abortController = new AbortController();
  const payload = {
    provider: state.provider,
    api_key: state.apiKey,
    base_url: state.baseUrl,
    model: state.model,
    messages,
    max_tokens: options.maxTokens || 4096,
    web_search: !!options.webSearch,
    web_search_query: options.webSearchQuery || "",
    ollama_search_api_key: state.ollamaSearchApiKey,
    web_search_max_results: 5,
  };

  const resp = await fetch("/llm-assistant/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: state.abortController.signal,
  });

  if (!resp.ok) {
    let text = await resp.text();
    try {
      text = JSON.parse(text).error || text;
    } catch (_) {}
    throw new Error(text || "Streaming request failed.");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n").map(line => line.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") return;

        let data;
        try {
          data = JSON.parse(raw);
        } catch (_) {
          continue;
        }

        if (data.type === "error") throw new Error(data.error || "Provider error.");
        if (data.type === "delta" && data.delta) options.onDelta && options.onDelta(data.delta);
      }
    }
  }
}

function cancelGeneration() {
  if (state.abortController) state.abortController.abort();
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function appendParagraph(container, lines) {
  if (!lines.length) return;
  const p = document.createElement("p");
  p.innerHTML = inlineMarkdown(lines.join("\n"));
  container.appendChild(p);
}

function renderMarkdown(container, text) {
  container.innerHTML = "";
  const source = text || "";
  if (!source) {
    const dots = document.createElement("div");
    dots.className = "lla-thinking-dots";
    dots.innerHTML = `<span></span><span></span><span></span>`;
    container.appendChild(dots);
    return;
  }

  const parts = source.split(/(```[\s\S]*?```)/g);
  parts.forEach(part => {
    if (!part) return;
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "").trim() || "code";
      const code = lines.slice(1, lines.length - 1).join("\n");
      container.appendChild(createCodeBlock(code, lang));
      return;
    }

    const rows = part.replace(/\r\n/g, "\n").split("\n");
    let paragraph = [];
    let list = null;

    const flushList = () => {
      if (list) {
        container.appendChild(list);
        list = null;
      }
    };
    const flushParagraph = () => {
      appendParagraph(container, paragraph);
      paragraph = [];
    };

    rows.forEach(row => {
      const line = row.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = Math.min(heading[1].length + 2, 5);
        const h = document.createElement(`h${level}`);
        h.innerHTML = inlineMarkdown(heading[2]);
        container.appendChild(h);
        return;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+\.\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        const tag = numbered ? "ol" : "ul";
        if (!list || list.tagName.toLowerCase() !== tag) {
          flushList();
          list = document.createElement(tag);
        }
        const li = document.createElement("li");
        li.innerHTML = inlineMarkdown((bullet || numbered)[1]);
        list.appendChild(li);
        return;
      }

      paragraph.push(row);
    });

    flushParagraph();
    flushList();
  });
}

function createCodeBlock(code, lang) {
  const wrap = document.createElement("div");
  wrap.className = "lla-code-wrap";

  const header = document.createElement("div");
  header.className = "lla-code-header";
  const label = document.createElement("span");
  label.textContent = lang;
  const copyBtn = document.createElement("button");
  copyBtn.className = "lla-icon-btn";
  copyBtn.textContent = t("copy");
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = t("copied");
      setTimeout(() => { copyBtn.textContent = t("copy"); }, 1600);
    });
  };
  header.append(label, copyBtn);

  const pre = document.createElement("pre");
  pre.className = "lla-code-block";
  pre.textContent = code;

  wrap.append(header, pre);

  if (lang.toLowerCase() === "json" || (code.trim().startsWith("{") && code.includes('"nodes"'))) {
    const applyBtn = document.createElement("button");
    applyBtn.className = "lla-btn success";
    applyBtn.textContent = t("applyWorkflow");
    applyBtn.onclick = async () => {
      if (!confirm(t("applyConfirm"))) return;
      const ok = await applyWorkflowFromJSON(code);
      applyBtn.textContent = ok ? t("applied") : t("failed");
      setTimeout(() => { applyBtn.textContent = t("applyWorkflow"); }, 2000);
    };
    wrap.appendChild(applyBtn);
  }

  return wrap;
}

function updateStreamingBubble(messageId, content) {
  const bubble = document.querySelector(`[data-message-id="${messageId}"] .lla-msg-assistant`);
  if (bubble) renderMarkdown(bubble, content);
  scrollMessagesToBottom();
}

function scrollMessagesToBottom() {
  const area = document.getElementById("lla-messages");
  if (area) area.scrollTop = area.scrollHeight;
}

async function readImageFile(file) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: not an image.`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: image is larger than 4 MB.`);

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.split(",", 2)[1] || "";
  return { name: file.name, mime_type: file.type || "image/png", data_url: dataUrl, data: base64 };
}

async function sendMessage(text, options = {}) {
  if (state.isLoading || state.isEnhancing) return;
  const provider = getCurrentProvider();
  if (provider.requiresApiKey !== false && !state.apiKey) {
    addSystemMessage(t("needKey"));
    rerender();
    return;
  }

  const webSearch = !!options.webSearch;
  if (webSearch && !state.ollamaSearchApiKey) {
    addSystemMessage(t("needOllamaSearchKey"));
    rerender();
    return;
  }

  const chat = getActiveChat();
  const images = options.images || [];
  const userMessage = { id: uid("msg"), role: "user", content: text, images };
  const assistantMessage = { id: uid("msg"), role: "assistant", content: "", streaming: true };

  if (!chat.messages.length || chat.title === t("newChat")) chat.title = titleFromText(text);
  chat.messages.push(userMessage, assistantMessage);
  chat.updatedAt = Date.now();
  state.isLoading = true;
  state.pendingImages = [];
  saveChats();
  rerender();
  scrollMessagesToBottom();

  try {
    if (options.includeModels && !state.modelsData) {
      try {
        state.modelsData = await fetchModels();
      } catch (_) {}
    }
    const apiMessages = buildApiMessages(chat, assistantMessage.id, options.includeWorkflow, options.includeModels);
    await sendToLLMStream(apiMessages, {
      webSearch,
      webSearchQuery: text,
      onDelta: delta => {
        assistantMessage.content += delta;
        updateStreamingBubble(assistantMessage.id, assistantMessage.content);
      },
    });
  } catch (e) {
    if (e.name === "AbortError") {
      if (!assistantMessage.content) assistantMessage.content = t("stopped");
    } else {
      assistantMessage.role = "system-note";
      assistantMessage.content = `${t("error")}: ${e.message}`;
    }
  } finally {
    assistantMessage.streaming = false;
    state.isLoading = false;
    state.abortController = null;
    chat.updatedAt = Date.now();
    saveChats();
    rerender();
    scrollMessagesToBottom();
  }
}

async function runPromptEnhancer() {
  const prompt = state.enhancerInput.trim();
  if (!prompt || state.isLoading || state.isEnhancing) return;
  const provider = getCurrentProvider();
  if (provider.requiresApiKey !== false && !state.apiKey) {
    addSystemMessage(t("needKey"));
    state.view = "chat";
    rerender();
    return;
  }

  state.isEnhancing = true;
  state.enhancerOutput = "";
  rerender();

  try {
    await sendToLLMStream(buildEnhancerMessages(prompt), {
      maxTokens: 2048,
      onDelta: delta => {
        state.enhancerOutput += delta;
        const output = document.getElementById("lla-enhancer-output");
        if (output) renderMarkdown(output, state.enhancerOutput);
      },
    });
  } catch (e) {
    if (e.name === "AbortError") {
      state.enhancerOutput = t("stopped");
    } else {
      state.enhancerOutput = `${t("error")}: ${e.message}`;
    }
  } finally {
    state.isEnhancing = false;
    state.abortController = null;
    rerender();
  }
}

function getSelectedNodes() {
  const selected = app.canvas && app.canvas.selected_nodes ? Object.values(app.canvas.selected_nodes) : [];
  if (selected.length) return selected;
  if (app.canvas && app.canvas.selected_node) return [app.canvas.selected_node];
  if (app.graph && app.graph._nodes) {
    return app.graph._nodes.filter(node => node.is_selected || node.selected || (node.flags && node.flags.selected));
  }
  return [];
}

function insertPromptIntoSelectedNode(text) {
  const node = getSelectedNodes()[0];
  if (!node || !node.widgets) return false;
  const candidates = ["positive", "prompt", "text", "caption", "conditioning", "string"];
  const widget = node.widgets.find(w => {
    const name = String(w.name || "").toLowerCase();
    return typeof w.value === "string" && candidates.some(key => name.includes(key));
  }) || node.widgets.find(w => typeof w.value === "string");

  if (!widget) return false;
  widget.value = text;
  if (typeof widget.callback === "function") widget.callback(text, app.canvas, node);
  if (app.graph && typeof app.graph.setDirtyCanvas === "function") app.graph.setDirtyCanvas(true, true);
  if (app.canvas && typeof app.canvas.setDirty === "function") app.canvas.setDirty(true, true);
  return true;
}

function rerender() {
  if (rootEl) renderSidebar(rootEl);
}

function injectStyles() {
  if (document.getElementById("llm-assistant-styles")) return;
  const style = document.createElement("style");
  style.id = "llm-assistant-styles";
  style.textContent = `
    :root {
      --lla-bg: #202020;
      --lla-panel: #2a2a2a;
      --lla-panel-2: #303030;
      --lla-panel-3: #383838;
      --lla-border: #4a4a4a;
      --lla-text: #dddddd;
      --lla-muted: #a8a8a8;
      --lla-dim: #787878;
      --lla-accent: #ff7f22;
      --lla-accent-hover: #ff9342;
      --lla-danger: #d85b53;
      --lla-success: #77b255;
    }
    .lla-root, .lla-root * { box-sizing: border-box; }
    .lla-btn, .lla-icon-btn {
      background: var(--lla-panel-3);
      color: var(--lla-text);
      border: 1px solid var(--lla-border);
      border-radius: 4px;
      padding: 6px 10px;
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      line-height: 1.2;
    }
    .lla-btn:hover, .lla-icon-btn:hover { border-color: var(--lla-accent); background: #444; }
    .lla-btn.primary { background: var(--lla-accent); color: #1c1c1c; border-color: var(--lla-accent); font-weight: 700; }
    .lla-btn.primary:hover { background: var(--lla-accent-hover); }
    .lla-btn.danger { color: #ffd2cf; border-color: #8e3f39; background: #4a2927; }
    .lla-btn.success { color: #eaffdf; border-color: #4f7840; background: #33442c; }
    .lla-btn:disabled, .lla-icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .lla-input, .lla-select, .lla-textarea {
      background: #1b1b1b;
      color: var(--lla-text);
      border: 1px solid var(--lla-border);
      border-radius: 4px;
      padding: 8px 9px;
      width: 100%;
      font: inherit;
      font-size: 12px;
    }
    .lla-textarea { resize: vertical; line-height: 1.45; min-height: 64px; }
    .lla-input:focus, .lla-select:focus, .lla-textarea:focus { outline: none; border-color: var(--lla-accent); }
    .lla-label { color: var(--lla-muted); font-size: 11px; margin-bottom: 4px; display: block; }
    .lla-section-title {
      color: var(--lla-accent);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
      padding: 4px 0;
    }
    .lla-topbar {
      padding: 8px 10px;
      background: var(--lla-panel);
      border-bottom: 1px solid var(--lla-border);
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .lla-tab {
      padding: 5px 8px;
      border-radius: 4px;
      color: var(--lla-muted);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 12px;
    }
    .lla-tab.active { color: #1c1c1c; background: var(--lla-accent); border-color: var(--lla-accent); font-weight: 700; }
    .lla-badge {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      border: 1px solid var(--lla-border);
      border-radius: 4px;
      background: #242424;
      color: var(--lla-muted);
      padding: 3px 6px;
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lla-chat-row { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--lla-border); background: #242424; }
    .lla-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 8px 10px; border-bottom: 1px solid var(--lla-border); background: #252525; }
    .lla-quick-btn { text-align: left; min-height: 32px; }
    .lla-msg-wrap { display: flex; flex-direction: column; gap: 3px; }
    .lla-msg-label { color: var(--lla-dim); font-size: 10px; }
    .lla-msg-user, .lla-msg-assistant, .lla-msg-system {
      border: 1px solid var(--lla-border);
      border-radius: 6px;
      padding: 8px 10px;
      word-break: break-word;
      overflow-wrap: anywhere;
      line-height: 1.5;
      font-size: 12px;
    }
    .lla-msg-user { margin-left: 18px; background: #333333; border-color: #5a5a5a; }
    .lla-msg-assistant { margin-right: 18px; background: #282828; }
    .lla-msg-system { background: #332f22; color: #ead6a6; border-color: #67592d; font-style: italic; }
    .lla-msg-assistant p { margin: 0 0 8px; white-space: pre-wrap; }
    .lla-msg-assistant p:last-child { margin-bottom: 0; }
    .lla-msg-assistant ul, .lla-msg-assistant ol { margin: 5px 0 8px 18px; padding: 0; }
    .lla-msg-assistant li { margin: 3px 0; }
    .lla-msg-assistant h3, .lla-msg-assistant h4, .lla-msg-assistant h5 { margin: 8px 0 5px; color: #f0f0f0; font-size: 13px; }
    .lla-msg-assistant code { background: #171717; border: 1px solid #3e3e3e; border-radius: 3px; padding: 1px 4px; font-family: Consolas, monospace; font-size: 11px; }
    .lla-code-wrap { margin: 6px 0; }
    .lla-code-header { display: flex; justify-content: space-between; align-items: center; background: #1b1b1b; border: 1px solid var(--lla-border); border-bottom: 0; border-radius: 4px 4px 0 0; padding: 4px 6px; color: var(--lla-muted); font-size: 10px; }
    .lla-code-block { margin: 0; padding: 8px; overflow-x: auto; white-space: pre; background: #151515; color: #e8e8e8; border: 1px solid var(--lla-border); border-radius: 0 0 4px 4px; font-family: Consolas, monospace; font-size: 11px; }
    .lla-loading-bar { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-top: 1px solid var(--lla-border); background: #252525; color: var(--lla-muted); }
    .lla-thinking-dots { display: inline-flex; gap: 4px; align-items: center; min-height: 18px; }
    .lla-thinking-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--lla-accent); opacity: .35; animation: lla-dot 1s infinite ease-in-out; }
    .lla-thinking-dots span:nth-child(2) { animation-delay: .15s; }
    .lla-thinking-dots span:nth-child(3) { animation-delay: .3s; }
    @keyframes lla-dot { 0%, 80%, 100% { transform: translateY(0); opacity: .35; } 40% { transform: translateY(-3px); opacity: 1; } }
    .lla-image-grid { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .lla-thumb { width: 56px; height: 56px; border: 1px solid var(--lla-border); border-radius: 4px; object-fit: cover; background: #111; }
    .lla-attach-chip { display: flex; align-items: center; gap: 6px; padding: 4px 6px; background: #242424; border: 1px solid var(--lla-border); border-radius: 4px; font-size: 11px; color: var(--lla-muted); }
    .lla-form-panel { padding: 12px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
    .lla-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .lla-info { border: 1px solid var(--lla-border); border-radius: 4px; background: #242424; color: var(--lla-muted); padding: 8px; font-size: 11px; line-height: 1.5; }
    .lla-file-item, .lla-file-folder { padding: 5px 10px; font-size: 11px; color: var(--lla-muted); border-bottom: 1px solid #333; }
    .lla-file-folder { color: #e6e6e6; font-weight: 700; cursor: pointer; }
    .lla-scroll { overflow-y: auto; flex: 1; }
    .lla-hidden-file { display: none; }
    .lla-input-row { display: grid; grid-template-columns: auto auto 1fr auto; gap: 6px; align-items: end; }
    .lla-options-row { display: flex; gap: 10px; margin-top: 7px; align-items: center; flex-wrap: wrap; color: var(--lla-muted); font-size: 11px; }
    .lla-options-row label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
    .lla-output-box { min-height: 160px; border: 1px solid var(--lla-border); border-radius: 4px; background: #242424; padding: 10px; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #1a1a1a; }
    ::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #666; }
  `;
  document.head.appendChild(style);
}

function renderSidebar(container) {
  rootEl = container;
  injectStyles();
  container.innerHTML = "";
  container.className = "lla-root";
  container.style.cssText = `
    display:flex;
    flex-direction:column;
    height:100%;
    min-height:0;
    background:var(--lla-bg);
    color:var(--lla-text);
    font-family: Inter, Segoe UI, system-ui, sans-serif;
    font-size:13px;
    overflow:hidden;
  `;

  container.appendChild(createHeader());
  const body = document.createElement("div");
  body.style.cssText = "flex:1; min-height:0; display:flex; flex-direction:column;";

  if (state.view === "settings") body.appendChild(createSettingsPanel());
  else if (state.view === "files") body.appendChild(createFilesBrowser());
  else if (state.view === "course") body.appendChild(createCoursePlannerPanel());
  else if (state.view === "enhancer") body.appendChild(createPromptEnhancerPanel());
  else body.appendChild(createChatPanel());

  container.appendChild(body);
}

function createHeader() {
  const header = document.createElement("div");
  header.style.cssText = "background:var(--lla-panel); border-bottom:1px solid var(--lla-border); flex-shrink:0;";

  const top = document.createElement("div");
  top.className = "lla-topbar";
  const title = document.createElement("div");
  title.style.cssText = "font-weight:800; color:#f0f0f0; margin-right:auto;";
  title.textContent = `LLM Assistant ${VERSION}`;

  const tabs = [
    ["chat", t("chat")],
    ["enhancer", t("enhancer")],
    ["files", t("files")],
    ["course", t("coursePlanner")],
    ["settings", t("settings")],
  ];

  top.appendChild(title);
  tabs.forEach(([id, label]) => {
    const btn = document.createElement("button");
    btn.className = `lla-tab${state.view === id ? " active" : ""}`;
    btn.textContent = label;
    btn.onclick = () => {
      state.view = id;
      rerender();
    };
    top.appendChild(btn);
  });

  const meta = document.createElement("div");
  meta.style.cssText = "display:flex; gap:5px; padding:0 10px 8px; flex-wrap:wrap;";
  const provider = getCurrentProvider();
  const providerBadge = document.createElement("span");
  providerBadge.className = "lla-badge";
  providerBadge.textContent = provider.label;
  const modelBadge = document.createElement("span");
  modelBadge.className = "lla-badge";
  modelBadge.textContent = state.model || provider.defaultModel;
  const keyBadge = document.createElement("span");
  keyBadge.className = "lla-badge";
  keyBadge.textContent = provider.requiresApiKey === false ? "local" : (state.apiKey ? "key set" : "no key");
  keyBadge.style.borderColor = provider.requiresApiKey === false || state.apiKey ? "#4f7840" : "#8e3f39";

  meta.append(providerBadge, modelBadge, keyBadge);
  header.append(top, meta);
  return header;
}

function createChatPanel() {
  const panel = document.createElement("div");
  panel.style.cssText = "display:flex; flex-direction:column; min-height:0; height:100%;";

  panel.appendChild(createChatSelector());
  panel.appendChild(createQuickActions());

  const messagesArea = document.createElement("div");
  messagesArea.id = "lla-messages";
  messagesArea.className = "lla-scroll";
  messagesArea.style.cssText += "padding:9px 10px; display:flex; flex-direction:column; gap:8px;";

  const messages = getMessages();
  if (!messages.length) messagesArea.appendChild(createWelcome());
  else messages.forEach(msg => messagesArea.appendChild(createMessageBubble(msg)));
  panel.appendChild(messagesArea);

  if (state.isLoading) panel.appendChild(createLoadingBar());
  panel.appendChild(createInputArea());
  setTimeout(scrollMessagesToBottom, 30);
  return panel;
}

function createChatSelector() {
  const row = document.createElement("div");
  row.className = "lla-chat-row";

  const select = document.createElement("select");
  select.className = "lla-select";
  state.chats
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .forEach(chat => {
      const opt = document.createElement("option");
      opt.value = chat.id;
      opt.textContent = chat.title || t("newChat");
      if (chat.id === state.activeChatId) opt.selected = true;
      select.appendChild(opt);
    });
  select.onchange = () => {
    state.activeChatId = select.value;
    saveChats();
    rerender();
  };

  const newBtn = document.createElement("button");
  newBtn.className = "lla-btn";
  newBtn.textContent = "+";
  newBtn.title = t("newChat");
  newBtn.onclick = () => {
    const chat = createChat();
    state.chats.push(chat);
    state.activeChatId = chat.id;
    saveChats();
    rerender();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "lla-btn danger";
  deleteBtn.textContent = "x";
  deleteBtn.title = t("deleteChat");
  deleteBtn.onclick = () => {
    if (!confirm(t("deleteChatConfirm"))) return;
    state.chats = state.chats.filter(c => c.id !== state.activeChatId);
    if (!state.chats.length) state.chats = [createChat()];
    state.activeChatId = state.chats[0].id;
    saveChats();
    rerender();
  };

  row.append(select, newBtn, deleteBtn);
  return row;
}

function createWelcome() {
  const welcome = document.createElement("div");
  welcome.style.cssText = "text-align:center; padding:28px 12px; color:var(--lla-muted);";
  const title = document.createElement("div");
  title.style.cssText = "font-weight:800; color:#f0f0f0; margin-bottom:6px;";
  title.textContent = t("welcomeTitle");
  const text = document.createElement("div");
  text.style.cssText = "font-size:12px; line-height:1.5;";
  text.textContent = t("welcomeText");
  welcome.append(title, text);
  return welcome;
}

function createQuickActions() {
  const wrap = document.createElement("div");
  wrap.className = "lla-quick-grid";
  const actions = QUICK_ACTIONS[state.language] || QUICK_ACTIONS.en;
  actions.forEach(({ label, prompt }) => {
    const btn = document.createElement("button");
    btn.className = "lla-btn lla-quick-btn";
    btn.textContent = label;
    btn.disabled = state.isLoading || state.isEnhancing;
    btn.onclick = () => sendMessage(prompt, readChatOptions());
    wrap.appendChild(btn);
  });
  return wrap;
}

function createLoadingBar() {
  const bar = document.createElement("div");
  bar.className = "lla-loading-bar";
  const dots = document.createElement("div");
  dots.className = "lla-thinking-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";
  const label = document.createElement("span");
  label.textContent = t("thinking");
  label.style.marginRight = "auto";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "lla-btn danger";
  cancelBtn.textContent = t("cancel");
  cancelBtn.onclick = cancelGeneration;
  bar.append(dots, label, cancelBtn);
  return bar;
}

function readChatOptions() {
  const includeWorkflow = document.getElementById("lla-include-workflow");
  const includeModels = document.getElementById("lla-include-models");
  const webSearch = document.getElementById("lla-web-search");
  return {
    includeWorkflow: includeWorkflow ? includeWorkflow.checked : true,
    includeModels: includeModels ? includeModels.checked : false,
    webSearch: webSearch ? webSearch.checked : false,
    images: state.pendingImages.slice(),
  };
}

function createInputArea() {
  const wrap = document.createElement("div");
  wrap.style.cssText = "padding:8px 10px; border-top:1px solid var(--lla-border); background:#242424; flex-shrink:0;";

  const row = document.createElement("div");
  row.className = "lla-input-row";

  const attachBtn = document.createElement("button");
  attachBtn.className = "lla-btn";
  attachBtn.textContent = "img";
  attachBtn.title = t("attachImage");
  attachBtn.disabled = state.pendingImages.length >= MAX_IMAGES || state.isLoading;

  const fileInput = document.createElement("input");
  fileInput.className = "lla-hidden-file";
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.multiple = true;
  attachBtn.onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    try {
      const files = Array.from(fileInput.files || []).slice(0, MAX_IMAGES - state.pendingImages.length);
      for (const file of files) state.pendingImages.push(await readImageFile(file));
    } catch (e) {
      addSystemMessage(`${t("error")}: ${e.message}`);
    }
    fileInput.value = "";
    rerender();
  };

  const micBtn = document.createElement("button");
  micBtn.className = "lla-btn";
  micBtn.textContent = state.isListening ? "stop" : "mic";
  micBtn.title = t("voiceInput");
  micBtn.disabled = state.isLoading;

  const textarea = document.createElement("textarea");
  textarea.className = "lla-textarea";
  textarea.placeholder = t("inputPlaceholder");
  textarea.rows = 3;
  textarea.onkeydown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  micBtn.onclick = () => startVoiceInput(textarea);

  const sendBtn = document.createElement("button");
  sendBtn.className = "lla-btn primary";
  sendBtn.textContent = t("send");
  sendBtn.disabled = state.isLoading;
  sendBtn.onclick = doSend;

  function doSend() {
    const text = textarea.value.trim();
    if (!text && !state.pendingImages.length) return;
    textarea.value = "";
    sendMessage(text || "[image]", readChatOptions());
  }

  row.append(attachBtn, micBtn, textarea, sendBtn, fileInput);
  wrap.appendChild(row);

  if (state.pendingImages.length) wrap.appendChild(createPendingImages());

  const options = document.createElement("div");
  options.className = "lla-options-row";
  options.append(
    checkbox("lla-include-workflow", t("includeWorkflow"), true),
    checkbox("lla-include-models", t("includeModels"), false),
    checkbox("lla-web-search", t("webSearch"), false)
  );
  wrap.appendChild(options);
  return wrap;
}

function checkbox(id, labelText, checked) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = id;
  input.checked = checked;
  label.append(input, document.createTextNode(labelText));
  return label;
}

function createPendingImages() {
  const wrap = document.createElement("div");
  wrap.className = "lla-image-grid";
  state.pendingImages.forEach((img, index) => {
    const chip = document.createElement("div");
    chip.className = "lla-attach-chip";
    const thumb = document.createElement("img");
    thumb.className = "lla-thumb";
    thumb.src = img.data_url;
    const name = document.createElement("span");
    name.textContent = img.name || `${t("imagesAttached")} ${index + 1}`;
    const remove = document.createElement("button");
    remove.className = "lla-icon-btn";
    remove.textContent = "x";
    remove.title = t("remove");
    remove.onclick = () => {
      state.pendingImages.splice(index, 1);
      rerender();
    };
    chip.append(thumb, name, remove);
    wrap.appendChild(chip);
  });
  return wrap;
}

function startVoiceInput(textarea) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    addSystemMessage("Web Speech API is not available in this browser.");
    rerender();
    return;
  }

  const recognition = new Recognition();
  recognition.lang = state.language === "ru" ? "ru-RU" : state.language === "uk" ? "uk-UA" : "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  state.isListening = true;
  micStatusUpdate();

  let finalText = "";
  recognition.onresult = event => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interim += transcript;
    }
    textarea.value = `${textarea.value.replace(/\s*\[${t("listening")}.*$/, "")} ${finalText || interim}`.trim();
  };
  recognition.onerror = () => {
    state.isListening = false;
    rerender();
  };
  recognition.onend = () => {
    state.isListening = false;
    rerender();
  };
  recognition.start();
}

function micStatusUpdate() {
  const btn = document.querySelector("button[title='" + t("voiceInput").replace(/'/g, "\\'") + "']");
  if (btn) btn.textContent = state.isListening ? t("listening") : "mic";
}

function createMessageBubble(msg) {
  const wrap = document.createElement("div");
  wrap.className = "lla-msg-wrap";
  wrap.dataset.messageId = msg.id || "";

  const label = document.createElement("div");
  label.className = "lla-msg-label";

  if (msg.role === "user") {
    label.style.textAlign = "right";
    label.textContent = t("you");
    const bubble = document.createElement("div");
    bubble.className = "lla-msg-user";
    bubble.textContent = msg.content || "";
    if (msg.images && msg.images.length) bubble.appendChild(createMessageImages(msg.images));
    wrap.append(label, bubble);
  } else if (msg.role === "assistant") {
    label.textContent = t("assistant");
    const bubble = document.createElement("div");
    bubble.className = "lla-msg-assistant";
    renderMarkdown(bubble, msg.content || "");
    wrap.append(label, bubble);
  } else {
    label.textContent = t("system");
    const bubble = document.createElement("div");
    bubble.className = "lla-msg-system";
    bubble.textContent = msg.content || "";
    wrap.append(label, bubble);
  }

  return wrap;
}

function createMessageImages(images) {
  const grid = document.createElement("div");
  grid.className = "lla-image-grid";
  images.forEach(img => {
    if (img.data_url) {
      const thumb = document.createElement("img");
      thumb.className = "lla-thumb";
      thumb.src = img.data_url;
      thumb.title = img.name || "image";
      grid.appendChild(thumb);
    } else {
      const chip = document.createElement("span");
      chip.className = "lla-attach-chip";
      chip.textContent = img.name || "image";
      grid.appendChild(chip);
    }
  });
  return grid;
}

function createSettingsPanel() {
  const panel = document.createElement("div");
  panel.className = "lla-form-panel";
  const currentProvider = getCurrentProvider();

  const title = document.createElement("div");
  title.className = "lla-section-title";
  title.textContent = t("settingsTitle");

  const language = selectField(t("language"), LANGUAGES.map(l => [l.id, l.label]), state.language, value => {
    state.language = value;
    saveSettings();
    rerender();
  });

  const provider = selectField(t("aiProvider"), PROVIDERS.map(p => [p.id, p.label]), state.provider, value => {
    saveSettings();
    state.provider = value;
    applyProviderSettings();
    rerender();
  });

  const key = inputField(currentProvider.requiresApiKey === false ? t("apiKeyOptional") : t("apiKey"), state.apiKey, currentProvider.placeholder, value => {
    state.apiKey = value;
  }, "password");

  const fields = [title, language, provider, key];

  if (currentProvider.supportsBaseUrl) {
    fields.push(inputField(t("baseUrl"), state.baseUrl, currentProvider.baseUrl || "", value => {
      state.baseUrl = value;
    }));
    const hint = document.createElement("div");
    hint.className = "lla-info";
    hint.textContent = t("baseUrlHint");
    fields.push(hint);
  }

  fields.push(inputField(state.provider === "openrouter" ? t("modelTagOpenRouter") : t("model"), state.model, currentProvider.defaultModel, value => {
    state.model = value;
  }));

  const chips = document.createElement("div");
  chips.className = "lla-info";
  const chipsTitle = document.createElement("div");
  chipsTitle.style.marginBottom = "6px";
  chipsTitle.textContent = t("modelSuggestions");
  chips.appendChild(chipsTitle);
  (MODEL_SUGGESTIONS[state.provider] || []).forEach(model => {
    const chip = document.createElement("button");
    chip.className = "lla-btn";
    chip.style.margin = "0 4px 4px 0";
    chip.textContent = model;
    chip.onclick = () => {
      state.model = model;
      rerender();
    };
    chips.appendChild(chip);
  });
  fields.push(chips);

  fields.push(inputField(t("ollamaSearchKey"), state.ollamaSearchApiKey, "ollama_...", value => {
    state.ollamaSearchApiKey = value;
  }, "password"));

  const searchHint = document.createElement("div");
  searchHint.className = "lla-info";
  searchHint.textContent = t("ollamaSearchHint");
  fields.push(searchHint);

  const visionHint = document.createElement("div");
  visionHint.className = "lla-info";
  visionHint.textContent = t("supportsImages");
  fields.push(visionHint);

  const saveBtn = document.createElement("button");
  saveBtn.className = "lla-btn primary";
  saveBtn.textContent = t("saveSettings");
  saveBtn.onclick = () => {
    saveSettings();
    addSystemMessage(`${t("settingsSaved")}.`);
    state.view = "chat";
    rerender();
  };
  fields.push(saveBtn);

  const security = document.createElement("div");
  security.className = "lla-info";
  security.innerHTML = `<strong>${escapeHtml(t("securityTitle"))}</strong><br>${escapeHtml(t("securityText"))}`;
  fields.push(security);

  panel.append(...fields);
  return panel;
}

function inputField(labelText, value, placeholder, onInput, type = "text") {
  const wrap = document.createElement("div");
  const label = document.createElement("label");
  label.className = "lla-label";
  label.textContent = labelText;
  const input = document.createElement("input");
  input.className = "lla-input";
  input.type = type;
  input.value = value || "";
  input.placeholder = placeholder || "";
  input.oninput = () => onInput(input.value);
  wrap.append(label, input);
  return wrap;
}

function selectField(labelText, options, value, onChange) {
  const wrap = document.createElement("div");
  const label = document.createElement("label");
  label.className = "lla-label";
  label.textContent = labelText;
  const select = document.createElement("select");
  select.className = "lla-select";
  options.forEach(([id, labelValue]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = labelValue;
    if (id === value) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = () => onChange(select.value);
  wrap.append(label, select);
  return wrap;
}

function createFilesBrowser() {
  const panel = document.createElement("div");
  panel.style.cssText = "display:flex; flex-direction:column; min-height:0; height:100%;";

  const buttons = document.createElement("div");
  buttons.className = "lla-topbar";
  const title = document.createElement("div");
  title.className = "lla-section-title";
  title.style.marginRight = "auto";
  title.textContent = t("filesTitle");

  const refresh = document.createElement("button");
  refresh.className = "lla-btn";
  refresh.textContent = t("refresh");
  refresh.onclick = async () => {
    refresh.disabled = true;
    refresh.textContent = t("loading");
    try {
      const [files, models, workflows] = await Promise.all([fetchFiles(), fetchModels(), fetchWorkflowFiles()]);
      state.filesData = files;
      state.modelsData = models;
      state.workflowFiles = workflows.workflows || [];
    } catch (e) {
      addSystemMessage(`${t("error")}: ${e.message}`);
    }
    rerender();
  };

  const suggest = document.createElement("button");
  suggest.className = "lla-btn primary";
  suggest.textContent = t("suggestWorkflow");
  suggest.onclick = async () => {
    state.view = "chat";
    const modelSummary = state.modelsData && state.modelsData.models
      ? Object.entries(state.modelsData.models).map(([cat, files]) => `${cat}: ${files.map(f => f.name).join(", ")}`).join("\n")
      : "No model list loaded.";
    await sendMessage(`Suggest 3 useful ComfyUI workflow ideas based on these installed models:\n\n${modelSummary}`, { includeWorkflow: false, includeModels: true, webSearch: false, images: [] });
  };
  buttons.append(title, refresh, suggest);
  panel.appendChild(buttons);

  const scroll = document.createElement("div");
  scroll.className = "lla-scroll";
  scroll.style.padding = "8px 0";

  if (!state.filesData && !state.modelsData) {
    const hint = document.createElement("div");
    hint.className = "lla-info";
    hint.style.margin = "12px";
    hint.textContent = t("refreshHint");
    scroll.appendChild(hint);
  } else {
    if (state.modelsData && state.modelsData.models) {
      appendSection(scroll, t("installedModels"));
      Object.entries(state.modelsData.models).forEach(([cat, files]) => {
        const folder = document.createElement("div");
        folder.className = "lla-file-folder";
        folder.textContent = `${cat} (${files.length})`;
        scroll.appendChild(folder);
        files.slice(0, 80).forEach(file => {
          const item = document.createElement("div");
          item.className = "lla-file-item";
          item.textContent = `${file.name} - ${file.size_mb} MB`;
          scroll.appendChild(item);
        });
      });
    }

    if (state.workflowFiles && state.workflowFiles.length) {
      appendSection(scroll, t("savedWorkflows"));
      state.workflowFiles.forEach(wf => {
        const item = document.createElement("div");
        item.className = "lla-file-item";
        item.textContent = `${wf.name} - ${wf.node_count || "?"} nodes`;
        scroll.appendChild(item);
      });
    }

    if (state.filesData && state.filesData.sections) {
      appendSection(scroll, t("directoryStructure"));
      Object.entries(state.filesData.sections).forEach(([name, section]) => {
        const folder = document.createElement("div");
        folder.className = "lla-file-folder";
        folder.textContent = `${name}: ${section.path || ""}`;
        scroll.appendChild(folder);
      });
    }
  }

  panel.appendChild(scroll);
  return panel;
}

function appendSection(container, title) {
  const el = document.createElement("div");
  el.className = "lla-section-title";
  el.style.padding = "10px 10px 5px";
  el.textContent = title;
  container.appendChild(el);
}

function createCoursePlannerPanel() {
  const panel = document.createElement("div");
  panel.className = "lla-form-panel";

  const title = document.createElement("div");
  title.className = "lla-section-title";
  title.textContent = t("courseTitle");
  const intro = document.createElement("div");
  intro.className = "lla-info";
  intro.textContent = t("courseIntro");

  const grid = document.createElement("div");
  grid.className = "lla-field-grid";
  [
    ["gpu", "RTX 4060 / RX 7800 XT"],
    ["vram", "8 GB / 12 GB / 24 GB"],
    ["cpu", "Ryzen 5 / Core i7"],
    ["ram", "16 GB / 32 GB"],
    ["os", "Windows / Linux"],
    ["timeBudget", "3-5 hours"],
  ].forEach(([key, placeholder]) => {
    grid.appendChild(inputField(t(key), state.courseProfile[key], placeholder, value => {
      state.courseProfile[key] = value;
      saveCourseProfile();
    }));
  });

  const experience = selectField(t("experience"), [
    ["beginner", t("beginner")],
    ["some", t("someExperience")],
  ], state.courseProfile.experience, value => {
    state.courseProfile.experience = value;
    saveCourseProfile();
  });

  const goalsTitle = document.createElement("div");
  goalsTitle.className = "lla-label";
  goalsTitle.textContent = t("goals");
  const goals = document.createElement("div");
  goals.className = "lla-field-grid";
  COURSE_GOALS.forEach(goal => {
    const label = document.createElement("label");
    label.className = "lla-info";
    label.style.cursor = "pointer";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.courseProfile.goals.includes(goal.id);
    input.onchange = () => {
      const next = new Set(state.courseProfile.goals);
      if (input.checked) next.add(goal.id);
      else next.delete(goal.id);
      state.courseProfile.goals = Array.from(next);
      saveCourseProfile();
    };
    label.append(input, document.createTextNode(` ${t(goal.labelKey)}`));
    goals.appendChild(label);
  });

  const generate = document.createElement("button");
  generate.className = "lla-btn primary";
  generate.textContent = t("generateCourse");
  generate.onclick = async () => {
    if (!state.courseProfile.goals.length) {
      addSystemMessage(t("courseChooseGoal"));
      state.view = "chat";
      rerender();
      return;
    }
    saveCourseProfile();
    state.view = "chat";
    await sendMessage(buildCoursePrompt(state.courseProfile), { includeWorkflow: false, includeModels: true, webSearch: false, images: [] });
  };

  panel.append(title, intro, grid, experience, goalsTitle, goals, generate);
  return panel;
}

function createPromptEnhancerPanel() {
  const panel = document.createElement("div");
  panel.className = "lla-form-panel";

  const title = document.createElement("div");
  title.className = "lla-section-title";
  title.textContent = t("enhancerTitle");
  const intro = document.createElement("div");
  intro.className = "lla-info";
  intro.textContent = t("enhancerIntro");

  const label = document.createElement("label");
  label.className = "lla-label";
  label.textContent = t("enhancerInput");
  const input = document.createElement("textarea");
  input.className = "lla-textarea";
  input.placeholder = t("enhancerPlaceholder");
  input.value = state.enhancerInput;
  input.style.minHeight = "84px";
  input.oninput = () => { state.enhancerInput = input.value; };

  const row = document.createElement("div");
  row.style.cssText = "display:flex; gap:8px;";
  const run = document.createElement("button");
  run.className = "lla-btn primary";
  run.textContent = state.isEnhancing ? t("thinking") : t("enhance");
  run.disabled = state.isEnhancing || state.isLoading;
  run.onclick = runPromptEnhancer;
  const cancel = document.createElement("button");
  cancel.className = "lla-btn danger";
  cancel.textContent = t("cancel");
  cancel.disabled = !state.isEnhancing;
  cancel.onclick = cancelGeneration;
  row.append(run, cancel);

  const outTitle = document.createElement("div");
  outTitle.className = "lla-section-title";
  outTitle.textContent = t("enhancedPrompt");
  const output = document.createElement("div");
  output.id = "lla-enhancer-output";
  output.className = "lla-output-box lla-msg-assistant";
  renderMarkdown(output, state.enhancerOutput || "");

  const actionRow = document.createElement("div");
  actionRow.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";
  const copy = document.createElement("button");
  copy.className = "lla-btn";
  copy.textContent = t("copy");
  copy.disabled = !state.enhancerOutput;
  copy.onclick = () => navigator.clipboard.writeText(state.enhancerOutput);
  const insert = document.createElement("button");
  insert.className = "lla-btn success";
  insert.textContent = t("insertSelectedNode");
  insert.disabled = !state.enhancerOutput;
  insert.onclick = () => {
    const ok = insertPromptIntoSelectedNode(state.enhancerOutput);
    addSystemMessage(ok ? t("insertOk") : t("insertFail"));
    state.view = ok ? "chat" : "enhancer";
    rerender();
  };
  actionRow.append(copy, insert);

  panel.append(title, intro, label, input, row, outTitle, output, actionRow);
  return panel;
}

function createFloatingPanel() {
  if (document.getElementById("lla-floating-panel")) return;

  const toggle = document.createElement("button");
  toggle.id = "lla-toggle-btn";
  toggle.className = "lla-btn primary";
  toggle.textContent = "AI";
  toggle.title = "LLM Assistant";
  toggle.style.cssText = `
    position:fixed;
    top:60px;
    right:16px;
    z-index:99999;
    width:42px;
    height:34px;
    padding:0;
  `;

  const panel = document.createElement("div");
  panel.id = "lla-floating-panel";
  panel.style.cssText = `
    position:fixed;
    top:60px;
    right:64px;
    z-index:99998;
    width:430px;
    height:76vh;
    max-height:780px;
    min-height:360px;
    border:1px solid #4a4a4a;
    border-radius:4px;
    box-shadow:0 8px 30px rgba(0,0,0,.55);
    display:none;
    overflow:hidden;
    resize:both;
  `;

  let open = false;
  toggle.onclick = () => {
    open = !open;
    panel.style.display = open ? "flex" : "none";
    panel.style.flexDirection = "column";
    if (open) renderSidebar(panel);
  };

  document.body.append(toggle, panel);
}

app.registerExtension({
  name: "ComfyUI.LLMAssistant",
  async setup() {
    loadSettings();
    fetchWorkflowFiles()
      .then(data => { state.workflowFiles = data.workflows || []; })
      .catch(() => {});

    let sidebarRegistered = false;
    try {
      if (app.extensionManager && typeof app.extensionManager.registerSidebarTab === "function") {
        app.extensionManager.registerSidebarTab({
          id: PLUGIN_ID,
          icon: "pi pi-comment",
          title: "LLM Assistant",
          tooltip: "AI workflow assistant",
          type: "custom",
          render: el => {
            el.style.height = "100%";
            renderSidebar(el);
          },
        });
        sidebarRegistered = true;
      }
    } catch (e) {
      console.warn("[LLM Assistant] Sidebar registration failed:", e);
    }

    try {
      if (app.extensionManager && typeof app.extensionManager.registerCommand === "function") {
        app.extensionManager.registerCommand({
          id: "llm-assistant.open",
          label: "LLM Assistant",
          icon: "pi pi-comment",
          function: () => {
            if (sidebarRegistered) {
              const selectors = [
                `[data-tab-id="${PLUGIN_ID}"]`,
                `.sidebar-tabs-container .tab-item[title="LLM Assistant"]`,
                `.p-tabview-nav li[data-id="${PLUGIN_ID}"]`,
                `button[title="LLM Assistant"]`,
              ];
              for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                  el.click();
                  return;
                }
              }
            }
            const fp = document.getElementById("lla-floating-panel");
            const tb = document.getElementById("lla-toggle-btn");
            if (fp && tb) tb.click();
            else createFloatingPanel();
          },
        });
      }
    } catch (e) {
      console.warn("[LLM Assistant] Command registration failed:", e);
    }

    try {
      createFloatingPanel();
    } catch (e) {
      console.warn("[LLM Assistant] Floating panel failed:", e);
    }

    console.log(`[LLM Assistant] Loaded v${VERSION}`);
  },
});
