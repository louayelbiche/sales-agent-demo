// Re-export Prisma types
export type {
  User,
  MagicToken,
  Session,
  Business,
  Campaign,
  GeneratedEmail,
} from "@prisma/client";

export type { AnalysisStatus, CampaignStatus, EmailStatus, LeadTemperature } from "@prisma/client";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface SessionUser {
  id: string;
  email: string;
}

// Brand Analysis types (matches Claude output)
export interface BrandVoice {
  tone: string;
  personality: string[];
  dos: string[];
  donts: string[];
}

export interface BrandProduct {
  name: string;
  description: string;
  priceRange?: string | null;
}

export interface BrandAnalysis {
  companyName: string;
  tagline?: string | null;
  brandVoice: BrandVoice;
  brandValues: string[];
  products: BrandProduct[];
  targetAudience: string;
  confidence: number;
}

// Business with parsed brand data
export interface BusinessWithBrand {
  id: string;
  name: string;
  websiteUrl: string;
  analysisStatus: string;
  brandVoice: BrandVoice | null;
  brandValues: string[];
  products: BrandProduct[];
  targetAudience: string | null;
  analyzedAt: Date | null;
}

// Campaign form data
export interface CampaignFormData {
  name: string;
  purpose: string;
  targetDesc: string;
  businessId: string;
}

// Email preview data
export interface EmailPreview {
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
  sentAt: Date | null;
}
