const DEFAULT_PRODUCTION_API_URL = "https://forgeflow-citr.onrender.com";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : DEFAULT_PRODUCTION_API_URL)
).replace(/\/$/, "");

const TOKEN_KEY = "forgeflow:token";

let cachedCsrfToken = "";

function shouldAttachCsrf(method = "GET") {
  return !["GET", "HEAD", "OPTIONS"].includes(
    String(method || "GET").toUpperCase(),
  );
}

const DEFAULT_TIMEOUT_MS = 12000;

function createTimeoutSignal(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
}

async function ensureCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;

  const timeout = createTimeoutSignal();

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: "GET",
      credentials: "include",
      signal: timeout.signal,
    });
  } finally {
    timeout.clear();
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return "";
  }

  cachedCsrfToken = data?.csrfToken || "";
  return cachedCsrfToken;
}

export function setCsrfToken(token) {
  cachedCsrfToken = token || cachedCsrfToken;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token) {
  if (!token) {
    logout();
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  // O CSRF em cache pertence à sessão que acabou de terminar; mantê-lo faria a
  // próxima sessão começar com um token inválido.
  cachedCsrfToken = "";
}

const WARM_UP_MAX_ATTEMPTS = 3;
let warmUpPromise = null;

/**
 * Acorda a API (o plano free do Render hiberna) e adianta o token CSRF.
 * É best-effort: nunca lança, nunca bloqueia navegação e roda no máximo uma
 * vez por carregamento de página.
 */
export function warmUpApi() {
  if (warmUpPromise) return warmUpPromise;

  warmUpPromise = (async () => {
    for (let attempt = 0; attempt < WARM_UP_MAX_ATTEMPTS; attempt += 1) {
      try {
        await ensureCsrfToken();
        return true;
      } catch {
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }
    }

    return false;
  })();

  return warmUpPromise;
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const method = options.method || "GET";
  const csrfToken = shouldAttachCsrf(method) ? await ensureCsrfToken() : "";

  async function makeRequest(nextCsrfToken = csrfToken) {
    const timeout = createTimeoutSignal(options.timeoutMs);

    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        signal: options.signal || timeout.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(nextCsrfToken ? { "X-CSRF-Token": nextCsrfToken } : {}),
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        const timeoutError = new Error(
          "A conexão demorou demais. Verifique sua internet e tente novamente.",
        );
        timeoutError.status = 408;
        throw timeoutError;
      }

      throw error;
    } finally {
      timeout.clear();
    }
  }

  let response = await makeRequest();
  let data = await response.json().catch(() => null);

  if (!response.ok && data?.reason === "csrf_failed") {
    cachedCsrfToken = "";
    const freshCsrfToken = await ensureCsrfToken();
    response = await makeRequest(freshCsrfToken);
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Erro na requisição.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (data?.csrfToken) {
    setCsrfToken(data.csrfToken);
  }

  return data;
}

export async function apiDownload(path, filename, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.password ? { "X-ForgeFlow-Password": options.password } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Erro ao baixar arquivo.";

    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // A resposta pode não ser JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function apiFormData(path, formData, options = {}) {
  const token = getToken();
  const method = options.method || "POST";
  const csrfToken = shouldAttachCsrf(method) ? await ensureCsrfToken() : "";

  async function makeRequest(nextCsrfToken = csrfToken) {
    const timeout = createTimeoutSignal(options.timeoutMs);

    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        signal: options.signal || timeout.signal,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(nextCsrfToken ? { "X-CSRF-Token": nextCsrfToken } : {}),
          ...(options.headers || {}),
        },
        body: formData,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        const timeoutError = new Error(
          "O envio demorou demais. Verifique sua internet e tente novamente.",
        );
        timeoutError.status = 408;
        throw timeoutError;
      }

      throw error;
    } finally {
      timeout.clear();
    }
  }

  let response = await makeRequest();
  let data = await response.json().catch(() => null);

  if (!response.ok && data?.reason === "csrf_failed") {
    cachedCsrfToken = "";
    const freshCsrfToken = await ensureCsrfToken();
    response = await makeRequest(freshCsrfToken);
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new Error(data?.message || "Erro na requisição.");
  }

  if (data?.csrfToken) {
    setCsrfToken(data.csrfToken);
  }

  return data;
}

export async function getCurrentUser() {
  const data = await apiFetch("/auth/session");
  setCsrfToken(data?.csrfToken);
  return data;
}

export async function logoutFromApi() {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
    });
  } catch {
    // fallback local continua sendo executado no AuthContext
  }
}
