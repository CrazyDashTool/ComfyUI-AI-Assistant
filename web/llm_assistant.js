/**
 * ComfyUI LLM Assistant — Sidebar Extension
 * ==========================================
 * Registers a sidebar panel with an AI chat interface that can:
 *  - Read the current workflow (nodes/connections)
 *  - Debug and suggest improvements
 *  - Generate brand-new workflows on request
 *  - Show downloaded models/files for context
 *  - Support Gemini, Groq, xAI, OpenAI, Claude, OpenRouter, Mistral, Ollama, LM Studio
 *  - Build beginner learning courses from hardware and creative goals
 */

import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// ─────────────────────────────────────────────────────────────────────────────
//  Constants & state
// ─────────────────────────────────────────────────────────────────────────────

const PLUGIN_ID = "llm-assistant";
const STORAGE_KEY = "llm_assistant_settings";
const HISTORY_KEY = "llm_assistant_history";
const COURSE_PROFILE_KEY = "llm_assistant_course_profile";

const PROVIDERS = [
  { id: "openai",     label: "ChatGPT (OpenAI)",   placeholder: "sk-...",          defaultModel: "gpt-4o", requiresApiKey: true },
  { id: "anthropic",  label: "Claude (Anthropic)",  placeholder: "sk-ant-...",      defaultModel: "claude-3-5-sonnet-20241022", requiresApiKey: true },
  { id: "gemini",     label: "Gemini (Google)",     placeholder: "AIza...",         defaultModel: "gemini-2.0-flash", requiresApiKey: true },
  { id: "groq",       label: "Groq",                placeholder: "gsk_...",         defaultModel: "llama-3.3-70b-versatile", requiresApiKey: true },
  { id: "xai",        label: "xAI (Grok)",          placeholder: "xai-...",         defaultModel: "grok-3", requiresApiKey: true },
  { id: "openrouter", label: "OpenRouter",          placeholder: "sk-or-...",       defaultModel: "openai/gpt-4o", requiresApiKey: true },
  { id: "mistral",    label: "Mistral API",         placeholder: "Mistral API key", defaultModel: "mistral-large-latest", requiresApiKey: true },
  { id: "ollama",     label: "Ollama (local)",      placeholder: "Optional",        defaultModel: "llama3.1:8b", requiresApiKey: false, supportsBaseUrl: true, baseUrl: "http://127.0.0.1:11434" },
  { id: "lmstudio",   label: "LM Studio (local)",   placeholder: "Optional",        defaultModel: "local-model", requiresApiKey: false, supportsBaseUrl: true, baseUrl: "http://127.0.0.1:1234" },
];

const MODEL_SUGGESTIONS = {
  openrouter: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-3-5-sonnet",
    "anthropic/claude-3-haiku",
    "google/gemini-2.0-flash",
    "meta-llama/llama-3.3-70b-instruct",
    "mistralai/mistral-large",
    "deepseek/deepseek-chat",
    "x-ai/grok-3",
    "qwen/qwen-2.5-72b-instruct",
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-small-latest",
    "codestral-latest",
    "pixtral-large-latest",
  ],
  ollama: [
    "llama3.1:8b",
    "llama3.2:3b",
    "qwen2.5:7b",
    "mistral:7b",
    "gemma2:9b",
    "deepseek-r1:8b",
  ],
  lmstudio: [
    "local-model",
  ],
};

const LANGUAGES = [
  { id: "ru", label: "Русский", promptName: "Russian" },
  { id: "en", label: "English", promptName: "English" },
  { id: "uk", label: "Українська", promptName: "Ukrainian" },
];

const I18N = {
  en: {
    settings: "Settings",
    files: "Browse files & models",
    coursePlanner: "Beginner course",
    clearChat: "Clear chat",
    clearChatConfirm: "Clear chat history?",
    keySet: "Key set",
    noKey: "No key",
    localProvider: "Local",
    settingsTitle: "LLM Provider Settings",
    aiProvider: "AI Provider",
    language: "Language",
    apiKey: "API Key",
    apiKeyOptional: "API Key (optional)",
    baseUrl: "Base URL",
    baseUrlHint: "Use host URL. /v1/chat/completions is added automatically.",
    model: "Model",
    modelTagOpenRouter: "Model Tag (OpenRouter)",
    modelSuggestions: "Popular models (click to fill):",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved!",
    securityTitle: "Security Note:",
    securityText: "API keys are stored in browser localStorage only and are sent to your local ComfyUI Python backend, which then calls the provider API. Local providers do not require a key.",
    quickActions: "Quick Actions",
    welcomeTitle: "Welcome to LLM Assistant!",
    welcomeText: "Ask me to debug your workflow, suggest improvements, or generate a completely new workflow from scratch.",
    thinking: "Thinking...",
    inputPlaceholder: "Ask anything about your workflow, request a new one, or get suggestions...",
    includeWorkflow: "Include current workflow",
    includeModels: "Include models list",
    you: "You",
    assistant: "Assistant",
    copy: "Copy",
    copied: "Copied!",
    applyWorkflow: "Apply as Workflow",
    applyConfirm: "Apply this JSON as your current workflow? This will replace the current graph.",
    applied: "Applied!",
    failed: "Failed",
    needKey: "Please set your API key in Settings first.",
    error: "Error",
    filesTitle: "ComfyUI Files & Models",
    refresh: "Refresh",
    loading: "Loading...",
    suggestWorkflow: "Suggest Workflow",
    refreshHint: "Click Refresh to load files and models from your ComfyUI installation.",
    installedModels: "Installed Models",
    savedWorkflows: "Saved Workflows",
    directoryStructure: "Directory Structure",
    courseTitle: "Beginner Course Builder",
    courseIntro: "Fill in your hardware and goals. The assistant will turn it into a beginner-friendly ComfyUI learning course.",
    gpu: "GPU / video cards",
    vram: "VRAM",
    cpu: "CPU",
    ram: "RAM",
    os: "OS",
    experience: "Experience",
    timeBudget: "Time per week",
    goals: "What do you want to make?",
    generateCourse: "Generate Course",
    courseChooseGoal: "Choose at least one goal for the course.",
    back: "Back",
    beginner: "Beginner",
    someExperience: "Some experience",
    imageGoal: "Images / photo",
    videoGoal: "Video",
    audioGoal: "Audio",
    models3dGoal: "3D models",
    loraGoal: "LoRA / model training",
    automationGoal: "Workflow automation",
  },
  ru: {
    settings: "Настройки",
    files: "Файлы и модели",
    coursePlanner: "Курс для новичка",
    clearChat: "Очистить чат",
    clearChatConfirm: "Очистить историю чата?",
    keySet: "Ключ задан",
    noKey: "Нет ключа",
    localProvider: "Локально",
    settingsTitle: "Настройки LLM-провайдера",
    aiProvider: "ИИ-провайдер",
    language: "Язык",
    apiKey: "API-ключ",
    apiKeyOptional: "API-ключ (необязательно)",
    baseUrl: "Base URL",
    baseUrlHint: "Укажите адрес сервера. /v1/chat/completions добавится автоматически.",
    model: "Модель",
    modelTagOpenRouter: "Тег модели (OpenRouter)",
    modelSuggestions: "Популярные модели (нажмите, чтобы выбрать):",
    saveSettings: "Сохранить настройки",
    settingsSaved: "Настройки сохранены!",
    securityTitle: "Безопасность:",
    securityText: "API-ключи хранятся только в localStorage браузера и отправляются в локальный backend ComfyUI, который вызывает API провайдера. Локальные провайдеры не требуют ключа.",
    quickActions: "Быстрые действия",
    welcomeTitle: "Добро пожаловать в LLM Assistant!",
    welcomeText: "Попросите меня проверить workflow, улучшить параметры или создать новый workflow с нуля.",
    thinking: "Думаю...",
    inputPlaceholder: "Спросите о workflow, попросите новый workflow или идеи для улучшения...",
    includeWorkflow: "Добавлять текущий workflow",
    includeModels: "Добавлять список моделей",
    you: "Вы",
    assistant: "Ассистент",
    copy: "Копировать",
    copied: "Скопировано!",
    applyWorkflow: "Применить как Workflow",
    applyConfirm: "Применить этот JSON как текущий workflow? Текущий граф будет заменен.",
    applied: "Применено!",
    failed: "Ошибка",
    needKey: "Сначала укажите API-ключ в настройках.",
    error: "Ошибка",
    filesTitle: "Файлы и модели ComfyUI",
    refresh: "Обновить",
    loading: "Загрузка...",
    suggestWorkflow: "Предложить Workflow",
    refreshHint: "Нажмите Обновить, чтобы загрузить файлы и модели из вашей установки ComfyUI.",
    installedModels: "Установленные модели",
    savedWorkflows: "Сохраненные Workflows",
    directoryStructure: "Структура папок",
    courseTitle: "Конструктор курса для новичка",
    courseIntro: "Укажите железо и цели. Ассистент соберет понятный курс обучения ComfyUI.",
    gpu: "GPU / видеокарты",
    vram: "Видеопамять",
    cpu: "Процессор",
    ram: "ОЗУ",
    os: "ОС",
    experience: "Опыт",
    timeBudget: "Время в неделю",
    goals: "Что хотите делать?",
    generateCourse: "Создать курс",
    courseChooseGoal: "Выберите хотя бы одну цель для курса.",
    back: "Назад",
    beginner: "Новичок",
    someExperience: "Есть небольшой опыт",
    imageGoal: "Фото / изображения",
    videoGoal: "Видео",
    audioGoal: "Аудио",
    models3dGoal: "3D-модели",
    loraGoal: "LoRA / обучение моделей",
    automationGoal: "Автоматизация workflow",
  },
  uk: {
    settings: "Налаштування",
    files: "Файли та моделі",
    coursePlanner: "Курс для новачка",
    clearChat: "Очистити чат",
    clearChatConfirm: "Очистити історію чату?",
    keySet: "Ключ задано",
    noKey: "Немає ключа",
    localProvider: "Локально",
    settingsTitle: "Налаштування LLM-провайдера",
    aiProvider: "ШІ-провайдер",
    language: "Мова",
    apiKey: "API-ключ",
    apiKeyOptional: "API-ключ (необов'язково)",
    baseUrl: "Base URL",
    baseUrlHint: "Вкажіть адресу сервера. /v1/chat/completions додасться автоматично.",
    model: "Модель",
    modelTagOpenRouter: "Тег моделі (OpenRouter)",
    modelSuggestions: "Популярні моделі (натисніть, щоб вибрати):",
    saveSettings: "Зберегти налаштування",
    settingsSaved: "Налаштування збережено!",
    securityTitle: "Безпека:",
    securityText: "API-ключі зберігаються лише в localStorage браузера та надсилаються в локальний backend ComfyUI, який викликає API провайдера. Локальні провайдери не потребують ключа.",
    quickActions: "Швидкі дії",
    welcomeTitle: "Ласкаво просимо до LLM Assistant!",
    welcomeText: "Попросіть мене перевірити workflow, покращити параметри або створити новий workflow з нуля.",
    thinking: "Думаю...",
    inputPlaceholder: "Запитайте про workflow, попросіть новий workflow або ідеї для покращення...",
    includeWorkflow: "Додавати поточний workflow",
    includeModels: "Додавати список моделей",
    you: "Ви",
    assistant: "Асистент",
    copy: "Копіювати",
    copied: "Скопійовано!",
    applyWorkflow: "Застосувати як Workflow",
    applyConfirm: "Застосувати цей JSON як поточний workflow? Поточний граф буде замінено.",
    applied: "Застосовано!",
    failed: "Помилка",
    needKey: "Спочатку вкажіть API-ключ у налаштуваннях.",
    error: "Помилка",
    filesTitle: "Файли та моделі ComfyUI",
    refresh: "Оновити",
    loading: "Завантаження...",
    suggestWorkflow: "Запропонувати Workflow",
    refreshHint: "Натисніть Оновити, щоб завантажити файли та моделі з вашої інсталяції ComfyUI.",
    installedModels: "Встановлені моделі",
    savedWorkflows: "Збережені Workflows",
    directoryStructure: "Структура папок",
    courseTitle: "Конструктор курсу для новачка",
    courseIntro: "Вкажіть залізо та цілі. Асистент збере зрозумілий курс навчання ComfyUI.",
    gpu: "GPU / відеокарти",
    vram: "Відеопам'ять",
    cpu: "Процесор",
    ram: "ОЗП",
    os: "ОС",
    experience: "Досвід",
    timeBudget: "Час на тиждень",
    goals: "Що хочете створювати?",
    generateCourse: "Створити курс",
    courseChooseGoal: "Оберіть хоча б одну ціль для курсу.",
    back: "Назад",
    beginner: "Новачок",
    someExperience: "Є невеликий досвід",
    imageGoal: "Фото / зображення",
    videoGoal: "Відео",
    audioGoal: "Аудіо",
    models3dGoal: "3D-моделі",
    loraGoal: "LoRA / навчання моделей",
    automationGoal: "Автоматизація workflow",
  },
};

const QUICK_ACTIONS = {
  en: [
    { label: "Debug Workflow", prompt: "Please analyze my current workflow and identify any issues, broken connections, or missing nodes. Suggest fixes." },
    { label: "Suggest Improvements", prompt: "Look at my current workflow and suggest improvements, optimizations, or better parameter values." },
    { label: "Generate Workflow", prompt: "Generate a complete new ComfyUI workflow JSON for a standard text-to-image generation with SDXL. Include KSampler, VAE decode, and save image nodes. Output the JSON in a ```json code block." },
    { label: "Workflow Stats", prompt: "Give me a detailed summary and analysis of my current workflow: what it does, the data flow, and key settings." },
    { label: "Workflow Ideas", prompt: "Based on what's in my workflow and available models, suggest 5 creative workflow ideas I could build next." },
    { label: "Fix Errors", prompt: "My workflow has errors. Please diagnose the problems and provide specific fixes for each node." },
  ],
  ru: [
    { label: "Проверить Workflow", prompt: "Проанализируй мой текущий workflow: найди ошибки, сломанные связи, отсутствующие ноды и предложи конкретные исправления." },
    { label: "Улучшить", prompt: "Посмотри на мой текущий workflow и предложи улучшения, оптимизации и более удачные значения параметров." },
    { label: "Создать Workflow", prompt: "Создай полный JSON workflow для ComfyUI под стандартную генерацию text-to-image на SDXL. Добавь KSampler, VAE Decode и Save Image. Выведи JSON в блоке ```json." },
    { label: "Статистика", prompt: "Дай подробный разбор моего текущего workflow: что он делает, как идет поток данных и какие настройки ключевые." },
    { label: "Идеи", prompt: "С учетом моего workflow и доступных моделей предложи 5 творческих workflow, которые можно собрать дальше." },
    { label: "Исправить ошибки", prompt: "В моем workflow есть ошибки. Диагностируй проблемы и дай конкретные исправления для каждой ноды." },
  ],
  uk: [
    { label: "Перевірити Workflow", prompt: "Проаналізуй мій поточний workflow: знайди помилки, зламані зв'язки, відсутні ноди та запропонуй конкретні виправлення." },
    { label: "Покращити", prompt: "Подивись на мій поточний workflow і запропонуй покращення, оптимізації та вдаліші значення параметрів." },
    { label: "Створити Workflow", prompt: "Створи повний JSON workflow для ComfyUI під стандартну генерацію text-to-image на SDXL. Додай KSampler, VAE Decode та Save Image. Виведи JSON у блоці ```json." },
    { label: "Статистика", prompt: "Дай детальний розбір мого поточного workflow: що він робить, як іде потік даних і які налаштування ключові." },
    { label: "Ідеї", prompt: "З урахуванням мого workflow та доступних моделей запропонуй 5 творчих workflow, які можна зібрати далі." },
    { label: "Виправити помилки", prompt: "У моєму workflow є помилки. Діагностуй проблеми та дай конкретні виправлення для кожної ноди." },
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

let state = {
  provider: "openai",
  apiKey: "",
  baseUrl: "",
  model: "",
  language: "ru",
  messages: [],
  isLoading: false,
  showSettings: false,
  showFilesBrowser: false,
  showCoursePlanner: false,
  filesData: null,
  modelsData: null,
  workflowFiles: [],
  settingsPerProvider: {},
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

function t(key) {
  return (I18N[state.language] && I18N[state.language][key]) || I18N.en[key] || key;
}

function getCurrentProvider() {
  return PROVIDERS.find(p => p.id === state.provider) || PROVIDERS[0];
}

function getPromptLanguageName() {
  const lang = LANGUAGES.find(l => l.id === state.language) || LANGUAGES[0];
  return lang.promptName;
}

function getDefaultLanguage() {
  return "en";
}

function saveCourseProfile() {
  localStorage.setItem(COURSE_PROFILE_KEY, JSON.stringify(state.courseProfile));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Persistence helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadSettings() {
  state.language = getDefaultLanguage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.settingsPerProvider = saved.settingsPerProvider || {};
      state.provider = saved.provider || "openai";
      state.language = saved.language || state.language;
      applyProviderSettings();
    }
  } catch (_) {}

  try {
    const hist = localStorage.getItem(HISTORY_KEY);
    if (hist) state.messages = JSON.parse(hist).slice(-100);
  } catch (_) {}

  try {
    const profile = localStorage.getItem(COURSE_PROFILE_KEY);
    if (profile) state.courseProfile = { ...state.courseProfile, ...JSON.parse(profile) };
  } catch (_) {}
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
  }));
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.messages.slice(-100)));
}

function applyProviderSettings() {
  const saved = state.settingsPerProvider[state.provider] || {};
  const provInfo = getCurrentProvider();
  state.apiKey = saved.apiKey || "";
  state.baseUrl = saved.baseUrl || provInfo.baseUrl || "";
  state.model = saved.model || (provInfo ? provInfo.defaultModel : "");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Workflow helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentWorkflowSummary() {
  try {
    const graph = app.graph;
    if (!graph) return "No active workflow.";

    const nodes = graph._nodes || [];
    const links = graph.links || {};

    const nodeList = nodes.map(n => {
      const inputs = (n.inputs || []).map(i => i.name).join(", ");
      const outputs = (n.outputs || []).map(o => o.name).join(", ");
      const widgets = (n.widgets || [])
        .filter(w => w.value !== undefined && w.value !== null)
        .map(w => `${w.name}=${JSON.stringify(w.value).slice(0, 60)}`)
        .join(", ");
      return `  [${n.id}] ${n.type}${n.title ? ` (${n.title})` : ""}` +
        (inputs ? `\n      Inputs: ${inputs}` : "") +
        (outputs ? `\n      Outputs: ${outputs}` : "") +
        (widgets ? `\n      Params: ${widgets}` : "");
    }).join("\n");

    const linkCount = Object.keys(links).length;

    return `Workflow: ${nodes.length} nodes, ${linkCount} connections\n\nNodes:\n${nodeList}`;
  } catch (e) {
    return `Error reading workflow: ${e.message}`;
  }
}

function getCurrentWorkflowJSON() {
  try {
    const graph = app.graph;
    if (!graph) return null;
    return graph.serialize();
  } catch (_) {
    return null;
  }
}

async function applyWorkflowFromJSON(jsonData) {
  try {
    if (typeof jsonData === "string") jsonData = JSON.parse(jsonData);
    await app.loadGraphData(jsonData);
    return true;
  } catch (e) {
    console.error("[LLM Assistant] Failed to apply workflow:", e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  API helpers
// ─────────────────────────────────────────────────────────────────────────────

async function sendToLLM(userMessages) {
  const resp = await fetch("/llm-assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: state.provider,
      api_key: state.apiKey,
      base_url: state.baseUrl,
      model: state.model,
      messages: userMessages,
      max_tokens: 4096,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Unknown error");
  return data.response;
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

// ─────────────────────────────────────────────────────────────────────────────
//  System prompt builder
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(includeWorkflow = true, includeModels = false) {
  let sys = `You are an expert ComfyUI assistant embedded directly in the ComfyUI interface.
You help users:
1. Debug their workflows — identify broken connections, missing nodes, wrong parameters
2. Suggest improvements and optimizations
3. Generate complete new workflows as JSON when asked
4. Recommend which models/nodes to use based on what's installed
5. Create beginner-friendly ComfyUI learning courses based on hardware, goals, and available models

ComfyUI workflow JSON format:
- Each node has: id, type, inputs (object with values or [node_id, output_index] links), widgets_values
- Connections are represented as [source_node_id, output_index] in the target node's inputs

When generating a workflow JSON, output ONLY the JSON wrapped in a \`\`\`json code block.
When suggesting node parameters, be specific with values.
Always be concise and practical.
Always answer in ${getPromptLanguageName()}.`;

  if (includeWorkflow) {
    const wf = getCurrentWorkflowSummary();
    sys += `\n\n---\nCURRENT WORKFLOW:\n${wf}\n---`;
  }

  if (includeModels && state.modelsData) {
    const modelsSummary = Object.entries(state.modelsData.models || {})
      .map(([cat, files]) => `${cat}: ${files.map(f => f.name).join(", ")}`)
      .join("\n");
    sys += `\n\n---\nINSTALLED MODELS:\n${modelsSummary}\n---`;
  }

  if (state.workflowFiles && state.workflowFiles.length > 0) {
    const wfList = state.workflowFiles.map(w => `- ${w.name} (${w.node_count} nodes)`).join("\n");
    sys += `\n\n---\nSAVED WORKFLOWS:\n${wfList}\n---`;
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

  return `Create a beginner-friendly ComfyUI learning course for me.
Answer in ${getPromptLanguageName()}.

Hardware:
- GPU / video cards: ${profile.gpu || "not specified"}
- VRAM: ${profile.vram || "not specified"}
- CPU: ${profile.cpu || "not specified"}
- RAM: ${profile.ram || "not specified"}
- OS: ${profile.os || "not specified"}

Experience: ${experience}
Time per week: ${profile.timeBudget || "not specified"}
Goals: ${goalLabels}

Please include:
1. A quick hardware assessment and what should run locally vs cloud/API.
2. Recommended ComfyUI setup path and must-have custom nodes.
3. A step-by-step course plan for a complete beginner.
4. Separate modules for each selected goal.
5. Practical exercises with tiny checkpoints after each module.
6. Suggested models, formats, and safe VRAM settings.
7. Common mistakes and troubleshooting tips.
8. A final capstone project that combines the selected goals.`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  UI rendering
// ─────────────────────────────────────────────────────────────────────────────

// We'll store root element for re-renders
let rootEl = null;

function renderSidebar(container) {
  rootEl = container;
  container.innerHTML = "";
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1a1a2e;
    color: #e0e0e0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    overflow: hidden;
  `;

  injectStyles();

  // Build layout
  const header = createHeader();
  const body = document.createElement("div");
  body.style.cssText = "flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0;";

  if (state.showSettings) {
    body.appendChild(createSettingsPanel());
  } else if (state.showFilesBrowser) {
    body.appendChild(createFilesBrowser());
  } else if (state.showCoursePlanner) {
    body.appendChild(createCoursePlannerPanel());
  } else {
    body.appendChild(createChatPanel());
  }

  container.appendChild(header);
  container.appendChild(body);
}

function injectStyles() {
  if (document.getElementById("llm-assistant-styles")) return;
  const style = document.createElement("style");
  style.id = "llm-assistant-styles";
  style.textContent = `
    .lla-btn {
      background: #16213e;
      color: #a0c4ff;
      border: 1px solid #2a3a5c;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    .lla-btn:hover { background: #0f3460; border-color: #a0c4ff; }
    .lla-btn.primary { background: #0f3460; color: #fff; border-color: #a0c4ff; }
    .lla-btn.primary:hover { background: #1a5276; }
    .lla-btn.danger { background: #3c1e1e; color: #ff8080; border-color: #5c2e2e; }
    .lla-btn.danger:hover { background: #5c2e2e; }
    .lla-btn.success { background: #1e3c2e; color: #80ff80; border-color: #2e5c3e; }
    .lla-btn.success:hover { background: #2e5c3e; }
    .lla-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .lla-input {
      background: #0d0d1a;
      color: #e0e0e0;
      border: 1px solid #2a3a5c;
      border-radius: 6px;
      padding: 8px 10px;
      width: 100%;
      box-sizing: border-box;
      font-size: 12px;
    }
    .lla-input:focus { outline: none; border-color: #a0c4ff; }
    .lla-select {
      background: #0d0d1a;
      color: #e0e0e0;
      border: 1px solid #2a3a5c;
      border-radius: 6px;
      padding: 6px 10px;
      width: 100%;
      box-sizing: border-box;
      font-size: 12px;
    }
    .lla-select:focus { outline: none; border-color: #a0c4ff; }
    .lla-label { color: #8090a0; font-size: 11px; margin-bottom: 4px; display: block; }
    .lla-msg-user {
      background: #0f3460;
      border-radius: 10px 10px 0 10px;
      padding: 8px 12px;
      margin: 4px 0 4px 20px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    .lla-msg-assistant {
      background: #16213e;
      border: 1px solid #2a3a5c;
      border-radius: 10px 10px 10px 0;
      padding: 8px 12px;
      margin: 4px 20px 4px 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    .lla-msg-system {
      background: #1e1e0f;
      border: 1px solid #3a3a2a;
      border-radius: 6px;
      padding: 6px 10px;
      margin: 4px 0;
      color: #c0b040;
      font-size: 11px;
      font-style: italic;
    }
    .lla-code-block {
      background: #0a0a14;
      border: 1px solid #2a3a5c;
      border-radius: 6px;
      padding: 8px;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      font-size: 11px;
      overflow-x: auto;
      white-space: pre;
      margin: 4px 0;
    }
    .lla-apply-btn {
      background: #1e3c2e;
      color: #80ff80;
      border: 1px solid #2e5c3e;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 11px;
      margin-top: 4px;
    }
    .lla-apply-btn:hover { background: #2e5c3e; }
    .lla-spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid #2a3a5c;
      border-top-color: #a0c4ff;
      border-radius: 50%;
      animation: lla-spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes lla-spin { to { transform: rotate(360deg); } }
    .lla-section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6080a0;
      padding: 8px 12px 4px;
    }
    .lla-divider { border: none; border-top: 1px solid #2a3a5c; margin: 6px 0; }
    .lla-quick-btn {
      background: #16213e;
      border: 1px solid #1e3a5c;
      border-radius: 6px;
      padding: 6px 8px;
      color: #80b0e0;
      cursor: pointer;
      font-size: 11px;
      text-align: left;
      transition: all 0.15s;
      line-height: 1.3;
    }
    .lla-quick-btn:hover { background: #0f3460; border-color: #a0c4ff; color: #fff; }
    .lla-chip {
      display: inline-block;
      background: #1e3060;
      border: 1px solid #2a4080;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 10px;
      color: #80b0ff;
      margin: 2px;
      cursor: pointer;
    }
    .lla-chip:hover { background: #2a4080; }
    .lla-file-item {
      padding: 4px 12px;
      cursor: default;
      font-size: 11px;
      color: #90a0b0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .lla-file-item:hover { background: #16213e; }
    .lla-file-folder {
      padding: 4px 12px;
      cursor: pointer;
      font-size: 11px;
      color: #a0c4ff;
      font-weight: 600;
    }
    .lla-file-folder:hover { background: #16213e; }
    .lla-scrollarea { overflow-y: auto; flex: 1; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #0d0d1a; }
    ::-webkit-scrollbar-thumb { background: #2a3a5c; border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: #3a5a8c; }
  `;
  document.head.appendChild(style);
}

// ─── Header ───────────────────────────────────────────────────────────────────

function createHeader() {
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 10px 12px 8px;
    border-bottom: 1px solid #2a3a5c;
    background: #12122a;
    flex-shrink: 0;
  `;

  // Title row
  const titleRow = document.createElement("div");
  titleRow.style.cssText = "display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;";

  const title = document.createElement("div");
  title.style.cssText = "font-size:14px; font-weight:700; color:#a0c4ff; display:flex; align-items:center; gap:6px;";
  title.innerHTML = `<span style="font-size:16px;">🤖</span> LLM Assistant`;

  const rightBtns = document.createElement("div");
  rightBtns.style.cssText = "display:flex; gap:4px;";

  const settingsBtn = document.createElement("button");
  settingsBtn.className = "lla-btn";
  settingsBtn.style.cssText = "padding:4px 8px; font-size:14px;";
  settingsBtn.textContent = "⚙️";
  settingsBtn.title = t("settings");
  settingsBtn.onclick = () => {
    state.showSettings = !state.showSettings;
    state.showFilesBrowser = false;
    state.showCoursePlanner = false;
    rerender();
  };

  const courseBtn = document.createElement("button");
  courseBtn.className = "lla-btn";
  courseBtn.style.cssText = "padding:4px 8px; font-size:14px;";
  courseBtn.textContent = "🎓";
  courseBtn.title = t("coursePlanner");
  courseBtn.onclick = () => {
    state.showCoursePlanner = !state.showCoursePlanner;
    state.showSettings = false;
    state.showFilesBrowser = false;
    rerender();
  };

  const filesBtn = document.createElement("button");
  filesBtn.className = "lla-btn";
  filesBtn.style.cssText = "padding:4px 8px; font-size:14px;";
  filesBtn.textContent = "📁";
  filesBtn.title = t("files");
  filesBtn.onclick = () => {
    state.showFilesBrowser = !state.showFilesBrowser;
    state.showSettings = false;
    state.showCoursePlanner = false;
    rerender();
  };

  const clearBtn = document.createElement("button");
  clearBtn.className = "lla-btn danger";
  clearBtn.style.cssText = "padding:4px 8px; font-size:12px;";
  clearBtn.textContent = "🗑";
  clearBtn.title = t("clearChat");
  clearBtn.onclick = () => { if (confirm(t("clearChatConfirm"))) { state.messages = []; saveHistory(); rerender(); } };

  rightBtns.append(settingsBtn, courseBtn, filesBtn, clearBtn);
  titleRow.append(title, rightBtns);

  // Provider badge
  const provider = getCurrentProvider();
  const providerBadge = document.createElement("div");
  providerBadge.style.cssText = "display:flex; align-items:center; gap:6px; flex-wrap:wrap;";

  const badge = document.createElement("span");
  badge.style.cssText = "background:#1e3060; border:1px solid #2a4080; border-radius:10px; padding:2px 8px; font-size:10px; color:#80b0ff;";
  badge.textContent = `📡 ${provider ? provider.label : state.provider}`;

  const modelBadge = document.createElement("span");
  modelBadge.style.cssText = "background:#1e2e10; border:1px solid #2a4020; border-radius:10px; padding:2px 8px; font-size:10px; color:#80c080;";
  modelBadge.textContent = `🧠 ${state.model || "default"}`;

  const keyBadge = document.createElement("span");
  const keyOk = provider.requiresApiKey === false || !!state.apiKey;
  keyBadge.style.cssText = `background:${keyOk ? "#1e2e10" : "#3c1e1e"}; border:1px solid ${keyOk ? "#2a4020" : "#5c2e2e"}; border-radius:10px; padding:2px 8px; font-size:10px; color:${keyOk ? "#80c080" : "#ff8080"};`;
  if (provider.requiresApiKey === false) {
    keyBadge.textContent = `🏠 ${t("localProvider")}`;
  } else {
    keyBadge.textContent = state.apiKey ? `🔑 ${t("keySet")}` : `⚠️ ${t("noKey")}`;
  }

  providerBadge.append(badge, modelBadge, keyBadge);
  header.append(titleRow, providerBadge);
  return header;
}

// ─── Settings Panel ────────────────────────────────────────────────────────────

function createSettingsPanel() {
  const panel = document.createElement("div");
  panel.style.cssText = "padding:12px; display:flex; flex-direction:column; gap:12px;";
  const currentProvider = getCurrentProvider();

  const sectionTitle = document.createElement("div");
  sectionTitle.className = "lla-section-title";
  sectionTitle.textContent = `⚙️ ${t("settingsTitle")}`;

  // Language select
  const langLabel = document.createElement("label");
  langLabel.className = "lla-label";
  langLabel.textContent = t("language");
  const langSelect = document.createElement("select");
  langSelect.className = "lla-select";
  LANGUAGES.forEach(lang => {
    const opt = document.createElement("option");
    opt.value = lang.id;
    opt.textContent = lang.label;
    if (lang.id === state.language) opt.selected = true;
    langSelect.appendChild(opt);
  });
  langSelect.onchange = () => {
    state.language = langSelect.value;
    saveSettings();
    rerender();
  };

  // Provider select
  const provLabel = document.createElement("label");
  provLabel.className = "lla-label";
  provLabel.textContent = t("aiProvider");
  const provSelect = document.createElement("select");
  provSelect.className = "lla-select";
  PROVIDERS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    if (p.id === state.provider) opt.selected = true;
    provSelect.appendChild(opt);
  });
  provSelect.onchange = () => {
    saveSettings(); // Save current before switching
    state.provider = provSelect.value;
    applyProviderSettings();
    rerender();
  };

  // API Key
  const keyLabel = document.createElement("label");
  keyLabel.className = "lla-label";
  keyLabel.textContent = currentProvider.requiresApiKey === false ? t("apiKeyOptional") : t("apiKey");
  const keyInput = document.createElement("input");
  keyInput.type = "password";
  keyInput.className = "lla-input";
  keyInput.value = state.apiKey;
  keyInput.placeholder = currentProvider ? currentProvider.placeholder : "API key...";
  keyInput.oninput = () => { state.apiKey = keyInput.value; };

  const baseUrlFields = [];
  let baseUrlInput = null;
  if (currentProvider.supportsBaseUrl) {
    const baseUrlLabel = document.createElement("label");
    baseUrlLabel.className = "lla-label";
    baseUrlLabel.textContent = t("baseUrl");
    baseUrlInput = document.createElement("input");
    baseUrlInput.type = "text";
    baseUrlInput.className = "lla-input";
    baseUrlInput.value = state.baseUrl;
    baseUrlInput.placeholder = currentProvider.baseUrl || "";
    baseUrlInput.oninput = () => { state.baseUrl = baseUrlInput.value; };
    const baseUrlHint = document.createElement("div");
    baseUrlHint.style.cssText = "font-size:10px; color:#6080a0; margin-top:-8px;";
    baseUrlHint.textContent = t("baseUrlHint");
    baseUrlFields.push(baseUrlLabel, baseUrlInput, baseUrlHint);
  }

  // Model input
  const modelLabel = document.createElement("label");
  modelLabel.className = "lla-label";
  modelLabel.textContent = state.provider === "openrouter" ? t("modelTagOpenRouter") : t("model");

  const modelGroup = document.createElement("div");
  const modelInput = document.createElement("input");
  modelInput.type = "text";
  modelInput.className = "lla-input";
  modelInput.value = state.model;
  modelInput.placeholder = currentProvider ? currentProvider.defaultModel : "model name";
  modelInput.oninput = () => { state.model = modelInput.value; };
  modelGroup.appendChild(modelInput);

  const modelSuggestions = MODEL_SUGGESTIONS[state.provider] || [];
  if (modelSuggestions.length) {
    const chipsTitle = document.createElement("div");
    chipsTitle.style.cssText = "font-size:10px; color:#6080a0; margin-top:6px; margin-bottom:4px;";
    chipsTitle.textContent = t("modelSuggestions");
    modelGroup.appendChild(chipsTitle);

    const chipsWrap = document.createElement("div");
    modelSuggestions.forEach(m => {
      const chip = document.createElement("span");
      chip.className = "lla-chip";
      chip.textContent = m;
      chip.onclick = () => {
        modelInput.value = m;
        state.model = m;
      };
      chipsWrap.appendChild(chip);
    });
    modelGroup.appendChild(chipsWrap);
  }

  // Save button
  const saveBtn = document.createElement("button");
  saveBtn.className = "lla-btn primary";
  saveBtn.textContent = `💾 ${t("saveSettings")}`;
  saveBtn.onclick = () => {
    state.apiKey = keyInput.value;
    if (baseUrlInput) state.baseUrl = baseUrlInput.value;
    state.model = modelInput.value;
    saveSettings();
    state.showSettings = false;
    addSystemMessage(`${t("settingsSaved")} ✅`);
    rerender();
  };

  // Provider descriptions
  const desc = document.createElement("div");
  desc.style.cssText = "background:#0d0d1a; border:1px solid #2a3a5c; border-radius:6px; padding:10px; font-size:11px; color:#6080a0; line-height:1.6;";
  const descriptions = {
    openai:     "Models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo",
    anthropic:  "Models: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229",
    gemini:     "Models: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash",
    groq:       "Models: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it",
    xai:        "Models: grok-3, grok-3-mini, grok-2-1212",
    openrouter: "Access 200+ models. Enter the model tag from openrouter.ai/models",
    mistral:    "Mistral API: mistral-large-latest, mistral-small-latest, codestral-latest, pixtral-large-latest",
    ollama:     "Local Ollama server. Default URL: http://127.0.0.1:11434",
    lmstudio:   "Local LM Studio server. Default URL: http://127.0.0.1:1234",
  };
  desc.textContent = descriptions[state.provider] || "";

  panel.append(sectionTitle, langLabel, langSelect, provLabel, provSelect, keyLabel, keyInput, ...baseUrlFields, modelLabel, modelGroup, saveBtn, desc);

  // Info box
  const infoBox = document.createElement("div");
  infoBox.style.cssText = "background:#1a1a0d; border:1px solid #3a3a2a; border-radius:6px; padding:10px; font-size:11px; color:#c0b040; line-height:1.6;";
  infoBox.innerHTML = `<strong>🔒 ${t("securityTitle")}</strong><br>${t("securityText")}`;
  panel.appendChild(infoBox);

  return panel;
}

// ─── Files Browser Panel ──────────────────────────────────────────────────────

function createFilesBrowser() {
  const panel = document.createElement("div");
  panel.style.cssText = "display:flex; flex-direction:column; height:100%;";

  const titleBar = document.createElement("div");
  titleBar.style.cssText = "padding:10px 12px; border-bottom:1px solid #2a3a5c; background:#12122a; flex-shrink:0;";
  titleBar.innerHTML = `<div class="lla-section-title" style="padding:0;">📁 ${t("filesTitle")}</div>`;

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex; gap:6px; padding:8px 12px; border-bottom:1px solid #1a2a3c;";

  const refreshBtn = document.createElement("button");
  refreshBtn.className = "lla-btn";
  refreshBtn.textContent = `🔄 ${t("refresh")}`;
  refreshBtn.onclick = async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = t("loading");
    try {
      const [files, models, wf] = await Promise.all([fetchFiles(), fetchModels(), fetchWorkflowFiles()]);
      state.filesData = files;
      state.modelsData = models;
      state.workflowFiles = wf.workflows || [];
    } catch (e) {
      console.error(e);
    }
    rerender();
  };

  const suggestBtn = document.createElement("button");
  suggestBtn.className = "lla-btn primary";
  suggestBtn.textContent = `💡 ${t("suggestWorkflow")}`;
  suggestBtn.onclick = async () => {
    state.showFilesBrowser = false;
    const modelsStr = state.modelsData
      ? Object.entries(state.modelsData.models || {})
          .map(([cat, files]) => `${cat}: ${files.map(f => f.name).join(", ")}`)
          .join("\n")
      : "Not loaded yet.";
    await sendMessage(`Based on these installed models, suggest 3 interesting workflow ideas I can build in ComfyUI:\n\n${modelsStr}`, true);
    rerender();
  };

  btnRow.append(refreshBtn, suggestBtn);
  panel.append(titleBar, btnRow);

  const scrollArea = document.createElement("div");
  scrollArea.className = "lla-scrollarea";
  scrollArea.style.padding = "8px 0";

  if (!state.filesData && !state.modelsData) {
    const hint = document.createElement("div");
    hint.style.cssText = "padding:20px; text-align:center; color:#6080a0; font-size:12px;";
    hint.textContent = t("refreshHint");
    scrollArea.appendChild(hint);
  } else {
    // Models section
    if (state.modelsData && state.modelsData.models) {
      const modTitle = document.createElement("div");
      modTitle.className = "lla-section-title";
      modTitle.textContent = `🧠 ${t("installedModels")}`;
      scrollArea.appendChild(modTitle);

      Object.entries(state.modelsData.models).forEach(([cat, files]) => {
        if (!files.length) return;
        const folderEl = document.createElement("div");
        folderEl.className = "lla-file-folder";
        folderEl.textContent = `📂 ${cat} (${files.length})`;
        let expanded = false;
        const childrenEl = document.createElement("div");
        childrenEl.style.display = "none";
        files.forEach(f => {
          const fEl = document.createElement("div");
          fEl.className = "lla-file-item";
          fEl.style.paddingLeft = "24px";
          fEl.innerHTML = `<span>📄</span><span style="flex:1;">${f.name}</span><span style="color:#406080;">${f.size_mb}MB</span>`;
          childrenEl.appendChild(fEl);
        });
        folderEl.onclick = () => {
          expanded = !expanded;
          childrenEl.style.display = expanded ? "block" : "none";
          folderEl.textContent = `${expanded ? "📂" : "📁"} ${cat} (${files.length})`;
        };
        scrollArea.append(folderEl, childrenEl);
      });
    }

    // Workflows section
    if (state.workflowFiles && state.workflowFiles.length > 0) {
      const divider = document.createElement("hr");
      divider.className = "lla-divider";
      const wfTitle = document.createElement("div");
      wfTitle.className = "lla-section-title";
      wfTitle.textContent = `📋 ${t("savedWorkflows")}`;
      scrollArea.append(divider, wfTitle);

      state.workflowFiles.forEach(wf => {
        const el = document.createElement("div");
        el.className = "lla-file-item";
        el.innerHTML = `<span>📋</span><span style="flex:1;">${wf.name}</span><span style="color:#406080;">${wf.node_count} nodes</span>`;
        scrollArea.appendChild(el);
      });
    }

    // Files tree
    if (state.filesData && state.filesData.sections) {
      const divider2 = document.createElement("hr");
      divider2.className = "lla-divider";
      const fsTitle = document.createElement("div");
      fsTitle.className = "lla-section-title";
      fsTitle.textContent = `🗂 ${t("directoryStructure")}`;
      scrollArea.append(divider2, fsTitle);

      const rootInfo = document.createElement("div");
      rootInfo.style.cssText = "padding:4px 12px; font-size:10px; color:#406080;";
      rootInfo.textContent = `Root: ${state.filesData.root || "unknown"}`;
      scrollArea.appendChild(rootInfo);
    }
  }

  panel.appendChild(scrollArea);
  return panel;
}

// ─── Chat Panel ────────────────────────────────────────────────────────────────

function createCoursePlannerPanel() {
  const panel = document.createElement("div");
  panel.style.cssText = "padding:12px; display:flex; flex-direction:column; gap:10px; overflow-y:auto;";

  const title = document.createElement("div");
  title.className = "lla-section-title";
  title.textContent = `🎓 ${t("courseTitle")}`;

  const intro = document.createElement("div");
  intro.style.cssText = "font-size:11px; color:#90a0b0; line-height:1.5;";
  intro.textContent = t("courseIntro");

  function field(labelKey, profileKey, placeholder = "") {
    const wrap = document.createElement("div");
    const label = document.createElement("label");
    label.className = "lla-label";
    label.textContent = t(labelKey);
    const input = document.createElement("input");
    input.className = "lla-input";
    input.type = "text";
    input.value = state.courseProfile[profileKey] || "";
    input.placeholder = placeholder;
    input.oninput = () => {
      state.courseProfile[profileKey] = input.value;
      saveCourseProfile();
    };
    wrap.append(label, input);
    return wrap;
  }

  const grid = document.createElement("div");
  grid.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:8px;";
  grid.append(
    field("gpu", "gpu", "RTX 3060 / RX 7800 XT"),
    field("vram", "vram", "8 GB / 12 GB / 24 GB"),
    field("cpu", "cpu", "Ryzen 5 / Core i7"),
    field("ram", "ram", "16 GB / 32 GB"),
    field("os", "os", "Windows / Linux"),
    field("timeBudget", "timeBudget", "3-5 hours")
  );

  const expWrap = document.createElement("div");
  const expLabel = document.createElement("label");
  expLabel.className = "lla-label";
  expLabel.textContent = t("experience");
  const expSelect = document.createElement("select");
  expSelect.className = "lla-select";
  [
    { id: "beginner", label: t("beginner") },
    { id: "some", label: t("someExperience") },
  ].forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.label;
    if (state.courseProfile.experience === item.id) opt.selected = true;
    expSelect.appendChild(opt);
  });
  expSelect.onchange = () => {
    state.courseProfile.experience = expSelect.value;
    saveCourseProfile();
  };
  expWrap.append(expLabel, expSelect);

  const goalsTitle = document.createElement("div");
  goalsTitle.className = "lla-label";
  goalsTitle.textContent = t("goals");

  const goalsGrid = document.createElement("div");
  goalsGrid.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:6px;";
  COURSE_GOALS.forEach(goal => {
    const label = document.createElement("label");
    label.style.cssText = "display:flex; align-items:center; gap:6px; background:#0d0d1a; border:1px solid #2a3a5c; border-radius:6px; padding:7px; font-size:11px; color:#d0d8e0; cursor:pointer;";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = (state.courseProfile.goals || []).includes(goal.id);
    cb.onchange = () => {
      const goals = new Set(state.courseProfile.goals || []);
      if (cb.checked) goals.add(goal.id);
      else goals.delete(goal.id);
      state.courseProfile.goals = Array.from(goals);
      saveCourseProfile();
    };
    label.append(cb, document.createTextNode(t(goal.labelKey)));
    goalsGrid.appendChild(label);
  });

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex; gap:8px; margin-top:4px;";

  const generateBtn = document.createElement("button");
  generateBtn.className = "lla-btn primary";
  generateBtn.style.flex = "1";
  generateBtn.textContent = `🎓 ${t("generateCourse")}`;
  generateBtn.onclick = async () => {
    if (!state.courseProfile.goals || state.courseProfile.goals.length === 0) {
      addSystemMessage(t("courseChooseGoal"));
      rerender();
      return;
    }
    saveCourseProfile();
    const prompt = buildCoursePrompt(state.courseProfile);
    state.showCoursePlanner = false;
    await sendMessage(prompt, true, false);
  };

  const backBtn = document.createElement("button");
  backBtn.className = "lla-btn";
  backBtn.textContent = t("back");
  backBtn.onclick = () => {
    state.showCoursePlanner = false;
    rerender();
  };

  btnRow.append(generateBtn, backBtn);
  panel.append(title, intro, grid, expWrap, goalsTitle, goalsGrid, btnRow);
  return panel;
}

function createChatPanel() {
  const panel = document.createElement("div");
  panel.style.cssText = "display:flex; flex-direction:column; height:100%;";

  // Quick actions
  const quickActions = createQuickActions();
  panel.appendChild(quickActions);

  // Messages area
  const messagesArea = document.createElement("div");
  messagesArea.id = "lla-messages";
  messagesArea.style.cssText = "flex:1; overflow-y:auto; padding:8px 10px; display:flex; flex-direction:column; gap:4px;";

  if (state.messages.length === 0) {
    const welcome = document.createElement("div");
    welcome.style.cssText = "text-align:center; padding:30px 10px; color:#6080a0;";
    welcome.innerHTML = `
      <div style="font-size:32px; margin-bottom:12px;">🤖</div>
      <div style="font-size:13px; margin-bottom:8px; color:#a0b8d0;">${t("welcomeTitle")}</div>
      <div style="font-size:11px; line-height:1.6;">
        ${t("welcomeText")}
      </div>
    `;
    messagesArea.appendChild(welcome);
  } else {
    state.messages.forEach(msg => {
      messagesArea.appendChild(createMessageBubble(msg));
    });
  }

  panel.appendChild(messagesArea);

  // Loading indicator
  const loadingEl = document.createElement("div");
  loadingEl.id = "lla-loading";
  loadingEl.style.cssText = `display:${state.isLoading ? "flex" : "none"}; padding:8px 12px; align-items:center; color:#6080a0; font-size:12px; border-top:1px solid #1a2a3c;`;
  loadingEl.innerHTML = `<span class="lla-spinner"></span> ${t("thinking")}`;
  panel.appendChild(loadingEl);

  // Input area
  const inputArea = createInputArea(messagesArea);
  panel.appendChild(inputArea);

  // Scroll to bottom
  setTimeout(() => { messagesArea.scrollTop = messagesArea.scrollHeight; }, 50);

  return panel;
}

function createQuickActions() {
  const wrap = document.createElement("div");
  wrap.style.cssText = "padding:8px 10px; border-bottom:1px solid #1a2a3c; background:#0f0f20;";

  const title = document.createElement("div");
  title.style.cssText = "font-size:10px; color:#406080; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;";
  title.textContent = `⚡ ${t("quickActions")}`;

  const grid = document.createElement("div");
  grid.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:4px;";

  const actions = QUICK_ACTIONS[state.language] || QUICK_ACTIONS.en;

  actions.forEach(({ label, prompt }) => {
    const btn = document.createElement("button");
    btn.className = "lla-quick-btn";
    btn.textContent = label;
    btn.onclick = () => sendMessage(prompt);
    grid.appendChild(btn);
  });

  wrap.append(title, grid);
  return wrap;
}

function createInputArea(messagesArea) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "padding:8px 10px; border-top:1px solid #2a3a5c; background:#12122a; flex-shrink:0;";

  const row = document.createElement("div");
  row.style.cssText = "display:flex; gap:6px; align-items:flex-end;";

  const textarea = document.createElement("textarea");
  textarea.className = "lla-input";
  textarea.style.cssText = "flex:1; height:60px; resize:none; font-family:inherit; line-height:1.4;";
  textarea.placeholder = t("inputPlaceholder");

  textarea.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const sendBtn = document.createElement("button");
  sendBtn.className = "lla-btn primary";
  sendBtn.style.cssText = "padding:8px 14px; height:60px; font-size:16px;";
  sendBtn.textContent = "▶";
  sendBtn.title = "Send (Enter)";
  sendBtn.onclick = doSend;

  function doSend() {
    const text = textarea.value.trim();
    if (!text || state.isLoading) return;
    textarea.value = "";
    sendMessage(text);
  }

  // Options row
  const optRow = document.createElement("div");
  optRow.style.cssText = "display:flex; gap:8px; margin-top:6px; align-items:center; flex-wrap:wrap;";

  const includeWfLabel = document.createElement("label");
  includeWfLabel.style.cssText = "display:flex; align-items:center; gap:4px; font-size:10px; color:#6080a0; cursor:pointer;";
  const includeWfCb = document.createElement("input");
  includeWfCb.type = "checkbox";
  includeWfCb.checked = true;
  includeWfCb.id = "lla-include-wf";
  includeWfLabel.append(includeWfCb, document.createTextNode(t("includeWorkflow")));

  const includeModelsLabel = document.createElement("label");
  includeModelsLabel.style.cssText = "display:flex; align-items:center; gap:4px; font-size:10px; color:#6080a0; cursor:pointer;";
  const includeModelsCb = document.createElement("input");
  includeModelsCb.type = "checkbox";
  includeModelsCb.checked = false;
  includeModelsCb.id = "lla-include-models";
  includeModelsLabel.append(includeModelsCb, document.createTextNode(t("includeModels")));

  optRow.append(includeWfLabel, includeModelsLabel);

  row.append(textarea, sendBtn);
  wrap.append(row, optRow);

  // Override sendMessage to read checkboxes
  const origSendMessage = window._llaSendMessage;

  return wrap;
}

function createMessageBubble(msg) {
  const wrap = document.createElement("div");

  if (msg.role === "user") {
    const bubble = document.createElement("div");
    bubble.className = "lla-msg-user";
    bubble.textContent = msg.content;
    const label = document.createElement("div");
    label.style.cssText = "text-align:right; font-size:10px; color:#4060a0; margin-bottom:2px;";
    label.textContent = t("you");
    wrap.append(label, bubble);
  } else if (msg.role === "assistant") {
    const label = document.createElement("div");
    label.style.cssText = "font-size:10px; color:#406080; margin-bottom:2px;";
    label.textContent = `🤖 ${t("assistant")}`;
    const bubble = document.createElement("div");
    bubble.className = "lla-msg-assistant";
    renderMarkdownLite(bubble, msg.content);
    wrap.append(label, bubble);
  } else if (msg.role === "system-note") {
    const bubble = document.createElement("div");
    bubble.className = "lla-msg-system";
    bubble.textContent = msg.content;
    wrap.appendChild(bubble);
  }

  return wrap;
}

// Simple markdown-ish renderer for assistant messages
function renderMarkdownLite(container, text) {
  // Extract code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);
  parts.forEach(part => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, lines.length - 1).join("\n");

      const codeWrap = document.createElement("div");

      const header = document.createElement("div");
      header.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#060610; padding:4px 8px; border-radius:6px 6px 0 0; border:1px solid #2a3a5c; border-bottom:none;";

      const langBadge = document.createElement("span");
      langBadge.style.cssText = "font-size:10px; color:#6080a0;";
      langBadge.textContent = lang || "code";

      const copyBtn = document.createElement("button");
      copyBtn.style.cssText = "background:none; border:none; color:#6080a0; cursor:pointer; font-size:11px; padding:2px 4px;";
      copyBtn.textContent = `📋 ${t("copy")}`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = `✅ ${t("copied")}`;
          setTimeout(() => { copyBtn.textContent = `📋 ${t("copy")}`; }, 2000);
        });
      };

      header.append(langBadge, copyBtn);

      const codeEl = document.createElement("div");
      codeEl.className = "lla-code-block";
      codeEl.style.cssText += "border-radius:0 0 6px 6px; margin:0;";
      codeEl.textContent = code;

      codeWrap.append(header, codeEl);

      // If it's JSON, offer to apply as workflow
      if (lang === "json" || (code.trim().startsWith("{") && code.includes('"nodes"'))) {
        const applyBtn = document.createElement("button");
        applyBtn.className = "lla-apply-btn";
        applyBtn.textContent = `⚡ ${t("applyWorkflow")}`;
        applyBtn.onclick = async () => {
          if (confirm(t("applyConfirm"))) {
            const success = await applyWorkflowFromJSON(code);
            applyBtn.textContent = success ? `✅ ${t("applied")}` : `❌ ${t("failed")}`;
            setTimeout(() => { applyBtn.textContent = `⚡ ${t("applyWorkflow")}`; }, 3000);
          }
        };
        codeWrap.appendChild(applyBtn);
      }

      container.appendChild(codeWrap);
    } else if (part.trim()) {
      // Regular text - basic formatting
      const textDiv = document.createElement("div");
      textDiv.style.cssText = "line-height:1.6; white-space:pre-wrap;";

      // Bold
      let html = part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, '<code style="background:#0a0a14;border:1px solid #2a3a5c;border-radius:3px;padding:1px 4px;font-family:monospace;font-size:11px;">$1</code>');

      textDiv.innerHTML = html;
      container.appendChild(textDiv);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Message sending
// ─────────────────────────────────────────────────────────────────────────────

function addSystemMessage(text) {
  state.messages.push({ role: "system-note", content: text });
  saveHistory();
}

async function sendMessage(text, includeModels = null, includeWorkflow = null) {
  const provider = getCurrentProvider();
  if (provider.requiresApiKey !== false && !state.apiKey) {
    addSystemMessage(`⚠️ ${t("needKey")}`);
    rerender();
    return;
  }

  // Read checkbox states from DOM
  const includeWfCb = document.getElementById("lla-include-wf");
  const includeModelsCb = document.getElementById("lla-include-models");
  const shouldIncludeWf = includeWorkflow !== null ? includeWorkflow : (includeWfCb ? includeWfCb.checked : true);
  const shouldIncludeModels = includeModels !== null ? includeModels : (includeModelsCb ? includeModelsCb.checked : false);

  // If models requested but not loaded yet, load them
  if (shouldIncludeModels && !state.modelsData) {
    try {
      state.modelsData = await fetchModels();
    } catch (_) {}
  }

  // Build messages array for the API
  const systemPrompt = buildSystemPrompt(shouldIncludeWf, shouldIncludeModels);

  const apiMessages = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history (last 20 non-system messages)
  const historyMessages = state.messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .slice(-20);

  apiMessages.push(...historyMessages);
  apiMessages.push({ role: "user", content: text });

  // Add to UI
  state.messages.push({ role: "user", content: text });
  state.isLoading = true;
  rerender();

  // Scroll to bottom
  setTimeout(() => {
    const ma = document.getElementById("lla-messages");
    if (ma) ma.scrollTop = ma.scrollHeight;
  }, 50);

  try {
    const response = await sendToLLM(apiMessages);
    state.messages.push({ role: "assistant", content: response });
    saveHistory();
  } catch (e) {
    state.messages.push({
      role: "system-note",
      content: `❌ ${t("error")}: ${e.message}`,
    });
  }

  state.isLoading = false;
  rerender();

  setTimeout(() => {
    const ma = document.getElementById("lla-messages");
    if (ma) ma.scrollTop = ma.scrollHeight;
  }, 100);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Re-render helper
// ─────────────────────────────────────────────────────────────────────────────

function rerender() {
  if (rootEl) renderSidebar(rootEl);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Floating fallback panel (used if sidebar API is unavailable)
// ─────────────────────────────────────────────────────────────────────────────

function createFloatingPanel() {
  if (document.getElementById("lla-floating-panel")) return;

  // Toggle button always visible in top-right
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "lla-toggle-btn";
  toggleBtn.title = "LLM Assistant";
  toggleBtn.innerHTML = "🤖";
  toggleBtn.style.cssText = `
    position: fixed;
    top: 60px;
    right: 16px;
    z-index: 99999;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #0f3460;
    border: 2px solid #a0c4ff;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;
  toggleBtn.onmouseenter = () => { toggleBtn.style.background = "#1a5276"; toggleBtn.style.transform = "scale(1.1)"; };
  toggleBtn.onmouseleave = () => { toggleBtn.style.background = "#0f3460"; toggleBtn.style.transform = "scale(1)"; };

  const panel = document.createElement("div");
  panel.id = "lla-floating-panel";
  panel.style.cssText = `
    position: fixed;
    top: 60px;
    right: 68px;
    z-index: 99998;
    width: 420px;
    height: 75vh;
    max-height: 700px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
    overflow: hidden;
    display: none;
    border: 1px solid #2a3a5c;
    resize: both;
  `;

  let panelOpen = false;
  toggleBtn.onclick = () => {
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? "flex" : "none";
    panel.style.flexDirection = "column";
    if (panelOpen) {
      renderSidebar(panel);
    }
    toggleBtn.style.borderColor = panelOpen ? "#80ff80" : "#a0c4ff";
  };

  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);
  console.log("[LLM Assistant] Floating panel created (sidebar API fallback) ✅");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Extension registration
// ─────────────────────────────────────────────────────────────────────────────

app.registerExtension({
  name: "ComfyUI.LLMAssistant",

  async setup() {
    loadSettings();

    // Load workflow files in the background
    fetchWorkflowFiles()
      .then(data => { state.workflowFiles = data.workflows || []; })
      .catch(() => {});

    let sidebarRegistered = false;

    // Method 1: New extensionManager API (ComfyUI >= late 2024)
    try {
      if (app.extensionManager && typeof app.extensionManager.registerSidebarTab === "function") {
        app.extensionManager.registerSidebarTab({
          id: PLUGIN_ID,
          icon: "pi pi-comment",
          title: "LLM Assistant",
          tooltip: "AI Workflow Assistant — debug, generate, and optimize ComfyUI workflows",
          type: "custom",
          render: (el) => {
            el.style.height = "100%";
            renderSidebar(el);
          },
        });
        sidebarRegistered = true;
        console.log("[LLM Assistant] Sidebar tab registered via extensionManager ✅");
      }
    } catch (e) {
      console.warn("[LLM Assistant] extensionManager.registerSidebarTab failed:", e);
    }

    // Method 2: Register command to open panel (works alongside sidebar or standalone)
    try {
      if (app.extensionManager && typeof app.extensionManager.registerCommand === "function") {
        app.extensionManager.registerCommand({
          id: "llm-assistant.open",
          label: "🤖 LLM Assistant",
          icon: "pi pi-comment",
          function: () => {
            if (sidebarRegistered) {
              // Try to click the sidebar tab
              const selectors = [
                `[data-tab-id="${PLUGIN_ID}"]`,
                `.sidebar-tabs-container .tab-item[title="LLM Assistant"]`,
                `.p-tabview-nav li[data-id="${PLUGIN_ID}"]`,
                `button[title="LLM Assistant"]`,
              ];
              for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) { el.click(); return; }
              }
            }
            // Fallback: show floating panel
            const fp = document.getElementById("lla-floating-panel");
            const tb = document.getElementById("lla-toggle-btn");
            if (fp && tb) tb.click();
            else createFloatingPanel();
          },
        });
      }
    } catch (e) {
      console.warn("[LLM Assistant] registerCommand failed:", e);
    }

    // Fallback: always create floating toggle button so panel is ALWAYS accessible
    // It shows as a small robot button in the top-right corner
    try {
      createFloatingPanel();
    } catch (e) {
      console.warn("[LLM Assistant] Floating panel creation failed:", e);
    }

    console.log("[LLM Assistant] Extension loaded ✅");
  },
});
