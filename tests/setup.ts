import { beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5434/test_db";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3005";
process.env.RESEND_API_KEY = "re_test_key";
process.env.RESEND_FROM_EMAIL = "test@example.com";
process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

// Global test setup
beforeAll(() => {
  console.log("🧪 Starting test suite...");
});

afterAll(() => {
  console.log("✅ Test suite complete");
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Global test utilities
export const TEST_USER_EMAIL = "test@example.com";
export const TEST_MAGIC_TOKEN = "test-magic-token-123456789";
export const TEST_SESSION_TOKEN = "test-session-token-987654321";
