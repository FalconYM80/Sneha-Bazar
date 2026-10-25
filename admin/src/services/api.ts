// Base API URL configuration for Vite
// Reads from VITE_API_URL, defaults to https://sneha-bazar.onrender.com/api in production builds,
// rejects obsolete Railway URLs, and falls back to http://localhost:5000/api during local development.
const DEFAULT_DEV_API_URL = "http://localhost:5000/api";
const DEFAULT_PROD_API_URL = "https://sneha-bazar.onrender.com/api";

const rawEnvUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const isObsoleteRailway = Boolean(rawEnvUrl && rawEnvUrl.includes("railway.app"));
const rawApiUrl =
  rawEnvUrl && !isObsoleteRailway
    ? rawEnvUrl
    : import.meta.env.PROD
      ? DEFAULT_PROD_API_URL
      : DEFAULT_DEV_API_URL;
const cleanBaseUrl = rawApiUrl.replace(/\/+$/, "");
const API_BASE_URL = cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const TOKEN_KEY = "sneha_admin_token";
const USER_KEY = "sneha_admin_user";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminUser;
    token: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: AdminUser;
}

// Session-based token storage avoids sensitive long-lived persistence in localStorage
// while properly persisting state across page refreshes within the tab.
export const getAdminToken = (): string | null => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string): void => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error("Failed to persist admin token", e);
  }
};

export const clearAdminToken = (): void => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const getAdminUser = (): AdminUser | null => {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAdminUser = (user: AdminUser): void => {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to persist admin user", e);
  }
};

export const clearAdminUser = (): void => {
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch {}
};

export const clearAuthSession = (): void => {
  clearAdminToken();
  clearAdminUser();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("admin:unauthorized"));
  }
};

const getUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

const getAuthHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...additionalHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  let data: any;
  try {
    data = await response.json();
  } catch {
    data = { message: `Request failed with status ${response.status}` };
  }

  if (response.status === 401) {
    clearAuthSession();
    throw new Error(data.message || "Session expired or unauthorized. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data as T;
};

export const api = {
  get: async <T = unknown>(endpoint: string): Promise<T> => {
    const response = await fetch(getUrl(endpoint), {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    return handleResponse<T>(response);
  },

  post: async (endpoint: string, body: unknown) => {
    const response = await fetch(getUrl(endpoint), {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      credentials: "include",
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  postFormData: async (endpoint: string, formData: FormData) => {
    const response = await fetch(getUrl(endpoint), {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: formData,
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, body: unknown) => {
    const response = await fetch(getUrl(endpoint), {
      method: "PUT",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      credentials: "include",
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  putFormData: async (endpoint: string, formData: FormData) => {
    const response = await fetch(getUrl(endpoint), {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: formData,
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string) => {
    const response = await fetch(getUrl(endpoint), {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  auth: {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      const response = await fetch(getUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { message: "Failed to connect to authentication server" };
      }

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      const loginData = data as LoginResponse;
      if (loginData.data?.token) {
        setAdminToken(loginData.data.token);
      }
      if (loginData.data?.admin) {
        setAdminUser(loginData.data.admin);
      }

      return loginData;
    },

    logout: async (): Promise<void> => {
      try {
        await fetch(getUrl("/auth/logout"), {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
        });
      } catch (err) {
        console.warn("Logout request failed:", err);
      } finally {
        clearAdminToken();
        clearAdminUser();
      }
    },

    getProfile: async (): Promise<ProfileResponse> => {
      const response = await fetch(getUrl("/auth/me"), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      return handleResponse<ProfileResponse>(response);
    },
  },
};