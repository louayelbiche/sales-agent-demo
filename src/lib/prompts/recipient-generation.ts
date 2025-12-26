import type { BrandAnalysisResult } from "../claude";

export const RECIPIENT_GENERATION_SYSTEM = `You are generating realistic customer personas for a sales demo. Create believable individuals who would be interested in the brand's products/services.

## Persona Requirements
1. Names should be realistic and diverse (mix of backgrounds)
2. Companies should be plausible for the target audience
3. Roles should match decision-maker profiles
4. Each persona should have a unique personalization hook
5. Mix lead temperatures: 2-3 HOT, 3-4 WARM, 2-3 COOL

## Lead Temperature Definitions
- HOT: Ready to buy, has shown strong interest, asking about pricing
- WARM: Interested but needs more information, comparing options
- COOL: Good fit but hasn't engaged much yet, needs nurturing

Respond ONLY with valid JSON array. No additional text.`;

export const RECIPIENT_GENERATION_USER = (
  targetDesc: string,
  brandContext: BrandAnalysisResult,
  count: number
) => `Generate ${count} realistic customer personas for a sales campaign.

## Target Audience Description
${targetDesc}

## Brand Context
- Company: ${brandContext.companyName}
- Products: ${brandContext.products.map(p => p.name).join(", ")}
- Target Audience: ${brandContext.targetAudience}

---

Generate ${count} personas as a JSON array with this structure for each:

[
  {
    "name": "Full Name",
    "email": "firstname.lastname@example.com",
    "role": "Job Title",
    "company": "Company Name (fictional but realistic)",
    "leadTemperature": "HOT" | "WARM" | "COOL",
    "personalizationHooks": {
      "recentEvent": "string - something recent that makes outreach timely (e.g., 'just raised Series A', 'recently promoted')",
      "painPoint": "string - a likely pain point based on their role",
      "industry": "string - their industry/vertical"
    }
  }
]

Ensure diversity in names, companies, roles, and lead temperatures.`;
