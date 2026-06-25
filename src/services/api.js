const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "")
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

  const response = await fetch(`${API_URL}/auth/csrf`, {
    method: "GET",
    credentials: "include",
  });

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

export function clearLegacyAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token) {
  if (!token) {
    clearLegacyAuthToken();
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const method = options.method || "GET";
  const csrfToken = shouldAttachCsrf(method) ? await ensureCsrfToken() : "";

  async function makeRequest(nextCsrfToken = csrfToken) {
    const timeout = createTimeoutSignal(options.timeoutMs);

    try {
      return await fetch(`${API_URL}${path}`, {
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

  const response = await fetch(`${API_URL}${path}`, {
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
      return await fetch(`${API_URL}${path}`, {
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
