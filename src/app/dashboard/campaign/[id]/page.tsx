"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Email {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string | null;
  recipientCompany: string | null;
  leadTemperature: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: string;
  sentAt: string | null;
}

interface Campaign {
  id: string;
  name: string;
  purpose: string;
  targetDesc: string;
  status: string;
  business: {
    name: string;
    websiteUrl: string;
  };
  emails: Email[];
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      if (data.success) {
        setCampaign(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load campaign");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/campaigns/${id}/generate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      await fetchCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (emailId: string) => {
    setSendingId(emailId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/campaigns/${id}/emails/${emailId}/send`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSuccess(`Email sent to ${data.data.sentTo}`);
      await fetchCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  const getTemperatureBadge = (temp: string) => {
    const styles: Record<string, string> = {
      HOT: "bg-red-100 text-red-800",
      WARM: "bg-orange-100 text-orange-800",
      COOL: "bg-blue-100 text-blue-800",
      COLD: "bg-slate-100 text-slate-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[temp] || styles.COLD}`}>
        {temp}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PREVIEW: "bg-slate-100 text-slate-800",
      SENDING: "bg-yellow-100 text-yellow-800",
      SENT: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PREVIEW}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-slate-600">{error || "Campaign not found"}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const hasEmails = campaign.emails.length > 0;
  const isGenerating = generating || campaign.status === "GENERATING";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
            <p className="text-slate-600">
              {campaign.business.name} &middot; {campaign.emails.length} emails
            </p>
          </div>
          {!hasEmails && !isGenerating && (
            <button
              onClick={handleGenerate}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Generate Emails
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Content */}
      {isGenerating ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Generating Emails...
          </h2>
          <p className="text-slate-600">
            We&apos;re creating personalized emails for your campaign. This may take a minute.
          </p>
        </div>
      ) : !hasEmails ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-slate-600">Purpose:</span>
              <p className="text-slate-900">{campaign.purpose}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600">Target Audience:</span>
              <p className="text-slate-900">{campaign.targetDesc}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4">
              Ready to generate personalized emails for this campaign?
            </p>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Generate Emails
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Generated Emails
            </h2>
            {campaign.emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedEmail?.id === email.id
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900 truncate">
                    {email.recipientName}
                  </span>
                  {getTemperatureBadge(email.leadTemperature)}
                </div>
                <p className="text-sm text-slate-600 truncate">
                  {email.recipientRole} at {email.recipientCompany}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 truncate max-w-[150px]">
                    {email.subject}
                  </span>
                  {getStatusBadge(email.status)}
                </div>
              </button>
            ))}
          </div>

          {/* Email Preview */}
          <div className="lg:col-span-2">
            {selectedEmail ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {selectedEmail.recipientName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {selectedEmail.recipientRole} at {selectedEmail.recipientCompany}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedEmail.recipientEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTemperatureBadge(selectedEmail.leadTemperature)}
                      {getStatusBadge(selectedEmail.status)}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-slate-600">Subject: </span>
                    <span className="text-slate-900">{selectedEmail.subject}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                </div>
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  {selectedEmail.status === "SENT" ? (
                    <p className="text-green-600 text-sm text-center">
                      Sent to your inbox
                    </p>
                  ) : (
                    <button
                      onClick={() => handleSend(selectedEmail.id)}
                      disabled={sendingId === selectedEmail.id}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingId === selectedEmail.id
                        ? "Sending..."
                        : "Send to My Inbox"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-600">
                  Select an email from the list to preview it.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
