import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  getAttendees,
  createIndividualAttendee,
  updateAttendee,
  deleteAttendee,
  uploadAttendeesExcel,
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

  describe("uploadAttendeesExcel", () => {
    it("should upload Excel file with attendees data", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockFile = new File(
        ["attendee1,attendee2"], 
        "attendees.xlsx", 
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );

      const expectedFormData = new FormData();
      expectedFormData.append("file", mockFile, mockFile.name);

      const mockResponse = {
        data: { 
          code: 0, 
          data: { 
            imported: 5, 
            failed: 0, 
            errors: [] 
          } 
        },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ imported: 5, failed: 0, errors: [] });

      // Act
      const result = await uploadAttendeesExcel(mockFile, eventId);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(
        `/attendees/bulk/${eventId}`,
        expect.any(FormData),
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Verify FormData contains the file
      const callArgs = mockHttpPost.mock.calls[0];
      const formData = callArgs[1] as FormData;
      const uploadedFile = formData.get("file") as File;
      expect(uploadedFile.name).toBe(mockFile.name);
      expect(uploadedFile.type).toBe(mockFile.type);

      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ imported: 5, failed: 0, errors: [] });
    });

    it("should handle numeric event ID for file upload", async () => {
      // Arrange
      const eventId = 456;
      const mockFile = new File(["data"], "test.xlsx", { type: "application/xlsx" });
      const mockResponse = {
        data: { code: 0, data: { imported: 1, failed: 0, errors: [] } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ imported: 1, failed: 0, errors: [] });

      // Act
      await uploadAttendeesExcel(mockFile, eventId);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(
        `/attendees/bulk/${eventId}`,
        expect.any(FormData),
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    });

    it("should handle upload with validation errors", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockFile = new File(["invalid,data"], "attendees.xlsx", { type: "application/xlsx" });
      const mockResponse = {
        data: { 
          code: 0, 
          data: { 
            imported: 2, 
            failed: 1, 
            errors: ["Row 3: Invalid email format"] 
          } 
        },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ 
        imported: 2, 
        failed: 1, 
        errors: ["Row 3: Invalid email format"] 
      });

      // Act
      const result = await uploadAttendeesExcel(mockFile, eventId);

      // Assert
      expect(result).toEqual({
        imported: 2,
        failed: 1,
        errors: ["Row 3: Invalid email format"]
      });
    });

    it("should handle file upload API errors", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockFile = new File(["data"], "test.xlsx", { type: "application/xlsx" });
      const error = new Error("Upload failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(uploadAttendeesExcel(mockFile, eventId)).rejects.toThrow(
        "Upload failed"
      );
    });

    it("should handle different file types and sizes", async () => {
      // Arrange
      const eventId = "test-event-123";
      const largeContent = "a".repeat(1000); // Simulate larger file
      const mockFile = new File(
        [largeContent], 
        "large-attendees.csv", 
        { type: "text/csv" }
      );

      const mockResponse = {
        data: { code: 0, data: { imported: 100, failed: 0, errors: [] } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ imported: 100, failed: 0, errors: [] });

      // Act
      const result = await uploadAttendeesExcel(mockFile, eventId);

      // Assert
      expect(result).toEqual({ imported: 100, failed: 0, errors: [] });
      
      // Verify the file name is preserved
      const callArgs = mockHttpPost.mock.calls[0];
      const formData = callArgs[1] as FormData;
      const uploadedFile = formData.get("file") as File;
      expect(uploadedFile.name).toBe("large-attendees.csv");
    });

    it("should handle unwrap errors for file upload", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockFile = new File(["data"], "test.xlsx", { type: "application/xlsx" });
      const mockResponse = {
        data: { code: 1, msg: "File processing error" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("File processing error");
      });

      // Act & Assert
      await expect(uploadAttendeesExcel(mockFile, eventId)).rejects.toThrow(
        "File processing error"
      );
    });

    it("should preserve file properties in FormData", async () => {
      // Arrange
      const eventId = "test-event-123";
      const mockFile = new File(
        ["name,email,mobile\nJohn,john@test.com,+65123"], 
        "attendees-import.xlsx",
        { 
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          lastModified: Date.now()
        }
      );

      const mockResponse = {
        data: { code: 0, data: { imported: 1, failed: 0, errors: [] } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ imported: 1, failed: 0, errors: [] });

      // Act
      await uploadAttendeesExcel(mockFile, eventId);

      // Assert
      const callArgs = mockHttpPost.mock.calls[0];
      const formData = callArgs[1] as FormData;
      const uploadedFile = formData.get("file") as File;
      
      expect(uploadedFile.name).toBe(mockFile.name);
      expect(uploadedFile.type).toBe(mockFile.type);
      expect(uploadedFile.name).toBe("attendees-import.xlsx");
      expect(uploadedFile.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });
  });

  // Additional edge cases and integration-style tests
  describe("Edge Cases and Additional Scenarios", () => {
    describe("getAttendees edge cases", () => {
      it("should handle empty attendees list", async () => {
        // Arrange
        const eventId = "empty-event";
        const mockResponse = {
          data: { code: 0, data: [] },
        };

        mockHttpGet.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue([]);

        // Act
        const result = await getAttendees(eventId);

        // Assert
        expect(result).toEqual([]);
      });

      it("should handle event ID with special characters", async () => {
        // Arrange
        const eventId = "event-with-special-chars!@#$%";
        const encodedEventId = encodeURIComponent(eventId);
        const mockResponse = {
          data: { code: 0, data: [] },
        };

        mockHttpGet.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue([]);

        // Act
        await getAttendees(eventId);

        // Assert
        expect(mockHttpGet).toHaveBeenCalledWith(`/attendees/list/${encodedEventId}`);
      });

      it("should handle very large attendees list", async () => {
        // Arrange
        const eventId = "large-event";
        const largeAttendeesList: Attendee[] = Array.from({ length: 1000 }, (_, i) => ({
          id: `attendee-${i}`,
          attendeeEmail: `attendee${i}@example.com`,
          attendeeName: `Attendee ${i}`,
          attendeeMobile: `+65${8 + (i % 2)}${String(1234567 + i).slice(-7)}`,
          checkInToken: `token-${i}`,
          qrCodeBase64: null,
          qrCodeUrl: null,
          checkInStatus: (i % 2) as 0 | 1,
        }));

        const mockResponse = {
          data: { code: 0, data: largeAttendeesList },
        };

        mockHttpGet.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue(largeAttendeesList);

        // Act
        const result = await getAttendees(eventId);

        // Assert
        expect(result).toHaveLength(1000);
        expect(result[0].id).toBe("attendee-0");
        expect(result[999].id).toBe("attendee-999");
      });
    });

    describe("createIndividualAttendee edge cases", () => {
      it("should handle attendee config with minimum required fields", async () => {
        // Arrange
        const eventId = "test-event";
        const minimalInput: IndiAttendeeConfig = {
          email: "minimal@test.com",
          name: "Min",
          mobile: "+65123",
        };

        const mockResponse = {
          data: { code: 0, data: { id: "new-id" } },
        };

        mockHttpPost.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue({ id: "new-id" });

        // Act
        const result = await createIndividualAttendee(minimalInput, eventId);

        // Assert
        expect(mockHttpPost).toHaveBeenCalledWith("/attendees", {
          eventId: eventId,
          attendees: [minimalInput],
        });
        expect(result).toEqual({ id: "new-id" });
      });

      it("should handle attendee with special characters in fields", async () => {
        // Arrange
        const eventId = "test-event";
        const specialCharsInput: IndiAttendeeConfig = {
          email: "test+special@domain-name.co.uk",
          name: "José María O'Connor-Smith",
          mobile: "+65-9876-5432",
        };

        const mockResponse = {
          data: { code: 0, data: { id: "special-id" } },
        };

        mockHttpPost.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue({ id: "special-id" });

        // Act
        await createIndividualAttendee(specialCharsInput, eventId);

        // Assert
        expect(mockHttpPost).toHaveBeenCalledWith("/attendees", {
          eventId: eventId,
          attendees: [specialCharsInput],
        });
      });
    });

    describe("updateAttendee edge cases", () => {
      it("should handle partial updates", async () => {
        // Arrange
        const attendeeId = "attendee-123";
        const partialInput: IndiAttendeeConfig = {
          email: "updated@test.com",
          name: "Updated Name",
          mobile: "+65999",
        };

        const mockResponse = {
          data: { code: 0, data: { updated: true } },
        };

        mockHttpPatch.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue({ updated: true });

        // Act
        await updateAttendee(attendeeId, partialInput);

        // Assert
        expect(mockHttpPatch).toHaveBeenCalledWith(`/attendees/${attendeeId}`, {
          email: partialInput.email,
          name: partialInput.name,
          mobile: partialInput.mobile,
        });
      });

      it("should handle zero-length attendee ID", async () => {
        // Arrange
        const attendeeId = "";
        const input: IndiAttendeeConfig = {
          email: "test@example.com",
          name: "Test",
          mobile: "+65123",
        };

        const mockResponse = {
          data: { code: 0, data: {} },
        };

        mockHttpPatch.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue({});

        // Act
        await updateAttendee(attendeeId, input);

        // Assert
        expect(mockHttpPatch).toHaveBeenCalledWith("/attendees/", {
          email: input.email,
          name: input.name,
          mobile: input.mobile,
        });
      });
    });

    describe("deleteAttendee edge cases", () => {
      it("should handle zero-value attendee ID", async () => {
        // Arrange
        const attendeeId = 0;
        const mockResponse = {
          data: { code: 0, data: true },
        };

        mockHttpDelete.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue(true);

        // Act
        await deleteAttendee(attendeeId);

        // Assert
        expect(mockHttpDelete).toHaveBeenCalledWith("/attendees/0");
      });

      it("should handle very large attendee ID", async () => {
        // Arrange
        const attendeeId = "attendee-" + "9".repeat(100);
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
    });

    describe("Error handling scenarios", () => {
      it("should handle timeout errors", async () => {
        // Arrange
        const eventId = "timeout-test";
        const timeoutError = new Error("Request timeout");
        timeoutError.name = "TimeoutError";
        mockHttpGet.mockRejectedValue(timeoutError);

        // Act & Assert
        await expect(getAttendees(eventId)).rejects.toThrow("Request timeout");
      });

      it("should handle network errors", async () => {
        // Arrange
        const attendeeId = "network-test";
        const input: IndiAttendeeConfig = {
          email: "test@example.com",
          name: "Test",
          mobile: "+65123",
        };
        const networkError = new Error("Network unavailable");
        networkError.name = "NetworkError";
        mockHttpPatch.mockRejectedValue(networkError);

        // Act & Assert
        await expect(updateAttendee(attendeeId, input)).rejects.toThrow(
          "Network unavailable"
        );
      });

      it("should handle server errors (5xx)", async () => {
        // Arrange
        const eventId = "server-error-test";
        const mockFile = new File(["data"], "test.xlsx", { type: "application/xlsx" });
        const serverError = new Error("Internal Server Error");
        serverError.name = "HTTPError";
        mockHttpPost.mockRejectedValue(serverError);

        // Act & Assert
        await expect(uploadAttendeesExcel(mockFile, eventId)).rejects.toThrow(
          "Internal Server Error"
        );
      });
    });

    describe("Schema validation edge cases", () => {
      it("should handle attendees response with unexpected data structure", async () => {
        // Arrange
        const eventId = "schema-test";
        const invalidData = { unexpected: "structure" };
        const mockResponse = {
          data: { code: 0, data: invalidData },
        };

        mockHttpGet.mockResolvedValue(mockResponse);
        mockUnwrap.mockReturnValue(invalidData);

        // This would typically fail schema parsing, but we test the flow
        // Act & Assert
        await expect(getAttendees(eventId)).rejects.toThrow();
      });
    });
  });
});