import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock data - defined before vi.mock
const mockBrandAnalysis = {
  companyName: "Test Company",
  brandVoice: {
    tone: "professional",
    personality: ["innovative", "trustworthy", "friendly"],
    dos: ["Be helpful", "Use clear language"],
    donts: ["Be pushy", "Use jargon"],
  },
  brandValues: ["Quality", "Innovation", "Customer Focus"],
  products: [
    { name: "Product A", description: "A great product" },
    { name: "Product B", description: "Another great product" },
  ],
  targetAudience: "Small business owners",
  confidence: 0.85,
};

const mockRecipients = [
  {
    name: "John Smith",
    email: "john@example.com",
    role: "CEO",
    company: "Acme Inc",
    leadTemperature: "HOT",
    personalizationHooks: { recentEvent: "Recent expansion into new markets" },
  },
  {
    name: "Jane Doe",
    email: "jane@example.com",
    role: "Marketing Director",
    company: "TechCorp",
    leadTemperature: "WARM",
    personalizationHooks: { painPoint: "Interest in automation tools" },
  },
];

const mockGeneratedEmail = {
  subject: "Transform Your Business with Test Company",
  bodyHtml: "<p>Hi {{name}},</p><p>Great email content here...</p>",
  bodyText: "Hi {{name}},\n\nGreat email content here...",
};

// Hoisted mock setup - will be available before imports
const { mockMessagesCreate } = vi.hoisted(() => {
  return {
    mockMessagesCreate: vi.fn(),
  };
});

// Set up the mock - use a class that can be instantiated with `new`
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: mockMessagesCreate,
    };
  }

  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

// Import after mocks are set up
import { analyzeBrand, generateRecipients, generateEmail } from "@/lib/claude";

function resetClaudeMocks() {
  mockMessagesCreate.mockReset();
}

function mockClaudeBrandAnalysis() {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockBrandAnalysis) }],
  });
}

function mockClaudeRecipients() {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockRecipients) }],
  });
}

function mockClaudeEmail() {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockGeneratedEmail) }],
  });
}

describe("Claude AI Integration", () => {
  beforeEach(() => {
    resetClaudeMocks();
  });

  describe("analyzeBrand", () => {
    it("should analyze brand from scraped content", async () => {
      mockClaudeBrandAnalysis();

      const result = await analyzeBrand("Sample website content about a company");

      expect(result).toEqual(mockBrandAnalysis);
      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
        })
      );
    });

    it("should parse JSON from markdown code blocks", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "```json\n" + JSON.stringify(mockBrandAnalysis) + "\n```" }],
      });

      const result = await analyzeBrand("Sample content");

      expect(result).toEqual(mockBrandAnalysis);
    });

    it("should throw error for non-text response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "image", source: {} }],
      });

      await expect(analyzeBrand("Sample content")).rejects.toThrow(
        "Unexpected response type from Claude"
      );
    });

    it("should throw error for invalid JSON response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "This is not valid JSON" }],
      });

      await expect(analyzeBrand("Sample content")).rejects.toThrow(
        "Failed to parse brand analysis response"
      );
    });

    it("should handle API failure gracefully", async () => {
      mockMessagesCreate.mockRejectedValue(new Error("API rate limit exceeded"));

      await expect(analyzeBrand("Sample content")).rejects.toThrow(
        "API rate limit exceeded"
      );
    });
  });

  describe("generateRecipients", () => {
    it("should generate recipient personas", async () => {
      mockClaudeRecipients();

      const result = await generateRecipients(
        "small business owners in tech",
        mockBrandAnalysis,
        8
      );

      expect(result).toEqual(mockRecipients);
      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
        })
      );
    });

    it("should use default count of 8 recipients", async () => {
      mockClaudeRecipients();

      await generateRecipients("target description", mockBrandAnalysis);

      expect(mockMessagesCreate).toHaveBeenCalled();
    });

    it("should parse JSON from markdown code blocks", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "```\n" + JSON.stringify(mockRecipients) + "\n```" }],
      });

      const result = await generateRecipients("target", mockBrandAnalysis);

      expect(result).toEqual(mockRecipients);
    });

    it("should throw error for non-text response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "tool_use", id: "123", name: "test", input: {} }],
      });

      await expect(
        generateRecipients("target", mockBrandAnalysis)
      ).rejects.toThrow("Unexpected response type from Claude");
    });

    it("should throw error for invalid JSON response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Invalid JSON here" }],
      });

      await expect(
        generateRecipients("target", mockBrandAnalysis)
      ).rejects.toThrow("Failed to parse recipient generation response");
    });
  });

  describe("generateEmail", () => {
    const mockRecipient = {
      name: "John Smith",
      email: "john@example.com",
      role: "CEO",
      company: "Acme Inc",
      leadTemperature: "HOT" as const,
      personalizationHooks: {
        recentEvent: "Company expansion",
        painPoint: "Scaling challenges",
      },
    };

    it("should generate personalized email", async () => {
      mockClaudeEmail();

      const result = await generateEmail(
        mockRecipient,
        mockBrandAnalysis,
        "Introduce our new product"
      );

      expect(result).toEqual(mockGeneratedEmail);
      expect(result.subject).toBeDefined();
      expect(result.bodyHtml).toBeDefined();
      expect(result.bodyText).toBeDefined();
    });

    it("should use correct model and token limit", async () => {
      mockClaudeEmail();

      await generateEmail(mockRecipient, mockBrandAnalysis, "Campaign purpose");

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
        })
      );
    });

    it("should parse JSON from markdown code blocks", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "```json\n" + JSON.stringify(mockGeneratedEmail) + "\n```" }],
      });

      const result = await generateEmail(
        mockRecipient,
        mockBrandAnalysis,
        "purpose"
      );

      expect(result).toEqual(mockGeneratedEmail);
    });

    it("should throw error for non-text response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "image", source: {} }],
      });

      await expect(
        generateEmail(mockRecipient, mockBrandAnalysis, "purpose")
      ).rejects.toThrow("Unexpected response type from Claude");
    });

    it("should throw error for invalid JSON response", async () => {
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: "text", text: "Not a valid email JSON" }],
      });

      await expect(
        generateEmail(mockRecipient, mockBrandAnalysis, "purpose")
      ).rejects.toThrow("Failed to parse email generation response");
    });
  });
});

describe("Claude API Error Handling", () => {
  beforeEach(() => {
    resetClaudeMocks();
  });

  it("should propagate network errors", async () => {
    mockMessagesCreate.mockRejectedValue(
      new Error("Network error")
    );

    await expect(analyzeBrand("content")).rejects.toThrow("Network error");
  });

  it("should propagate authentication errors", async () => {
    mockMessagesCreate.mockRejectedValue(
      new Error("Invalid API key")
    );

    await expect(analyzeBrand("content")).rejects.toThrow("Invalid API key");
  });

  it("should propagate rate limit errors", async () => {
    mockMessagesCreate.mockRejectedValue(
      new Error("Rate limit exceeded")
    );

    await expect(analyzeBrand("content")).rejects.toThrow("Rate limit exceeded");
  });
});
