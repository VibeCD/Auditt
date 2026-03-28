/** Maximum file upload size in bytes (10 MB) */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum number of gap questions to show the user */
export const MAX_GAP_QUESTIONS = 7;

/** Maximum characters from source content to send to model */
export const MAX_INPUT_CHARS = 6000;

/** Rate limit: max requests per window per IP */
export const RATE_LIMIT_MAX = 10;

/** Rate limit window in milliseconds (1 hour) */
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/** AI model name for NVIDIA NIM OpenAI-compatible endpoint */
export const NIM_MODEL = "moonshotai/kimi-k2-thinking";
