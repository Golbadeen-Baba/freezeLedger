/**
 * Client-side providers and initialization.
 *
 * Handles:
 * - Auth state hydration on app startup
 * - Client-side only rendering
 */

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";

export function AuthProvider({ children }) {
  useEffect(() => {
    // Hydrate auth state on app mount
    // This verifies if user is still authenticated via /me endpoint
    useAuthStore.getState().hydrate();
  }, []);

  return <>{children}</>;
}
