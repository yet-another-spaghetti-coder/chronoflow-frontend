import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import {
  registerDevice,
  revokeDeviceByToken,
  revokeAllDevicesForUser,
} from "../pushNotiApi";
import type { PushNotificationDeviceRegistration } from "@/lib/validation/schema";

// Mock dependencies
vi.mock("@/lib/http", () => ({
  http: {
    post: vi.fn(),
  },
}));

const mockHttpPost = http.post as MockedFunction<typeof http.post>;

// Mock console methods
const mockConsole = {
  error: vi.fn(),
};
Object.defineProperty(console, 'error', { value: mockConsole.error });

describe("pushNotiApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerDevice", () => {
    it("should register device successfully with platform", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-123",
        token: "fcm-token-123",
        platform: "ANDROID",
      };

      const expectedUrl = "/notifications/push/devices/register?userId=user-123";
      const expectedBody = {
        token: "fcm-token-123",
        platform: "ANDROID",
      };

      mockHttpPost.mockResolvedValue({ data: { success: true } });

      // Act
      await registerDevice(deviceRegistration);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(expectedUrl, expectedBody);
    });

    it("should register device successfully without platform", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-456",
        token: "fcm-token-456",
      };

      const expectedUrl = "/notifications/push/devices/register?userId=user-456";
      const expectedBody = {
        token: "fcm-token-456",
      };

      mockHttpPost.mockResolvedValue({ data: { success: true } });

      // Act
      await registerDevice(deviceRegistration);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(expectedUrl, expectedBody);
    });

    it("should trim token whitespace", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-789",
        token: "  fcm-token-789  ",
        platform: "IOS",
      };

      const expectedUrl = "/notifications/push/devices/register?userId=user-789";
      const expectedBody = {
        token: "fcm-token-789",
        platform: "IOS",
      };

      mockHttpPost.mockResolvedValue({ data: { success: true } });

      // Act
      await registerDevice(deviceRegistration);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(expectedUrl, expectedBody);
    });

    it("should handle schema validation errors", async () => {
      // Arrange
      const invalidRegistration = {
        userId: "",
        token: "fcm-token-123",
      } as PushNotificationDeviceRegistration;

      // Act & Assert
      await expect(registerDevice(invalidRegistration)).rejects.toThrow();
    });

    it("should handle API errors with string response", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-123",
        token: "fcm-token-123",
      };

      const error = {
        response: {
          data: "Registration failed",
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerDevice(deviceRegistration)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device registration failed:",
        "Registration failed"
      );
    });

    it("should handle API errors with object response containing message", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-123",
        token: "fcm-token-123",
      };

      const error = {
        response: {
          data: {
            message: "Token already registered",
            code: 400,
          },
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerDevice(deviceRegistration)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device registration failed:",
        "Token already registered"
      );
    });

    it("should handle standard Error objects", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-123",
        token: "fcm-token-123",
      };

      const error = new Error("Network connection failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerDevice(deviceRegistration)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device registration failed:",
        "Network connection failed"
      );
    });

    it("should handle unknown error types", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-123",
        token: "fcm-token-123",
      };

      const error = { someUnknownProperty: "value" };
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerDevice(deviceRegistration)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device registration failed:",
        "Unknown error"
      );
    });

    it("should handle object response without message property", async () => {
      // Arrange
      const deviceRegistration: PushNotificationDeviceRegistration = {
        userId: "user-123",
        token: "fcm-token-123",
      };

      const error = {
        response: {
          data: {
            code: 500,
            details: "Internal server error",
          },
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerDevice(deviceRegistration)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device registration failed:",
        "Unknown error"
      );
    });
  });

  describe("revokeDeviceByToken", () => {
    it("should revoke device by token successfully", async () => {
      // Arrange
      const token = "fcm-token-123";
      const expectedUrl = "/notifications/push/devices/revoke?token=fcm-token-123";

      mockHttpPost.mockResolvedValue({ data: { success: true } });

      // Act
      await revokeDeviceByToken(token);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(expectedUrl);
    });

    it("should trim token whitespace before revoking", async () => {
      // Arrange
      const token = "  fcm-token-456  ";
      const expectedUrl = "/notifications/push/devices/revoke?token=fcm-token-456";

      mockHttpPost.mockResolvedValue({ data: { success: true } });

      // Act
      await revokeDeviceByToken(token);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(expectedUrl);
    });

    it("should handle schema validation errors", async () => {
      // Arrange
      const invalidToken = "";

      // Act & Assert
      await expect(revokeDeviceByToken(invalidToken)).rejects.toThrow();
    });

    it("should handle API errors with string response", async () => {
      // Arrange
      const token = "fcm-token-123";
      const error = {
        response: {
          data: "Token not found",
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeDeviceByToken(token)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device revocation failed:",
        "Token not found"
      );
    });

    it("should handle API errors with object response containing message", async () => {
      // Arrange
      const token = "fcm-token-123";
      const error = {
        response: {
          data: {
            message: "Device not registered",
            code: 404,
          },
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeDeviceByToken(token)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device revocation failed:",
        "Device not registered"
      );
    });

    it("should handle standard Error objects", async () => {
      // Arrange
      const token = "fcm-token-123";
      const error = new Error("Server timeout");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeDeviceByToken(token)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device revocation failed:",
        "Server timeout"
      );
    });

    it("should handle unknown error types", async () => {
      // Arrange
      const token = "fcm-token-123";
      const error = null;
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeDeviceByToken(token)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Device revocation failed:",
        "Unknown error"
      );
    });
  });

  describe("revokeAllDevicesForUser", () => {
    it("should revoke all devices for user successfully", async () => {
      // Arrange
      const userId = "user-123";
      const expectedUrl = "/notifications/push/devices/revoke-all?userId=user-123";

      mockHttpPost.mockResolvedValue({ data: { success: true } });

      // Act
      await revokeAllDevicesForUser(userId);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(expectedUrl);
    });

    it("should handle schema validation errors", async () => {
      // Arrange
      const invalidUserId = "";

      // Act & Assert
      await expect(revokeAllDevicesForUser(invalidUserId)).rejects.toThrow();
    });

    it("should handle API errors with string response", async () => {
      // Arrange
      const userId = "user-123";
      const error = {
        response: {
          data: "User not found",
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeAllDevicesForUser(userId)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Revoke all devices for user failed:",
        "User not found"
      );
    });

    it("should handle API errors with object response containing message", async () => {
      // Arrange
      const userId = "user-123";
      const error = {
        response: {
          data: {
            message: "No devices registered for user",
            code: 404,
          },
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeAllDevicesForUser(userId)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Revoke all devices for user failed:",
        "No devices registered for user"
      );
    });

    it("should handle standard Error objects", async () => {
      // Arrange
      const userId = "user-123";
      const error = new Error("Database connection failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeAllDevicesForUser(userId)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Revoke all devices for user failed:",
        "Database connection failed"
      );
    });

    it("should handle unknown error types", async () => {
      // Arrange
      const userId = "user-123";
      const error = { unexpected: "error format" };
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeAllDevicesForUser(userId)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Revoke all devices for user failed:",
        "Unknown error"
      );
    });

    it("should handle object response without message property", async () => {
      // Arrange
      const userId = "user-123";
      const error = {
        response: {
          data: {
            status: "failed",
            details: { reason: "maintenance" },
          },
        },
      };

      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(revokeAllDevicesForUser(userId)).rejects.toEqual(error);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "[FCM] Revoke all devices for user failed:",
        "Unknown error"
      );
    });
  });
});