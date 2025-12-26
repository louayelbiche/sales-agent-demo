import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("Missing ANTHROPIC_API_KEY environment variable");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BrandAnalysisResult {
  brandVoice: {
    tone: string;
    personality: string[];
    dos: string[];
    donts: string[];
  };
  brandValues: string[];
  products: Array<{
    name: string;
    description: string;
    priceRange?: string;
  }>;
  targetAudience: string;
  companyName: string;
  tagline?: string;
  confidence: number;
}

export interface GeneratedEmailResult {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface RecipientPersona {
  name: string;
  email: string;
  role: string;
  company: string;
  leadTemperature: "HOT" | "WARM" | "COOL";
  personalizationHooks: {
    recentEvent?: string;
    painPoint?: string;
    industry?: string;
  };
}

export async function analyzeBrand(scrapedContent: string): Promise<BrandAnalysisResult> {
  const { BRAND_ANALYSIS_SYSTEM, BRAND_ANALYSIS_USER } = await import("./prompts/brand-analysis");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: BRAND_ANALYSIS_USER(scrapedContent),
      },
    ],
    system: BRAND_ANALYSIS_SYSTEM,
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr.trim()) as BrandAnalysisResult;
  } catch (error) {
    console.error("Failed to parse brand analysis:", content.text);
    throw new Error("Failed to parse brand analysis response");
  }
}

export async function generateRecipients(
  targetDesc: string,
  brandContext: BrandAnalysisResult,
  count: number = 8
): Promise<RecipientPersona[]> {
  const { RECIPIENT_GENERATION_SYSTEM, RECIPIENT_GENERATION_USER } = await import("./prompts/recipient-generation");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: RECIPIENT_GENERATION_USER(targetDesc, brandContext, count),
      },
    ],
    system: RECIPIENT_GENERATION_SYSTEM,
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr.trim()) as RecipientPersona[];
  } catch (error) {
    console.error("Failed to parse recipients:", content.text);
    throw new Error("Failed to parse recipient generation response");
  }
}

export async function generateEmail(
  recipient: RecipientPersona,
  brandAnalysis: BrandAnalysisResult,
  campaignPurpose: string
): Promise<GeneratedEmailResult> {
  const { EMAIL_GENERATION_SYSTEM, EMAIL_GENERATION_USER } = await import("./prompts/email-generation");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: EMAIL_GENERATION_USER(recipient, brandAnalysis, campaignPurpose),
      },
    ],
    system: EMAIL_GENERATION_SYSTEM(brandAnalysis),
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr.trim()) as GeneratedEmailResult;
  } catch (error) {
    console.error("Failed to parse email:", content.text);
    throw new Error("Failed to parse email generation response");
  }
}
