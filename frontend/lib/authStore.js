/**
 * Zustand store for authentication state management.
 *
 * State includes:
 * - user: authenticated user object or null
 * - isAuthenticated: boolean flag
 * - loading: boolean flag for async operations
 * - error: error message if any
 *
 * Persistence: Uses localStorage to persist auth state across page refreshes
 * Hydration: On app init, verify persisted tokens via /me endpoint
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      /**
       * Hydrate auth state on app initialization.
       *
       * Called once on app startup to verify if user is still authenticated.
       * Uses /me endpoint which requires valid access_token cookie.
       *
       * Flow:
       * 1. Check if we have persisted auth state
       * 2. If yes, call /me endpoint to verify tokens are still valid
       * 3. If 200: set user data and isAuthenticated = true
       * 4. If 401: clear auth state (tokens expired or invalid)
       * 5. Set loading = false
       *
       * Security: Relies on HttpOnly cookies, not localStorage tokens
       */
      hydrate: async () => {
        set({ loading: true });

        try {
          // Check if we have persisted auth state
          const savedState = localStorage.getItem("auth-store");
          if (!savedState) {
            // No saved auth state, so user is not authenticated
            set({
              user: null,
              isAuthenticated: false,
              error: null,
              loading: false,
            });
            return;
          }

          const parsed = JSON.parse(savedState);
          const state = parsed?.state;

          // If no persisted isAuthenticated flag, skip the /me call
          if (!state?.isAuthenticated) {
            set({
              user: null,
              isAuthenticated: false,
              error: null,
              loading: false,
            });
            return;
          }

          // User was authenticated before, verify if still valid via /me endpoint
          const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
            method: "GET",
            credentials: "include", // Include HttpOnly cookies
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true, error: null });
          } else if (response.status === 401) {
            // Tokens expired or invalid
            set({ user: null, isAuthenticated: false, error: null });
          } else {
            set({ error: "Failed to hydrate auth state" });
          }
        } catch (error) {
          // Network errors during hydration
          console.error("Hydration error:", error);
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Clear all auth state and logout locally.
       * Called after successful logout API call or on 401 from refresh.
       */
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          loading: false,
        });
      },
    }),
    {
      name: "auth-store", // localStorage key
      // Persist only user and isAuthenticated, not loading/error
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
