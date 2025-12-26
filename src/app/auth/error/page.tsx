"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const errorMessages: Record<string, { title: string; message: string }> = {
  missing_token: {
    title: "Missing Token",
    message: "The magic link is invalid. Please request a new one.",
  },
  invalid_token: {
    title: "Invalid or Expired Link",
    message: "This magic link has expired or has already been used. Please request a new one.",
  },
  server_error: {
    title: "Something Went Wrong",
    message: "We encountered an error. Please try again.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "server_error";
  const { title, message } = errorMessages[reason] || errorMessages.server_error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>

        <p className="text-slate-600 mb-6">{message}</p>

        <Link
          href="/"
          className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
