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
    temperature: "HOT",
    personalization: { hook: "Recent expansion into new markets" },
  },
  {
    name: "Jane Doe",
    email: "jane@example.com",
    role: "Marketing Director",
    company: "TechCorp",
    temperature: "WARM",
    personalization: { hook: "Interest in automation tools" },
  },
];

export const mockGeneratedEmail = {
  subject: "Transform Your Business with Test Company",
  bodyHtml: "<p>Hi {{name}},</p><p>Great email content here...</p>",
  bodyText: "Hi {{name}},\n\nGreat email content here...",
};

// Mock the Anthropic client
export const mockAnthropicClient = {
  messages: {
    create: vi.fn(),
  },
};

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(() => mockAnthropicClient),
  Anthropic: vi.fn(() => mockAnthropicClient),
}));

export function resetClaudeMocks() {
  mockAnthropicClient.messages.create.mockReset();
}

export function mockClaudeBrandAnalysis() {
  mockAnthropicClient.messages.create.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockBrandAnalysis) }],
  });
}

export function mockClaudeRecipients() {
  mockAnthropicClient.messages.create.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockRecipients) }],
  });
}

export function mockClaudeEmail() {
  mockAnthropicClient.messages.create.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(mockGeneratedEmail) }],
  });
}

export function mockClaudeFailure(error = "Claude API error") {
  mockAnthropicClient.messages.create.mockRejectedValue(new Error(error));
}
