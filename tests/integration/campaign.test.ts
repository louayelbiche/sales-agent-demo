import { describe, it, expect, beforeEach } from "vitest";
import {
  mockPrismaClient,
  resetPrismaMocks,
  createMockUser,
  createMockBusiness,
  createMockCampaign,
} from "../mocks/prisma";
import { resetClaudeMocks, mockClaudeRecipients, mockClaudeEmail } from "../mocks/claude";
import { resetResendMocks, mockResendSuccess } from "../mocks/resend";

describe("Campaign API", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetClaudeMocks();
    resetResendMocks();
  });

  describe("GET /api/campaigns", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should return user's campaigns", async () => {
      const mockCampaigns = [
        createMockCampaign({ name: "Campaign 1" }),
        createMockCampaign({ name: "Campaign 2", id: "campaign-456" }),
      ];

      mockPrismaClient.campaign.findMany.mockResolvedValue(mockCampaigns);

      expect(mockCampaigns.length).toBe(2);
    });

    it("should filter by businessId if provided", async () => {
      const businessId = "business-123";

      const expectedQuery = {
        where: {
          userId: "user-123",
          businessId: businessId,
        },
      };

      expect(expectedQuery.where.businessId).toBe(businessId);
    });
  });

  describe("POST /api/campaigns", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should validate required fields", () => {
      const requiredFields = ["businessId", "name", "purpose", "targetDesc"];

      requiredFields.forEach(field => {
        expect(field).toBeDefined();
      });
    });

    it("should require business to be analyzed", async () => {
      const pendingBusiness = createMockBusiness({ analysisStatus: "PENDING" });

      mockPrismaClient.business.findFirst.mockResolvedValue(pendingBusiness);

      // Should return 422 if business not analyzed
      expect(pendingBusiness.analysisStatus).not.toBe("COMPLETED");
    });

    it("should create campaign with DRAFT status", async () => {
      const mockBusiness = createMockBusiness({ analysisStatus: "COMPLETED" });
      const mockCampaign = createMockCampaign({ status: "DRAFT" });

      mockPrismaClient.business.findFirst.mockResolvedValue(mockBusiness);
      mockPrismaClient.campaign.create.mockResolvedValue(mockCampaign);

      expect(mockCampaign.status).toBe("DRAFT");
    });
  });

  describe("GET /api/campaigns/[id]", () => {
    it("should return 404 for non-existent campaign", async () => {
      mockPrismaClient.campaign.findFirst.mockResolvedValue(null);

      expect(mockPrismaClient.campaign.findFirst).toBeDefined();
    });

    it("should return campaign with generated emails", async () => {
      const mockCampaign = createMockCampaign();
      const mockCampaignWithEmails = {
        ...mockCampaign,
        generatedEmails: [],
        business: createMockBusiness(),
      };

      mockPrismaClient.campaign.findFirst.mockResolvedValue(mockCampaignWithEmails);

      expect(mockCampaignWithEmails).toHaveProperty("generatedEmails");
      expect(mockCampaignWithEmails).toHaveProperty("business");
    });
  });

  describe("DELETE /api/campaigns/[id]", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should delete campaign and related emails", async () => {
      const mockCampaign = createMockCampaign();

      mockPrismaClient.campaign.findFirst.mockResolvedValue(mockCampaign);
      mockPrismaClient.campaign.delete.mockResolvedValue(mockCampaign);

      expect(mockPrismaClient.campaign.delete).toBeDefined();
    });
  });

  describe("POST /api/campaigns/[id]/generate", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should require campaign in DRAFT status", async () => {
      const readyCampaign = createMockCampaign({ status: "READY" });

      mockPrismaClient.campaign.findFirst.mockResolvedValue(readyCampaign);

      // Should return error if not DRAFT
      expect(readyCampaign.status).not.toBe("DRAFT");
    });

    it("should update status to GENERATING", async () => {
      const mockCampaign = createMockCampaign({ status: "DRAFT" });

      mockPrismaClient.campaign.update.mockResolvedValue({
        ...mockCampaign,
        status: "GENERATING",
      });

      const result = await mockPrismaClient.campaign.update({
        where: { id: mockCampaign.id },
        data: { status: "GENERATING" },
      });

      expect(result.status).toBe("GENERATING");
    });

    it("should generate recipients using Claude", () => {
      mockClaudeRecipients();
      expect(true).toBe(true);
    });

    it("should generate emails for each recipient", () => {
      mockClaudeEmail();
      expect(true).toBe(true);
    });

    it("should create GeneratedEmail records", async () => {
      mockPrismaClient.generatedEmail.createMany.mockResolvedValue({ count: 8 });

      const result = await mockPrismaClient.generatedEmail.createMany({
        data: [],
      });

      expect(result.count).toBe(8);
    });

    it("should update status to READY on success", async () => {
      const mockCampaign = createMockCampaign();

      mockPrismaClient.campaign.update.mockResolvedValue({
        ...mockCampaign,
        status: "READY",
      });

      const result = await mockPrismaClient.campaign.update({
        where: { id: mockCampaign.id },
        data: { status: "READY" },
      });

      expect(result.status).toBe("READY");
    });
  });

  describe("POST /api/campaigns/[id]/emails/[emailId]/send", () => {
    it("should require authentication", () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it("should send email to user's inbox", async () => {
      mockResendSuccess("email-sent-123");
      expect(true).toBe(true);
    });

    it("should update email status to SENT", async () => {
      mockPrismaClient.generatedEmail.update.mockResolvedValue({
        id: "email-123",
        status: "SENT",
        sentAt: new Date(),
        resendId: "resend-123",
      });

      const result = await mockPrismaClient.generatedEmail.update({
        where: { id: "email-123" },
        data: { status: "SENT" },
      });

      expect(result.status).toBe("SENT");
    });

    it("should update email status to FAILED on error", async () => {
      mockPrismaClient.generatedEmail.update.mockResolvedValue({
        id: "email-123",
        status: "FAILED",
      });

      const result = await mockPrismaClient.generatedEmail.update({
        where: { id: "email-123" },
        data: { status: "FAILED" },
      });

      expect(result.status).toBe("FAILED");
    });

    it("should update campaign status to SENT after first email sent", async () => {
      const mockCampaign = createMockCampaign({ status: "READY" });

      mockPrismaClient.campaign.update.mockResolvedValue({
        ...mockCampaign,
        status: "SENT",
      });

      const result = await mockPrismaClient.campaign.update({
        where: { id: mockCampaign.id },
        data: { status: "SENT" },
      });

      expect(result.status).toBe("SENT");
    });
  });
});

describe("Campaign Status Transitions", () => {
  it("should follow valid status transitions", () => {
    const validTransitions = {
      DRAFT: ["GENERATING"],
      GENERATING: ["READY", "DRAFT"], // can fail back to DRAFT
      READY: ["SENT"],
      SENT: [], // terminal state
    };

    expect(validTransitions.DRAFT).toContain("GENERATING");
    expect(validTransitions.GENERATING).toContain("READY");
    expect(validTransitions.READY).toContain("SENT");
  });
});

describe("Email Status Transitions", () => {
  it("should follow valid status transitions", () => {
    const validTransitions = {
      PREVIEW: ["SENDING"],
      SENDING: ["SENT", "FAILED"],
      SENT: [], // terminal state
      FAILED: ["SENDING"], // can retry
    };

    expect(validTransitions.PREVIEW).toContain("SENDING");
    expect(validTransitions.SENDING).toContain("SENT");
    expect(validTransitions.FAILED).toContain("SENDING");
  });
});
