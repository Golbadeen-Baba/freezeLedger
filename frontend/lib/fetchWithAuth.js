/**
 * Global fetch wrapper with automatic JWT refresh on 401.
 *
 * Features:
 * - Always includes credentials: 'include' for cookie transmission
 * - Intercepts 401 Unauthorized responses
 * - Automatically calls /refresh endpoint
 * - Retries original request with new access token
 * - Clears auth state and redirects to /login on refresh failure
 * - Prevents infinite 401 loops
 *
 * Security rationale:
 * - Credentials: 'include' is REQUIRED for HttpOnly cookies to be sent
 * - Refresh logic is transparent to callers
 * - On refresh failure, clears auth state to prevent infinite loops
 */

import { useAuthStore } from "./authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Check if a request is to the auth endpoints themselves.
 * We don't retry these to avoid infinite loops.
 */
function isAuthEndpoint(url) {
  return (
    url.includes("/auth/login/") ||
    url.includes("/auth/refresh/") ||
    url.includes("/auth/logout/")
  );
}

/**
 * Main fetch wrapper that handles 401 and automatic refresh.
 *
 * @param {string} url - Full URL or path
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchWithAuth(url, options = {}) {
  // Always include credentials for cookies
  const fetchOptions = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // First attempt
  let response = await fetch(url, fetchOptions);

  // If not 401 or is auth endpoint, return as-is
  if (response.status !== 401 || isAuthEndpoint(url)) {
    return response;
  }

  // 401: Try to refresh token
  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (refreshResponse.ok) {
      // Refresh successful, retry original request
      response = await fetch(url, fetchOptions);
      return response;
    } else {
      // Refresh failed (401): tokens are invalid/expired
      // Clear auth state and redirect to login
      useAuthStore.getState().clearAuth();

      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return refreshResponse;
    }
  } catch (error) {
    // Network error during refresh
    console.error("Token refresh failed:", error);

    // Clear auth state as precaution
    useAuthStore.getState().clearAuth();

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw error;
  }
}

/**
 * Convenience wrapper for GET requests.
 */
export function fetchGet(url, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "GET",
  });
}

/**
 * Convenience wrapper for POST requests.
 */
export function fetchPost(url, data, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Convenience wrapper for PUT requests.
 */
export function fetchPut(url, data, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Convenience wrapper for DELETE requests.
 */
export function fetchDelete(url, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "DELETE",
  });
}
