import { vi } from "vitest";

// Mock Claude/Anthropic responses
export const mockBrandAnalysis = {
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

export const mockRecipients = [
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

export const mockGeneratedEmail = {
  subject: "Transform Your Business with Test Company",
  bodyHtml: "<p>Hi {{name}},</p><p>Great email content here...</p>",
  bodyText: "Hi {{name}},\n\nGreat email content here...",
};

// Create mock function for messages.create - will be set up in test files
export const mockMessagesCreate = vi.fn();

// Mock the Anthropic client
export const mockAnthropicClient = {
  messages: {
    create: mockMessagesCreate,
  },
};

export function resetClaudeMocks() {
  mockMessagesCreate.mockReset();
}

export function mockClaudeBrandAnalysis() {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockBrandAnalysis) }],
  });
}

export function mockClaudeRecipients() {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockRecipients) }],
  });
}

export function mockClaudeEmail() {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockGeneratedEmail) }],
  });
}

export function mockClaudeFailure(error = "Claude API error") {
  mockMessagesCreate.mockRejectedValue(new Error(error));
}
