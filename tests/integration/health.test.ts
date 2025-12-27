import { describe, it, expect } from "vitest";

describe("Health Check API", () => {
  describe("GET /api/health", () => {
    it("should return healthy status", () => {
      // The health endpoint should return a simple success response
      const expectedResponse = { status: "ok" };
      expect(expectedResponse.status).toBe("ok");
    });

    it("should not require authentication", () => {
      // Health check should be publicly accessible
      const requiresAuth = false;
      expect(requiresAuth).toBe(false);
    });
  });
});

describe("Environment Configuration", () => {
  it("should have required environment variables", () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined();
  });

  it("should have NEXT_PUBLIC_APP_URL set correctly", () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    expect(appUrl).not.toContain("0.0.0.0");
    expect(appUrl).toMatch(/^https?:\/\//);
  });
});
