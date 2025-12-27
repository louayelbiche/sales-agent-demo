"use client";

import { useState } from "react";
import BusinessesTab from "@/components/dashboard/BusinessesTab";
import HistoryTab from "@/components/dashboard/HistoryTab";

type Tab = "businesses" | "history";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("businesses");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab("businesses")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === "businesses"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Businesses
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "businesses" ? <BusinessesTab /> : <HistoryTab />}
    </div>
  );
}
