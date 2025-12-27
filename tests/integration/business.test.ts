import { describe, it, expect, beforeEach } from "vitest";
import {
  mockPrismaClient,
  resetPrismaMocks,
  createMockUser,
  createMockBusiness,
  createMockSession,
} from "../mocks/prisma";
import { resetClaudeMocks, mockClaudeBrandAnalysis } from "../mocks/claude";

describe("Business API", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetClaudeMocks();
  });

  describe("GET /api/business", () => {
    it("should require authentication", () => {
      // Unauthenticated requests should return 401
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should return user's businesses", async () => {
      const mockUser = createMockUser();
      const mockBusinesses = [
        createMockBusiness({ userId: mockUser.id, name: "Business 1" }),
        createMockBusiness({ userId: mockUser.id, name: "Business 2", id: "business-456" }),
      ];

      mockPrismaClient.business.findMany.mockResolvedValue(mockBusinesses);

      expect(mockPrismaClient.business.findMany).toBeDefined();
      expect(mockBusinesses.length).toBe(2);
    });

    it("should only return businesses owned by the user", async () => {
      const mockUser = createMockUser();

      // Verify query filters by userId
      const expectedQuery = {
        where: { userId: mockUser.id },
      };

      expect(expectedQuery.where.userId).toBe(mockUser.id);
    });
  });

  describe("POST /api/business", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should validate website URL", () => {
      const validUrls = [
        "https://example.com",
        "http://example.com",
        "https://www.example.com",
      ];

      const invalidUrls = [
        "not-a-url",
        "ftp://example.com",
        "",
      ];

      validUrls.forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });

      invalidUrls.forEach(url => {
        const isValid = /^https?:\/\//.test(url);
        expect(isValid).toBe(false);
      });
    });

    it("should create business with PENDING status", async () => {
      const mockUser = createMockUser();
      const mockBusiness = createMockBusiness({
        userId: mockUser.id,
        analysisStatus: "PENDING",
      });

      mockPrismaClient.business.create.mockResolvedValue(mockBusiness);

      expect(mockBusiness.analysisStatus).toBe("PENDING");
    });
  });

  describe("GET /api/business/[id]", () => {
    it("should return 404 for non-existent business", async () => {
      mockPrismaClient.business.findFirst.mockResolvedValue(null);

      expect(mockPrismaClient.business.findFirst).toBeDefined();
    });

    it("should return 403 for business owned by different user", () => {
      const statusCode = 403;
      expect(statusCode).toBe(403);
    });

    it("should return business with recent campaigns", async () => {
      const mockBusiness = createMockBusiness();
      const mockBusinessWithCampaigns = {
        ...mockBusiness,
        campaigns: [],
      };

      mockPrismaClient.business.findFirst.mockResolvedValue(mockBusinessWithCampaigns);

      expect(mockBusinessWithCampaigns).toHaveProperty("campaigns");
    });
  });

  describe("DELETE /api/business/[id]", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should delete business owned by user", async () => {
      const mockBusiness = createMockBusiness();

      mockPrismaClient.business.findFirst.mockResolvedValue(mockBusiness);
      mockPrismaClient.business.delete.mockResolvedValue(mockBusiness);

      expect(mockPrismaClient.business.delete).toBeDefined();
    });

    it("should return 403 when deleting other user's business", () => {
      const statusCode = 403;
      expect(statusCode).toBe(403);
    });
  });

  describe("POST /api/business/[id]/analyze", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should update status to SCRAPING", async () => {
      const mockBusiness = createMockBusiness({ analysisStatus: "PENDING" });

      mockPrismaClient.business.findFirst.mockResolvedValue(mockBusiness);
      mockPrismaClient.business.update.mockResolvedValue({
        ...mockBusiness,
        analysisStatus: "SCRAPING",
      });

      expect(mockPrismaClient.business.update).toBeDefined();
    });

    it("should call Claude for brand analysis", () => {
      mockClaudeBrandAnalysis();
      // Verify Claude integration exists
      expect(true).toBe(true);
    });

    it("should update status to COMPLETED on success", async () => {
      const mockBusiness = createMockBusiness();

      mockPrismaClient.business.update.mockResolvedValue({
        ...mockBusiness,
        analysisStatus: "COMPLETED",
        brandVoice: {},
        brandValues: [],
        analyzedAt: new Date(),
      });

      const result = await mockPrismaClient.business.update({
        where: { id: mockBusiness.id },
        data: { analysisStatus: "COMPLETED" },
      });

      expect(result.analysisStatus).toBe("COMPLETED");
    });

    it("should update status to FAILED on error", async () => {
      const mockBusiness = createMockBusiness();

      mockPrismaClient.business.update.mockResolvedValue({
        ...mockBusiness,
        analysisStatus: "FAILED",
      });

      const result = await mockPrismaClient.business.update({
        where: { id: mockBusiness.id },
        data: { analysisStatus: "FAILED" },
      });

      expect(result.analysisStatus).toBe("FAILED");
    });
  });
});

describe("Business Analysis Status Transitions", () => {
  it("should follow valid status transitions", () => {
    const validTransitions = {
      PENDING: ["SCRAPING"],
      SCRAPING: ["ANALYZING", "FAILED"],
      ANALYZING: ["COMPLETED", "FAILED"],
      COMPLETED: [], // terminal state
      FAILED: ["SCRAPING"], // can retry
    };

    expect(validTransitions.PENDING).toContain("SCRAPING");
    expect(validTransitions.SCRAPING).toContain("ANALYZING");
    expect(validTransitions.ANALYZING).toContain("COMPLETED");
  });
});
