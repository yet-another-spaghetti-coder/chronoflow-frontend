import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  getAttendees,
  createIndividualAttendee,
  updateAttendee,
  deleteAttendee,
} from "../attendeeApi";
import type { Attendee, IndiAttendeeConfig } from "@/lib/validation/schema";

// Mock dependencies
vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/utils", () => ({
  unwrap: vi.fn(),
}));

const mockHttpGet = http.get as MockedFunction<typeof http.get>;
const mockHttpPost = http.post as MockedFunction<typeof http.post>;
const mockHttpPatch = http.patch as MockedFunction<typeof http.patch>;
const mockHttpDelete = http.delete as MockedFunction<typeof http.delete>;
const mockUnwrap = unwrap as MockedFunction<typeof unwrap>;

describe("attendeeApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAttendees", () => {
    it("should fetch attendees for a given event ID", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockAttendees: Attendee[] = [
        {
          id: "1",
          attendeeEmail: "john@example.com",
          attendeeName: "John Doe",
          attendeeMobile: "+6591234567",
          checkInToken: "token123",
          qrCodeBase64: "base64string",
          qrCodeUrl: "http://example.com/qr/1",
          checkInStatus: 0,
        },
        {
          id: "2",
          attendeeEmail: "jane@example.com",
          attendeeName: "Jane Smith",
          attendeeMobile: "+6598765432",
          checkInToken: "token456",
          qrCodeBase64: null,
          qrCodeUrl: null,
          checkInStatus: 1,
        },
      ];

      const mockResponse = {
        data: { code: 0, data: mockAttendees },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockAttendees);

      // Act
      const result = await getAttendees(eventId);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(
        `/attendees/list/${encodeURIComponent(eventId)}`
      );
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockAttendees);
    });

    it("should handle numeric event ID", async () => {
      // Arrange
      const eventId = 123;
      const mockAttendees: Attendee[] = [];
      const mockResponse = {
        data: { code: 0, data: mockAttendees },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockAttendees);

      // Act
      await getAttendees(eventId);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(
        `/attendees/list/${encodeURIComponent(String(eventId))}`
      );
    });

    it("should handle API errors", async () => {
      // Arrange
      const eventId = "test-event-123";
      const error = new Error("Network error");
      mockHttpGet.mockRejectedValue(error);

      // Act & Assert
      await expect(getAttendees(eventId)).rejects.toThrow("Network error");
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockResponse = {
        data: { code: 1, msg: "Server error" },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Server error");
      });

      // Act & Assert
      await expect(getAttendees(eventId)).rejects.toThrow("Server error");
    });
  });

  describe("createIndividualAttendee", () => {
    it("should create an individual attendee", async () => {
      // Arrange
      const eventId = "test-event-123";
      const input: IndiAttendeeConfig = {
        email: "new@example.com",
        name: "New Attendee",
        mobile: "+6591234567",
      };

      const expectedPayload = {
        eventId: eventId,
        attendees: [input],
      };

      const mockResponse = {
        data: { code: 0, data: { id: "new-attendee-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "new-attendee-id" });

      // Act
      const result = await createIndividualAttendee(input, eventId);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ id: "new-attendee-id" });
    });

    it("should handle numeric event ID", async () => {
      // Arrange
      const eventId = 456;
      const input: IndiAttendeeConfig = {
        email: "test@example.com",
        name: "Test User",
        mobile: "+6598765432",
      };

      const expectedPayload = {
        eventId: eventId,
        attendees: [input],
      };

      const mockResponse = {
        data: { code: 0, data: {} },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({});

      // Act
      await createIndividualAttendee(input, eventId);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/attendees", expectedPayload);
    });

    it("should handle API errors", async () => {
      // Arrange
      const eventId = "test-event-123";
      const input: IndiAttendeeConfig = {
        email: "test@example.com",
        name: "Test User",
        mobile: "+6591234567",
      };

      const error = new Error("Validation error");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(createIndividualAttendee(input, eventId)).rejects.toThrow(
        "Validation error"
      );
    });
  });

  describe("updateAttendee", () => {
    it("should update an attendee", async () => {
      // Arrange
      const attendeeId = "attendee-123";
      const input: IndiAttendeeConfig = {
        email: "updated@example.com",
        name: "Updated Name",
        mobile: "+6599999999",
      };

      const expectedPayload = {
        email: input.email,
        name: input.name,
        mobile: input.mobile,
      };

      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpPatch.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await updateAttendee(attendeeId, input);

      // Assert
      expect(mockHttpPatch).toHaveBeenCalledWith(
        `/attendees/${attendeeId}`,
        expectedPayload
      );
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should handle numeric attendee ID", async () => {
      // Arrange
      const attendeeId = 789;
      const input: IndiAttendeeConfig = {
        email: "test@example.com",
        name: "Test User",
        mobile: "+6591234567",
      };

      const mockResponse = {
        data: { code: 0, data: {} },
      };

      mockHttpPatch.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({});

      // Act
      await updateAttendee(attendeeId, input);

      // Assert
      expect(mockHttpPatch).toHaveBeenCalledWith(`/attendees/${attendeeId}`, {
        email: input.email,
        name: input.name,
        mobile: input.mobile,
      });
    });

    it("should handle API errors", async () => {
      // Arrange
      const attendeeId = "attendee-123";
      const input: IndiAttendeeConfig = {
        email: "test@example.com",
        name: "Test User",
        mobile: "+6591234567",
      };

      const error = new Error("Update failed");
      mockHttpPatch.mockRejectedValue(error);

      // Act & Assert
      await expect(updateAttendee(attendeeId, input)).rejects.toThrow(
        "Update failed"
      );
    });
  });

  describe("deleteAttendee", () => {
    it("should delete an attendee and return true", async () => {
      // Arrange
      const attendeeId = "attendee-123";
      const mockResponse = {
        data: { code: 0, data: true },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(true);

      // Act
      const result = await deleteAttendee(attendeeId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/attendees/${attendeeId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toBe(true);
    });

    it("should delete an attendee and return false", async () => {
      // Arrange
      const attendeeId = "attendee-456";
      const mockResponse = {
        data: { code: 0, data: false },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(false);

      // Act
      const result = await deleteAttendee(attendeeId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/attendees/${attendeeId}`);
      expect(result).toBe(false);
    });

    it("should handle numeric attendee ID", async () => {
      // Arrange
      const attendeeId = 789;
      const mockResponse = {
        data: { code: 0, data: true },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(true);

      // Act
      await deleteAttendee(attendeeId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/attendees/${attendeeId}`);
    });

    it("should handle deletion errors", async () => {
      // Arrange
      const attendeeId = "attendee-123";
      const error = new Error("Deletion failed");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteAttendee(attendeeId)).rejects.toThrow(
        "Deletion failed"
      );
    });

    it("should handle unwrap errors for failed deletion", async () => {
      // Arrange
      const attendeeId = "attendee-123";
      const mockResponse = {
        data: { code: 1, msg: "Not found" },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Not found");
      });

      // Act & Assert
      await expect(deleteAttendee(attendeeId)).rejects.toThrow("Not found");
    });
  });
});