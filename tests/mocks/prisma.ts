import { vi } from "vitest";

// Mock Prisma client for testing
export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
  magicToken: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  business: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  campaign: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  generatedEmail: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn((fn) => fn(mockPrismaClient)),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// Mock the prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

export function resetPrismaMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });
}

// Test data factories
export function createMockUser(overrides = {}) {
  return {
    id: "user-123",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockMagicToken(overrides = {}) {
  return {
    id: "token-123",
    token: "test-magic-token-abc123",
    userId: "user-123",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockSession(overrides = {}) {
  return {
    id: "session-123",
    sessionToken: "test-session-token-xyz789",
    userId: "user-123",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockBusiness(overrides = {}) {
  return {
    id: "business-123",
    userId: "user-123",
    name: "Test Business",
    websiteUrl: "https://example.com",
    scrapedData: null,
    brandVoice: null,
    brandValues: [],
    products: [],
    targetAudience: null,
    analysisStatus: "PENDING",
    analyzedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCampaign(overrides = {}) {
  return {
    id: "campaign-123",
    userId: "user-123",
    businessId: "business-123",
    name: "Test Campaign",
    purpose: "Test purpose",
    targetDesc: "Test target audience",
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
