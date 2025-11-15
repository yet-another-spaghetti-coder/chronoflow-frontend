import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import { getAttendeeInfo, staffCheckIn } from "../checkinAPi";
import type { AttendeeInfo, CheckInResult } from "../checkinAPi";

// Mock dependencies
vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/utils", () => ({
  unwrap: vi.fn(),
}));

const mockHttpGet = http.get as MockedFunction<typeof http.get>;
const mockHttpPost = http.post as MockedFunction<typeof http.post>;
const mockUnwrap = unwrap as MockedFunction<typeof unwrap>;

describe("checkinAPi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAttendeeInfo", () => {
    it("should get attendee info for a valid token", async () => {
      // Arrange
      const token = "valid-token-123";
      const mockAttendeeInfo: AttendeeInfo = {
        id: "attendee-1",
        name: "John Doe",
        email: "john@example.com",
        phone: "+6591234567",
        eventName: "Tech Conference 2025",
        checkInTime: "2025-11-15T10:30:00Z",
        checkInStatus: false,
        message: "Ready to check in",
      };

      const mockResponse = {
        data: { code: 0, data: mockAttendeeInfo },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockAttendeeInfo);

      // Act
      const result = await getAttendeeInfo(token);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/attendees/scan?token=${token}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockAttendeeInfo);
    });

    it("should get attendee info without optional fields", async () => {
      // Arrange
      const token = "minimal-token-456";
      const mockAttendeeInfo: AttendeeInfo = {
        id: "attendee-2",
        name: "Jane Smith",
        email: "jane@example.com",
        eventName: "Workshop 2025",
        checkInStatus: true,
      };

      const mockResponse = {
        data: { code: 0, data: mockAttendeeInfo },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockAttendeeInfo);

      // Act
      const result = await getAttendeeInfo(token);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/attendees/scan?token=${token}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockAttendeeInfo);
    });

    it("should handle empty token", async () => {
      // Arrange
      const token = "";
      const mockAttendeeInfo: AttendeeInfo = {
        id: "attendee-3",
        name: "Test User",
        email: "test@example.com",
        eventName: "Test Event",
        checkInStatus: false,
      };

      const mockResponse = {
        data: { code: 0, data: mockAttendeeInfo },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockAttendeeInfo);

      // Act
      const result = await getAttendeeInfo(token);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/attendees/scan?token=`);
      expect(result).toEqual(mockAttendeeInfo);
    });

    it("should handle special characters in token", async () => {
      // Arrange
      const token = "token-with-special@#$%chars";
      const mockAttendeeInfo: AttendeeInfo = {
        id: "attendee-4",
        name: "Special User",
        email: "special@example.com",
        eventName: "Special Event",
        checkInStatus: false,
      };

      const mockResponse = {
        data: { code: 0, data: mockAttendeeInfo },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockAttendeeInfo);

      // Act
      const result = await getAttendeeInfo(token);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/attendees/scan?token=${token}`);
      expect(result).toEqual(mockAttendeeInfo);
    });

    it("should handle API errors", async () => {
      // Arrange
      const token = "error-token-789";
      const error = new Error("Invalid token");
      mockHttpGet.mockRejectedValue(error);

      // Act & Assert
      await expect(getAttendeeInfo(token)).rejects.toThrow("Invalid token");
      expect(mockHttpGet).toHaveBeenCalledWith(`/attendees/scan?token=${token}`);
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const token = "unwrap-error-token";
      const mockResponse = {
        data: { code: 1, msg: "Token not found" },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Token not found");
      });

      // Act & Assert
      await expect(getAttendeeInfo(token)).rejects.toThrow("Token not found");
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
    });

    it("should handle network errors", async () => {
      // Arrange
      const token = "network-error-token";
      const networkError = new Error("Network connection failed");
      mockHttpGet.mockRejectedValue(networkError);

      // Act & Assert
      await expect(getAttendeeInfo(token)).rejects.toThrow("Network connection failed");
    });
  });

  describe("staffCheckIn", () => {
    it("should perform staff check-in successfully", async () => {
      // Arrange
      const token = "staff-checkin-token-123";
      const mockCheckInResult: CheckInResult = {
        success: true,
        userName: "John Doe",
        eventName: "Tech Conference 2025",
        checkInTime: "2025-11-15T14:30:00Z",
        message: "Check-in successful",
      };

      const expectedPayload = { token };

      const mockResponse = {
        data: { code: 0, data: mockCheckInResult },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockCheckInResult);

      // Act
      const result = await staffCheckIn(token);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees/staff-scan", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockCheckInResult);
    });

    it("should handle failed check-in", async () => {
      // Arrange
      const token = "failed-checkin-token";
      const mockCheckInResult: CheckInResult = {
        success: false,
        userName: "Jane Smith",
        eventName: "Workshop 2025",
        checkInTime: "",
        message: "Already checked in",
      };

      const expectedPayload = { token };

      const mockResponse = {
        data: { code: 0, data: mockCheckInResult },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockCheckInResult);

      // Act
      const result = await staffCheckIn(token);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees/staff-scan", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockCheckInResult);
      expect(result.success).toBe(false);
    });

    it("should handle empty token for staff check-in", async () => {
      // Arrange
      const token = "";
      const mockCheckInResult: CheckInResult = {
        success: false,
        userName: "",
        eventName: "",
        checkInTime: "",
        message: "Invalid token",
      };

      const expectedPayload = { token: "" };

      const mockResponse = {
        data: { code: 0, data: mockCheckInResult },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockCheckInResult);

      // Act
      const result = await staffCheckIn(token);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees/staff-scan", expectedPayload);
      expect(result).toEqual(mockCheckInResult);
    });

    it("should handle special characters in token for staff check-in", async () => {
      // Arrange
      const token = "special@#$%token";
      const mockCheckInResult: CheckInResult = {
        success: true,
        userName: "Special User",
        eventName: "Special Event",
        checkInTime: "2025-11-15T16:00:00Z",
        message: "Check-in successful",
      };

      const expectedPayload = { token };

      const mockResponse = {
        data: { code: 0, data: mockCheckInResult },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockCheckInResult);

      // Act
      const result = await staffCheckIn(token);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees/staff-scan", expectedPayload);
      expect(result).toEqual(mockCheckInResult);
    });

    it("should handle API errors during staff check-in", async () => {
      // Arrange
      const token = "api-error-token";
      const error = new Error("Server error");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(staffCheckIn(token)).rejects.toThrow("Server error");
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees/staff-scan", { token });
    });

    it("should handle unwrap errors during staff check-in", async () => {
      // Arrange
      const token = "unwrap-error-token";
      const mockResponse = {
        data: { code: 1, msg: "Check-in failed" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Check-in failed");
      });

      // Act & Assert
      await expect(staffCheckIn(token)).rejects.toThrow("Check-in failed");
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
    });

    it("should handle network errors during staff check-in", async () => {
      // Arrange
      const token = "network-error-token";
      const networkError = new Error("Connection timeout");
      mockHttpPost.mockRejectedValue(networkError);

      // Act & Assert
      await expect(staffCheckIn(token)).rejects.toThrow("Connection timeout");
    });

    it("should handle duplicate check-in attempt", async () => {
      // Arrange
      const token = "duplicate-checkin-token";
      const mockCheckInResult: CheckInResult = {
        success: false,
        userName: "Already Checked User",
        eventName: "Conference 2025",
        checkInTime: "2025-11-15T09:00:00Z",
        message: "User has already been checked in",
      };

      const mockResponse = {
        data: { code: 0, data: mockCheckInResult },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockCheckInResult);

      // Act
      const result = await staffCheckIn(token);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("already been checked in");
    });
  });
});