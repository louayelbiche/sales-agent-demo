import { vi } from "vitest";

// Mock Resend responses
export const mockResendResponse = {
  data: { id: "email-123" },
  error: null,
};

export const mockResendError = {
  data: null,
  error: { message: "Failed to send email", statusCode: 500, name: "api_error" },
};

// Mock Resend client
export const mockResendClient = {
  emails: {
    send: vi.fn().mockResolvedValue(mockResendResponse),
  },
};

// Mock the Resend constructor
vi.mock("resend", () => ({
  Resend: vi.fn(() => mockResendClient),
}));

export function resetResendMocks() {
  mockResendClient.emails.send.mockReset();
  mockResendClient.emails.send.mockResolvedValue(mockResendResponse);
}

export function mockResendFailure() {
  mockResendClient.emails.send.mockResolvedValue(mockResendError);
}

export function mockResendSuccess(emailId = "email-123") {
  mockResendClient.emails.send.mockResolvedValue({
    data: { id: emailId },
    error: null,
  });
}
