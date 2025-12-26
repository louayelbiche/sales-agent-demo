"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  websiteUrl: string;
}

function CampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId");

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(businessId || "");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [targetDesc, setTargetDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await fetch("/api/business");
        const data = await res.json();
        if (data.success) {
          const analyzed = data.data.filter(
            (b: Business & { analysisStatus: string }) => b.analysisStatus === "COMPLETED"
          );
          setBusinesses(analyzed);
          if (!selectedBusinessId && analyzed.length > 0) {
            setSelectedBusinessId(analyzed[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch businesses:", err);
      }
    };

    fetchBusinesses();
  }, [selectedBusinessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          name,
          purpose,
          targetDesc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      router.push(`/dashboard/campaign/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 bg-white rounded-xl border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          No Analyzed Businesses
        </h2>
        <p className="text-slate-600 mb-4">
          You need to analyze a business before creating a campaign.
        </p>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-block"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">
        Create New Campaign
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Business Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Business
          </label>
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q1 Product Launch"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Campaign Purpose
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe the goal of this campaign. What are you promoting? What action do you want recipients to take?"
            required
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <p className="mt-1 text-sm text-slate-500">
            Be specific about offers, deadlines, and desired outcomes.
          </p>
        </div>

        {/* Target Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Target Audience
          </label>
          <textarea
            value={targetDesc}
            onChange={(e) => setTargetDesc(e.target.value)}
            placeholder="Describe who you want to reach. What industries? What roles? What pain points do they have?"
            required
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <p className="mt-1 text-sm text-slate-500">
            We&apos;ll generate realistic recipient personas based on this description.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name || !purpose || !targetDesc}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    }>
      <CampaignForm />
    </Suspense>
  );
}
