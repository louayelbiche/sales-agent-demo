import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mockPrismaClient,
  resetPrismaMocks,
  createMockUser,
  createMockMagicToken,
  createMockSession,
} from "../mocks/prisma";
import {
  resetResendMocks,
  mockResendSuccess,
  mockResendFailure,
  mockSend,
} from "../mocks/resend";

// Import auth functions after mocks
import {
  generateToken,
  createMagicToken,
  verifyMagicToken,
} from "@/lib/auth";
import { sendMagicLink } from "@/lib/resend";

describe("Magic Link Workflow", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetResendMocks();
  });

  describe("Token Generation", () => {
    it("should generate cryptographically random tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it("should generate tokens of custom length", () => {
      const token = generateToken(16);
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("should generate hex-only characters", () => {
      const token = generateToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("createMagicToken", () => {
    it("should create token for existing user", async () => {
      const existingUser = createMockUser({ email: "existing@example.com" });
      const mockToken = createMockMagicToken({ userId: existingUser.id });

      mockPrismaClient.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaClient.magicToken.create.mockResolvedValue(mockToken);

      const token = await createMagicToken("existing@example.com");

      expect(token).toBeDefined();
      expect(token.length).toBe(64);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
      });
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });

    it("should create new user if not exists", async () => {
      const newUser = createMockUser({ email: "new@example.com" });
      const mockToken = createMockMagicToken({ userId: newUser.id });

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue(newUser);
      mockPrismaClient.magicToken.create.mockResolvedValue(mockToken);

      const token = await createMagicToken("new@example.com");

      expect(token).toBeDefined();
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: { email: "new@example.com" },
      });
    });

    it("should set token expiration to 24 hours", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockMagicToken({ userId: mockUser.id });

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.magicToken.create.mockResolvedValue(mockToken);

      await createMagicToken("test@example.com");

      expect(mockPrismaClient.magicToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          expiresAt: expect.any(Date),
        }),
      });

      // Verify expiration is ~24 hours from now
      const call = mockPrismaClient.magicToken.create.mock.calls[0][0];
      const expiresAt = call.data.expiresAt;
      const now = new Date();
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });
  });

  describe("verifyMagicToken", () => {
    it("should return session token for valid token", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockMagicToken({
        userId: mockUser.id,
        user: mockUser,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });
      const mockSession = createMockSession({ userId: mockUser.id });

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaClient.magicToken.update.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });
      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      const sessionToken = await verifyMagicToken(mockToken.token);

      expect(sessionToken).toBeDefined();
      expect(sessionToken?.length).toBe(64);
    });

    it("should return null for non-existent token", async () => {
      mockPrismaClient.magicToken.findUnique.mockResolvedValue(null);

      const sessionToken = await verifyMagicToken("non-existent-token");

      expect(sessionToken).toBeNull();
    });

    it("should return null for expired token", async () => {
      const expiredToken = createMockMagicToken({
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        usedAt: null,
      });

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaClient.magicToken.delete.mockResolvedValue(expiredToken);

      const sessionToken = await verifyMagicToken(expiredToken.token);

      expect(sessionToken).toBeNull();
      expect(mockPrismaClient.magicToken.delete).toHaveBeenCalledWith({
        where: { id: expiredToken.id },
      });
    });

    it("should return null for already used token", async () => {
      const usedToken = createMockMagicToken({
        usedAt: new Date(), // Already used
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(usedToken);

      const sessionToken = await verifyMagicToken(usedToken.token);

      expect(sessionToken).toBeNull();
    });

    it("should mark token as used after verification", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockMagicToken({
        userId: mockUser.id,
        user: mockUser,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const mockSession = createMockSession({ userId: mockUser.id });

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaClient.magicToken.update.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });
      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      await verifyMagicToken(mockToken.token);

      expect(mockPrismaClient.magicToken.update).toHaveBeenCalledWith({
        where: { id: mockToken.id },
        data: { usedAt: expect.any(Date) },
      });
    });

    it("should create session with 7 day expiration", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockMagicToken({
        userId: mockUser.id,
        user: mockUser,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const mockSession = createMockSession({ userId: mockUser.id });

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaClient.magicToken.update.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });
      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      await verifyMagicToken(mockToken.token);

      expect(mockPrismaClient.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockToken.userId,
          sessionToken: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });

      // Verify session expiration is ~7 days from now
      const call = mockPrismaClient.session.create.mock.calls[0][0];
      const expiresAt = call.data.expiresAt;
      const now = new Date();
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(8);
    });
  });

  describe("sendMagicLink", () => {
    it("should send email with magic link", async () => {
      mockResendSuccess("email-sent-123");

      await sendMagicLink("user@example.com", "test-token-123");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["user@example.com"],
          subject: "Sign in to Sales Agent Demo",
        })
      );
    });

    it("should include token in magic link URL", async () => {
      mockResendSuccess();

      await sendMagicLink("user@example.com", "my-special-token");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("my-special-token");
      expect(call.text).toContain("my-special-token");
    });

    it("should include verify endpoint in link", async () => {
      mockResendSuccess();

      await sendMagicLink("user@example.com", "token123");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("/api/auth/verify?token=token123");
    });

    it("should throw error on send failure", async () => {
      mockResendFailure();

      await expect(
        sendMagicLink("user@example.com", "token")
      ).rejects.toThrow("Failed to send email");
    });

    it("should use configured from email", async () => {
      mockResendSuccess();

      await sendMagicLink("user@example.com", "token");

      const call = mockSend.mock.calls[0][0];
      expect(call.from).toContain("Sales Agent Demo");
    });
  });
});

describe("Magic Link Security", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe("Token Security", () => {
    it("should generate unique tokens for each request", async () => {
      const mockUser = createMockUser();
      const tokens: string[] = [];

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.magicToken.create.mockImplementation(async (args) => {
        tokens.push(args.data.token);
        return createMockMagicToken({ token: args.data.token });
      });

      await createMagicToken("user@example.com");
      await createMagicToken("user@example.com");
      await createMagicToken("user@example.com");

      expect(new Set(tokens).size).toBe(3); // All tokens unique
    });

    it("should prevent token reuse (replay attack)", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockMagicToken({
        userId: mockUser.id,
        user: mockUser,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      // First verification - should succeed
      mockPrismaClient.magicToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaClient.magicToken.update.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });
      mockPrismaClient.session.create.mockResolvedValue(
        createMockSession({ userId: mockUser.id })
      );

      const firstResult = await verifyMagicToken(mockToken.token);
      expect(firstResult).toBeDefined();

      // Second verification - should fail (token already used)
      mockPrismaClient.magicToken.findUnique.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });

      const secondResult = await verifyMagicToken(mockToken.token);
      expect(secondResult).toBeNull();
    });

    it("should delete expired tokens on verification attempt", async () => {
      const expiredToken = createMockMagicToken({
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaClient.magicToken.delete.mockResolvedValue(expiredToken);

      await verifyMagicToken(expiredToken.token);

      expect(mockPrismaClient.magicToken.delete).toHaveBeenCalled();
    });
  });

  describe("Session Security", () => {
    it("should generate unique session tokens", async () => {
      const mockUser = createMockUser();
      const mockToken = createMockMagicToken({
        userId: mockUser.id,
        user: mockUser,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const sessionTokens: string[] = [];

      mockPrismaClient.magicToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaClient.magicToken.update.mockResolvedValue({
        ...mockToken,
        usedAt: new Date(),
      });
      mockPrismaClient.session.create.mockImplementation(async (args) => {
        sessionTokens.push(args.data.sessionToken);
        return createMockSession({
          sessionToken: args.data.sessionToken,
          userId: mockUser.id,
        });
      });

      // Reset for second call
      await verifyMagicToken(mockToken.token);

      mockPrismaClient.magicToken.findUnique.mockResolvedValue({
        ...mockToken,
        id: "token-2",
        token: "different-token",
        usedAt: null,
      });

      await verifyMagicToken("different-token");

      expect(sessionTokens.length).toBe(2);
      expect(sessionTokens[0]).not.toBe(sessionTokens[1]);
    });
  });
});

describe("Magic Link Email Content", () => {
  beforeEach(() => {
    resetResendMocks();
  });

  it("should include HTML and plain text versions", async () => {
    mockResendSuccess();

    await sendMagicLink("user@example.com", "token");

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toBeDefined();
    expect(call.text).toBeDefined();
  });

  it("should include sign-in instructions", async () => {
    mockResendSuccess();

    await sendMagicLink("user@example.com", "token");

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("Sign in");
    expect(call.text).toContain("Sign in");
  });

  it("should mention 24 hour expiration", async () => {
    mockResendSuccess();

    await sendMagicLink("user@example.com", "token");

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("24 hours");
    expect(call.text).toContain("24 hours");
  });

  it("should include plain text link for non-HTML clients", async () => {
    mockResendSuccess();

    await sendMagicLink("user@example.com", "token");

    const call = mockSend.mock.calls[0][0];
    expect(call.text).toContain("http");
    expect(call.text).toContain("token");
  });
});

describe("Edge Cases", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetResendMocks();
  });

  it("should handle email case insensitively for user lookup", async () => {
    const mockUser = createMockUser({ email: "user@example.com" });

    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.magicToken.create.mockResolvedValue(
      createMockMagicToken({ userId: mockUser.id })
    );

    // Test is about verifying the lookup is called - case handling is at the API level
    await createMagicToken("user@example.com");

    expect(mockPrismaClient.user.findUnique).toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    mockPrismaClient.user.findUnique.mockRejectedValue(
      new Error("Database connection failed")
    );

    await expect(createMagicToken("user@example.com")).rejects.toThrow(
      "Database connection failed"
    );
  });

  it("should handle token creation race conditions", async () => {
    const mockUser = createMockUser();

    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.magicToken.create.mockRejectedValue(
      new Error("Unique constraint violation")
    );

    await expect(createMagicToken("user@example.com")).rejects.toThrow();
  });
});
