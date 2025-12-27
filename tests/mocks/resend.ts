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

// Mock send function
export const mockSend = vi.fn().mockResolvedValue(mockResendResponse);

// Mock Resend client
export const mockResendClient = {
  emails: {
    send: mockSend,
  },
};

// Mock the Resend constructor using a class
vi.mock("resend", () => {
  class MockResend {
    emails = {
      send: mockSend,
    };
  }
  return {
    Resend: MockResend,
  };
});

export function resetResendMocks() {
  mockSend.mockReset();
  mockSend.mockResolvedValue(mockResendResponse);
}

export function mockResendFailure() {
  mockSend.mockResolvedValue(mockResendError);
}

export function mockResendSuccess(emailId = "email-123") {
  mockSend.mockResolvedValue({
    data: { id: emailId },
    error: null,
  });
}
