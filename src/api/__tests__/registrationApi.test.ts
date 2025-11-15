import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  registerOrganizer,
  registerMember,
  getTenantMemberInfo,
} from "../registrationApi";
import type {
  OrganizerRegistration,
  MemberCompleteRegistration,
  MemberLookup,
  MemberPrefill,
  MemberPrefillResponse,
} from "@/lib/validation/schema";

// Mock dependencies
vi.mock("@/lib/http", () => ({
  http: {
    post: vi.fn(),
  },
}));

vi.mock("@/lib/utils", () => ({
  unwrap: vi.fn(),
}));

const mockHttpPost = http.post as MockedFunction<typeof http.post>;
const mockUnwrap = unwrap as MockedFunction<typeof unwrap>;

describe("registrationApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerOrganizer", () => {
    it("should register organizer successfully", async () => {
      // Arrange
      const organizerRegistration: OrganizerRegistration = {
        name: "John Doe",
        username: "johndoe",
        user_password: "password123",
        user_email: "john@example.com",
        user_mobile: "+6591234567",
        organisation_name: "Tech Corp",
        organisation_address: "123 Tech Street, Singapore",
      };

      const expectedPayload = {
        name: organizerRegistration.name,
        username: organizerRegistration.username,
        userPassword: organizerRegistration.user_password,
        userEmail: organizerRegistration.user_email,
        mobile: organizerRegistration.user_mobile,
        organizationName: organizerRegistration.organisation_name,
        organizationAddress: organizerRegistration.organisation_address,
      };

      const mockResponse = {
        data: { code: 0, data: true },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(true);

      // Act
      const result = await registerOrganizer(organizerRegistration);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/reg/organizer", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toBe(true);
    });

    it("should handle registration failure", async () => {
      // Arrange
      const organizerRegistration: OrganizerRegistration = {
        name: "Jane Smith",
        username: "janesmith",
        user_password: "password456",
        user_email: "jane@example.com",
        user_mobile: "+6598765432",
        organisation_name: "Design Studio",
        organisation_address: "456 Design Ave, Singapore",
      };

      const mockResponse = {
        data: { code: 0, data: false },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(false);

      // Act
      const result = await registerOrganizer(organizerRegistration);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle API errors during organizer registration", async () => {
      // Arrange
      const organizerRegistration: OrganizerRegistration = {
        name: "Error User",
        username: "erroruser",
        user_password: "password789",
        user_email: "error@example.com",
        user_mobile: "+6599999999",
        organisation_name: "Error Corp",
        organisation_address: "789 Error Street, Singapore",
      };

      const error = new Error("Registration failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerOrganizer(organizerRegistration)).rejects.toThrow("Registration failed");
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const organizerRegistration: OrganizerRegistration = {
        name: "Test User",
        username: "testuser",
        user_password: "testpass",
        user_email: "test@example.com",
        user_mobile: "+6591111111",
        organisation_name: "Test Corp",
        organisation_address: "Test Address",
      };

      const mockResponse = {
        data: { code: 1, msg: "Username already exists" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Username already exists");
      });

      // Act & Assert
      await expect(registerOrganizer(organizerRegistration)).rejects.toThrow("Username already exists");
    });

    it("should handle registration with minimal data", async () => {
      // Arrange
      const minimalRegistration: OrganizerRegistration = {
        name: "Minimal User",
        username: "minimal",
        user_password: "minpass",
        user_email: "minimal@example.com",
        user_mobile: "+6590000000",
        organisation_name: "Minimal Corp",
        organisation_address: "Minimal Address",
      };

      const mockResponse = {
        data: { code: 0, data: true },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(true);

      // Act
      const result = await registerOrganizer(minimalRegistration);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("registerMember", () => {
    it("should register member successfully", async () => {
      // Arrange
      const memberRegistration: MemberCompleteRegistration = {
        user_id: "user-123",
        user_name: "Alice Johnson",
        user_password: "memberpass123",
        user_mobile: "+6591234567",
      };

      const expectedPayload = {
        userId: memberRegistration.user_id,
        username: memberRegistration.user_name,
        password: memberRegistration.user_password,
        phone: memberRegistration.user_mobile,
      };

      const mockResponse = {
        data: { code: 0, data: true },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(true);

      // Act
      const result = await registerMember(memberRegistration);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/reg/member", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toBe(true);
    });

    it("should handle member registration failure", async () => {
      // Arrange
      const memberRegistration: MemberCompleteRegistration = {
        user_id: "user-456",
        user_name: "Bob Smith",
        user_password: "memberpass456",
        user_mobile: "+6598765432",
      };

      const mockResponse = {
        data: { code: 0, data: false },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(false);

      // Act
      const result = await registerMember(memberRegistration);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle API errors during member registration", async () => {
      // Arrange
      const memberRegistration: MemberCompleteRegistration = {
        user_id: "user-error",
        user_name: "Error Member",
        user_password: "errorpass",
        user_mobile: "+6599999999",
      };

      const error = new Error("Member registration failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(registerMember(memberRegistration)).rejects.toThrow("Member registration failed");
    });

    it("should handle unwrap errors for member registration", async () => {
      // Arrange
      const memberRegistration: MemberCompleteRegistration = {
        user_id: "user-unwrap-error",
        user_name: "Unwrap Error",
        user_password: "unwrappass",
        user_mobile: "+6590000000",
      };

      const mockResponse = {
        data: { code: 1, msg: "User ID already exists" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("User ID already exists");
      });

      // Act & Assert
      await expect(registerMember(memberRegistration)).rejects.toThrow("User ID already exists");
    });
  });

  describe("getTenantMemberInfo", () => {
    it("should get tenant member info successfully", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-123",
        user_id: "user-456",
      };

      const expectedPayload = {
        organizationId: memberLookup.organisation_id,
        userId: memberLookup.user_id,
      };

      const mockPrefillResponse: MemberPrefillResponse = {
        organizationName: "Tech Corporation",
        email: "member@techcorp.com",
      };

      const expectedResult: MemberPrefill = {
        organization_name: "Tech Corporation",
        email: "member@techcorp.com",
      };

      const mockResponse = {
        data: { code: 0, data: mockPrefillResponse },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockPrefillResponse);

      // Act
      const result = await getTenantMemberInfo(memberLookup);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/reg/search", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(expectedResult);
    });

    it("should handle member info with different organization", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-456",
        user_id: "user-789",
      };

      const mockPrefillResponse: MemberPrefillResponse = {
        organizationName: "Design Studio Ltd",
        email: "designer@studio.com",
      };

      const expectedResult: MemberPrefill = {
        organization_name: "Design Studio Ltd",
        email: "designer@studio.com",
      };

      const mockResponse = {
        data: { code: 0, data: mockPrefillResponse },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockPrefillResponse);

      // Act
      const result = await getTenantMemberInfo(memberLookup);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it("should handle API errors during member info lookup", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-error",
        user_id: "user-error",
      };

      const error = new Error("Member info lookup failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(getTenantMemberInfo(memberLookup)).rejects.toThrow("Member info lookup failed");
    });

    it("should handle unwrap errors during member info lookup", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-123",
        user_id: "user-not-found",
      };

      const mockResponse = {
        data: { code: 1, msg: "User not found" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("User not found");
      });

      // Act & Assert
      await expect(getTenantMemberInfo(memberLookup)).rejects.toThrow("User not found");
    });

    it("should handle schema validation errors for response", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-123",
        user_id: "user-456",
      };

      const invalidResponse = {
        organizationName: null, // Invalid - should be string
        email: "test@example.com",
      };

      const mockResponse = {
        data: { code: 0, data: invalidResponse },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(invalidResponse);

      // Act & Assert
      await expect(getTenantMemberInfo(memberLookup)).rejects.toThrow();
    });

    it("should handle schema validation errors for empty values", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-empty",
        user_id: "user-empty",
      };

      const mockPrefillResponse = {
        organizationName: "", // Will fail validation - too small
        email: "", // Will fail validation - invalid format
      };

      const mockResponse = {
        data: { code: 0, data: mockPrefillResponse },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockPrefillResponse);

      // Act & Assert - Should throw validation error
      await expect(getTenantMemberInfo(memberLookup)).rejects.toThrow();
    });

    it("should handle organization not found scenario", async () => {
      // Arrange
      const memberLookup: MemberLookup = {
        organisation_id: "org-nonexistent",
        user_id: "user-123",
      };

      const error = new Error("Organization not found");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(getTenantMemberInfo(memberLookup)).rejects.toThrow("Organization not found");
    });
  });
});