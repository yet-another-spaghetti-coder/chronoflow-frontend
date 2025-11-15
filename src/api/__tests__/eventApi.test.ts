import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../eventApi";
import type { EventConfig, OrgEvent } from "@/lib/validation/schema";

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

describe("eventApi", () => {
  const mockEvent: OrgEvent = {
    id: "event-123",
    name: "Tech Conference 2025",
    description: "Annual technology conference",
    location: "Convention Center",
    status: 1,
    startTime: new Date("2025-11-20T09:00:00Z"),
    endTime: new Date("2025-11-20T17:00:00Z"),
    remark: "Important event",
    joiningParticipants: 150,
    groups: [
      { id: "group-1", name: "Developers" },
      { id: "group-2", name: "Designers" },
    ],
    taskStatus: {
      total: 10,
      remaining: 3,
      completed: 7,
    },
  };

  const mockEventConfig: EventConfig = {
    name: "New Conference",
    description: "A new conference",
    location: "New Venue",
    startTime: new Date("2025-12-01T10:00:00Z"),
    endTime: new Date("2025-12-01T18:00:00Z"),
    remark: "Test event",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEvents", () => {
    it("should fetch all events successfully", async () => {
      // Arrange
      const mockEvents: OrgEvent[] = [mockEvent];
      const mockResponse = {
        data: { code: 0, data: mockEvents },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockEvents);

      // Act
      const result = await getEvents();

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith("/events");
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockEvents);
    });

    it("should return empty array when no events exist", async () => {
      // Arrange
      const mockEvents: OrgEvent[] = [];
      const mockResponse = {
        data: { code: 0, data: mockEvents },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockEvents);

      // Act
      const result = await getEvents();

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith("/events");
      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      // Arrange
      const error = new Error("Server error");
      mockHttpGet.mockRejectedValue(error);

      // Act & Assert
      await expect(getEvents()).rejects.toThrow("Server error");
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const mockResponse = {
        data: { code: 1, msg: "Unauthorized" },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Unauthorized");
      });

      // Act & Assert
      await expect(getEvents()).rejects.toThrow("Unauthorized");
    });

    it("should handle schema validation errors", async () => {
      // Arrange
      const invalidEvents = [{ id: 123, name: null }]; // Invalid schema
      const mockResponse = {
        data: { code: 0, data: invalidEvents },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(invalidEvents);

      // Act & Assert
      await expect(getEvents()).rejects.toThrow();
    });
  });

  describe("getEventById", () => {
    it("should fetch event by string id successfully", async () => {
      // Arrange
      const eventId = "event-123";
      const mockResponse = {
        data: { code: 0, data: mockEvent },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockEvent);

      // Act
      const result = await getEventById(eventId);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/events/${eventId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockEvent);
    });

    it("should fetch event by numeric id successfully", async () => {
      // Arrange
      const eventId = 456;
      const mockResponse = {
        data: { code: 0, data: mockEvent },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockEvent);

      // Act
      const result = await getEventById(eventId);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/events/${eventId}`);
      expect(result).toEqual(mockEvent);
    });

    it("should handle event not found", async () => {
      // Arrange
      const eventId = "non-existent-event";
      const error = new Error("Event not found");
      mockHttpGet.mockRejectedValue(error);

      // Act & Assert
      await expect(getEventById(eventId)).rejects.toThrow("Event not found");
    });

    it("should handle schema validation errors for single event", async () => {
      // Arrange
      const eventId = "event-123";
      const invalidEvent = { id: 123, name: null }; // Invalid schema
      const mockResponse = {
        data: { code: 0, data: invalidEvent },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(invalidEvent);

      // Act & Assert
      await expect(getEventById(eventId)).rejects.toThrow();
    });
  });

  describe("createEvent", () => {
    it("should create event successfully with all fields", async () => {
      // Arrange
      const expectedPayload = {
        name: mockEventConfig.name,
        description: mockEventConfig.description,
        location: mockEventConfig.location,
        startTime: "2025-12-01T10:00:00Z",
        endTime: "2025-12-01T18:00:00Z",
        remark: mockEventConfig.remark,
      };

      const mockResponse = {
        data: { code: 0, data: { id: "new-event-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "new-event-id" });

      // Act
      const result = await createEvent(mockEventConfig);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/events", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ id: "new-event-id" });
    });

    it("should create event successfully with minimal fields", async () => {
      // Arrange
      const minimalConfig: EventConfig = {
        name: "Minimal Event",
        location: "Venue",
        startTime: new Date("2025-12-01T10:00:00Z"),
        endTime: new Date("2025-12-01T18:00:00Z"),
      };

      const expectedPayload = {
        name: minimalConfig.name,
        description: undefined,
        location: minimalConfig.location,
        startTime: "2025-12-01T10:00:00Z",
        endTime: "2025-12-01T18:00:00Z",
      };

      const mockResponse = {
        data: { code: 0, data: { id: "minimal-event-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "minimal-event-id" });

      // Act
      const result = await createEvent(minimalConfig);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/events", expectedPayload);
      expect(result).toEqual({ id: "minimal-event-id" });
    });

    it("should create event with null description and remark", async () => {
      // Arrange
      const configWithNulls: EventConfig = {
        name: "Event with Nulls",
        description: null,
        location: "Venue",
        startTime: new Date("2025-12-01T10:00:00Z"),
        endTime: new Date("2025-12-01T18:00:00Z"),
        remark: null,
      };

      const expectedPayload = {
        name: configWithNulls.name,
        description: undefined,
        location: configWithNulls.location,
        startTime: "2025-12-01T10:00:00Z",
        endTime: "2025-12-01T18:00:00Z",
      };

      const mockResponse = {
        data: { code: 0, data: { id: "null-event-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "null-event-id" });

      // Act
      const result = await createEvent(configWithNulls);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/events", expectedPayload);
      expect(result).toEqual({ id: "null-event-id" });
    });

    it("should throw error when startTime is missing", async () => {
      // Arrange
      const invalidConfig = {
        name: "Invalid Event",
        location: "Venue",
        endTime: new Date("2025-12-01T18:00:00Z"),
      } as EventConfig;

      // Act & Assert
      await expect(createEvent(invalidConfig)).rejects.toThrow(
        "Start time and end time are required"
      );
    });

    it("should throw error when endTime is missing", async () => {
      // Arrange
      const invalidConfig = {
        name: "Invalid Event",
        location: "Venue",
        startTime: new Date("2025-12-01T10:00:00Z"),
      } as EventConfig;

      // Act & Assert
      await expect(createEvent(invalidConfig)).rejects.toThrow(
        "Start time and end time are required"
      );
    });

    it("should handle API errors during creation", async () => {
      // Arrange
      const error = new Error("Creation failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(createEvent(mockEventConfig)).rejects.toThrow("Creation failed");
    });

    it("should format dates correctly without milliseconds", async () => {
      // Arrange
      const configWithMillis: EventConfig = {
        name: "Event with Milliseconds",
        location: "Venue",
        startTime: new Date("2025-12-01T10:00:00.123Z"),
        endTime: new Date("2025-12-01T18:00:00.456Z"),
      };

      const expectedPayload = {
        name: configWithMillis.name,
        description: undefined,
        location: configWithMillis.location,
        startTime: "2025-12-01T10:00:00Z", // No milliseconds
        endTime: "2025-12-01T18:00:00Z", // No milliseconds
      };

      const mockResponse = {
        data: { code: 0, data: { id: "millis-event-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "millis-event-id" });

      // Act
      await createEvent(configWithMillis);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/events", expectedPayload);
    });
  });

  describe("updateEvent", () => {
    it("should update event successfully", async () => {
      // Arrange
      const eventId = "event-123";
      const expectedPayload = {
        name: mockEventConfig.name,
        description: mockEventConfig.description,
        location: mockEventConfig.location,
        startTime: "2025-12-01T10:00:00Z",
        endTime: "2025-12-01T18:00:00Z",
        remark: mockEventConfig.remark,
      };

      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpPatch.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await updateEvent(eventId, mockEventConfig);

      // Assert
      expect(mockHttpPatch).toHaveBeenCalledWith(`/events/${eventId}`, expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should update event with minimal fields", async () => {
      // Arrange
      const eventId = "event-456";
      const minimalConfig: EventConfig = {
        name: "Updated Minimal Event",
        location: "Updated Venue",
        startTime: new Date("2025-12-02T09:00:00Z"),
        endTime: new Date("2025-12-02T17:00:00Z"),
      };

      const expectedPayload = {
        name: minimalConfig.name,
        description: undefined,
        location: minimalConfig.location,
        startTime: "2025-12-02T09:00:00Z",
        endTime: "2025-12-02T17:00:00Z",
      };

      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpPatch.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await updateEvent(eventId, minimalConfig);

      // Assert
      expect(mockHttpPatch).toHaveBeenCalledWith(`/events/${eventId}`, expectedPayload);
      expect(result).toEqual({ success: true });
    });

    it("should throw error when startTime is missing during update", async () => {
      // Arrange
      const eventId = "event-123";
      const invalidConfig = {
        name: "Invalid Update",
        location: "Venue",
        endTime: new Date("2025-12-01T18:00:00Z"),
      } as EventConfig;

      // Act & Assert
      await expect(updateEvent(eventId, invalidConfig)).rejects.toThrow(
        "Start time and end time are required"
      );
    });

    it("should throw error when endTime is missing during update", async () => {
      // Arrange
      const eventId = "event-123";
      const invalidConfig = {
        name: "Invalid Update",
        location: "Venue",
        startTime: new Date("2025-12-01T10:00:00Z"),
      } as EventConfig;

      // Act & Assert
      await expect(updateEvent(eventId, invalidConfig)).rejects.toThrow(
        "Start time and end time are required"
      );
    });

    it("should handle API errors during update", async () => {
      // Arrange
      const eventId = "event-123";
      const error = new Error("Update failed");
      mockHttpPatch.mockRejectedValue(error);

      // Act & Assert
      await expect(updateEvent(eventId, mockEventConfig)).rejects.toThrow("Update failed");
    });

    it("should handle event not found during update", async () => {
      // Arrange
      const eventId = "non-existent-event";
      const error = new Error("Event not found");
      mockHttpPatch.mockRejectedValue(error);

      // Act & Assert
      await expect(updateEvent(eventId, mockEventConfig)).rejects.toThrow("Event not found");
    });
  });

  describe("deleteEvent", () => {
    it("should delete event successfully", async () => {
      // Arrange
      const eventId = "event-123";
      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await deleteEvent(eventId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/events/${eventId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should handle event not found during deletion", async () => {
      // Arrange
      const eventId = "non-existent-event";
      const error = new Error("Event not found");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteEvent(eventId)).rejects.toThrow("Event not found");
    });

    it("should handle API errors during deletion", async () => {
      // Arrange
      const eventId = "event-123";
      const error = new Error("Deletion failed");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteEvent(eventId)).rejects.toThrow("Deletion failed");
    });

    it("should handle deletion of event with dependencies", async () => {
      // Arrange
      const eventId = "event-with-deps";
      const error = new Error("Cannot delete event with dependencies");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteEvent(eventId)).rejects.toThrow("Cannot delete event with dependencies");
    });

    it("should handle successful deletion returning boolean", async () => {
      // Arrange
      const eventId = "event-456";
      const mockResponse = {
        data: { code: 0, data: true },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(true);

      // Act
      const result = await deleteEvent(eventId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/events/${eventId}`);
      expect(result).toBe(true);
    });
  });
});