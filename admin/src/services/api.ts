// Base API URL configuration for Vite
// Reads from VITE_API_URL, defaults to https://sneha-bazar.onrender.com/api in production builds,
// and falls back to http://localhost:5000/api during local development.
const DEFAULT_DEV_API_URL = "http://localhost:5000/api";
const DEFAULT_PROD_API_URL = "https://sneha-bazar.onrender.com/api";

const rawApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);
const cleanBaseUrl = rawApiUrl.replace(/\/+$/, "");
const API_BASE_URL = cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const getUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export const api = {
  get: async <T = unknown>(endpoint: string): Promise<T> => {
    const response = await fetch(getUrl(endpoint));
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data as T;
  },

  post: async (endpoint: string, body: unknown) => {
    const response = await fetch(getUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  },

  postFormData: async (endpoint: string, formData: FormData) => {
    const response = await fetch(getUrl(endpoint), {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  },

  put: async (endpoint: string, body: unknown) => {
    const response = await fetch(getUrl(endpoint), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  },

  putFormData: async (endpoint: string, formData: FormData) => {
    const response = await fetch(getUrl(endpoint), {
      method: "PUT",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  },

  delete: async (endpoint: string) => {
    const response = await fetch(getUrl(endpoint), {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  },
};