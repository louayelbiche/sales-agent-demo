"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BrandVoice {
  tone: string;
  personality: string[];
  dos: string[];
  donts: string[];
}

interface Product {
  name: string;
  description: string;
  priceRange?: string;
}

interface Business {
  id: string;
  name: string;
  websiteUrl: string;
  analysisStatus: string;
  brandVoice: BrandVoice | null;
  brandValues: string[];
  products: Product[] | null;
  targetAudience: string | null;
  analyzedAt: string | null;
}

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const res = await fetch(`/api/business/${id}`);
      const data = await res.json();
      if (data.success) {
        setBusiness(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load business");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch(`/api/business/${id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setBusiness(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-slate-600">{error || "Business not found"}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isAnalyzed = business.analysisStatus === "COMPLETED";
  const isAnalyzing = analyzing || business.analysisStatus === "SCRAPING" || business.analysisStatus === "ANALYZING";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <p className="text-slate-600">{business.websiteUrl}</p>
        </div>

        {isAnalyzed && (
          <Link
            href={`/dashboard/campaign/new?businessId=${business.id}`}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Create Campaign
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Analysis Section */}
      {!isAnalyzed ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {isAnalyzing ? "Analyzing Website..." : "Website Not Analyzed"}
          </h2>
          <p className="text-slate-600 mb-6">
            {isAnalyzing
              ? "We're scraping your website and extracting brand information. This may take a minute."
              : "Click the button below to analyze this website and extract brand information."}
          </p>
          {isAnalyzing ? (
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          ) : (
            <button
              onClick={handleAnalyze}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Analyze Website
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Brand Voice */}
          {business.brandVoice && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Brand Voice
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Tone:</span>
                  <p className="text-slate-900">{business.brandVoice.tone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Personality:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {business.brandVoice.personality.map((trait, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-green-600">Do:</span>
                    <ul className="mt-1 space-y-1">
                      {business.brandVoice.dos.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-red-600">Don&apos;t:</span>
                    <ul className="mt-1 space-y-1">
                      {business.brandVoice.donts.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Brand Values */}
          {business.brandValues.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Brand Values
              </h2>
              <div className="flex flex-wrap gap-2">
                {business.brandValues.map((value, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {business.products && business.products.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Products & Services
              </h2>
              <div className="space-y-4">
                {business.products.map((product, i) => (
                  <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium text-slate-900">{product.name}</h3>
                    <p className="text-sm text-slate-600">{product.description}</p>
                    {product.priceRange && (
                      <span className="text-sm text-green-600 mt-1 inline-block">
                        {product.priceRange}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Audience */}
          {business.targetAudience && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Target Audience
              </h2>
              <p className="text-slate-700">{business.targetAudience}</p>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white text-center">
            <h2 className="text-xl font-semibold mb-2">Ready to create a campaign?</h2>
            <p className="text-blue-100 mb-4">
              Generate personalized sales emails using your brand voice.
            </p>
            <Link
              href={`/dashboard/campaign/new?businessId=${business.id}`}
              className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50"
            >
              Create Campaign
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
