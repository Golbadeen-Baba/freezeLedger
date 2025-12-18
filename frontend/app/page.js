"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/authStore";

export default function Home() {
  const { isAuthenticated, loading } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Auth System</h1>
          <p className="text-gray-600">
            Production-ready authentication with Django + Next.js
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <p className="text-green-600 font-semibold mb-2">
                ✓ Authenticated
              </p>
              <p className="text-gray-600 mb-4">
                You are logged in. Visit your dashboard to see your profile.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Sign in or create a new account to get started.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-indigo-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold text-center hover:bg-gray-300 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
