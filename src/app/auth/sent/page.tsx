"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Check your email
        </h1>

        <p className="text-slate-600 mb-6">
          We sent a magic link to{" "}
          <span className="font-medium text-slate-900">{email || "your email"}</span>.
          Click the link to sign in.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 mb-6">
          <p>
            The link will expire in 24 hours. If you don&apos;t see the email,
            check your spam folder.
          </p>
        </div>

        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm"
        >
          Use a different email
        </Link>
      </div>
    </div>
  );
}

export default function AuthSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <SentContent />
    </Suspense>
  );
}
