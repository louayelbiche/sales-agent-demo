"use client";

import { useState } from "react";
import Link from "next/link";

interface Email {
  id: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
}

interface Campaign {
  id: string;
  name: string;
  purpose: string;
  status: string;
  createdAt: string;
  business: {
    name: string;
    websiteUrl: string;
  };
  emails: Email[];
  _count: {
    emails: number;
  };
}

interface CampaignRowProps {
  campaign: Campaign;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CampaignRow({
  campaign,
  expanded,
  onToggleExpand,
  onDelete,
}: CampaignRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCampaignStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-slate-100 text-slate-800",
      GENERATING: "bg-yellow-100 text-yellow-800",
      READY: "bg-blue-100 text-blue-800",
      SENT: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-800"}`}
      >
        {status}
      </span>
    );
  };

  const getEmailStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PREVIEW: "bg-slate-100 text-slate-800",
      SENDING: "bg-yellow-100 text-yellow-800",
      SENT: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-800"}`}
      >
        {status}
      </span>
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(campaign.id);
    } catch {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Campaign Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-4 text-left"
        >
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {campaign.name}
              </h3>
              {getCampaignStatusBadge(campaign.status)}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {campaign._count.emails} email{campaign._count.emails !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {campaign.business.name} &middot; {formatDate(campaign.createdAt)}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 ml-4">
          <Link
            href={`/dashboard/campaign/${campaign.id}`}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Campaign"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </Link>

          {showConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                {isDeleting ? (
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Campaign"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Email List */}
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50">
          {campaign.emails.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 text-center">
              No emails generated yet
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {campaign.emails.map((email) => (
                <div key={email.id} className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">
                        {email.recipientName}
                      </span>
                      <span className="text-slate-400 text-sm truncate">
                        &lt;{email.recipientEmail}&gt;
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">
                      {email.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {getEmailStatusBadge(email.status)}
                    {email.sentAt && (
                      <span className="text-xs text-slate-500">
                        {formatDate(email.sentAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
