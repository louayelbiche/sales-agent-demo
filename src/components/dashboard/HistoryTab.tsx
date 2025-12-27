"use client";

import { useEffect, useState } from "react";
import CampaignRow from "./CampaignRow";

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

export default function HistoryTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setError("");
      const res = await fetch("/api/campaigns?includeEmails=true");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch campaigns");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete campaign");
    }

    // Remove from local state (optimistic update already handled by removing)
    setCampaigns(campaigns.filter((c) => c.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 bg-slate-200 rounded" />
              <div className="flex-1">
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchCampaigns}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <svg
          className="w-12 h-12 text-slate-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-slate-600 mb-2">No campaigns yet</p>
        <p className="text-sm text-slate-500">
          Create a campaign from one of your analyzed businesses to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <CampaignRow
          key={campaign.id}
          campaign={campaign}
          expanded={expandedId === campaign.id}
          onToggleExpand={() => toggleExpand(campaign.id)}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
