import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  getGroupsByEvent,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  addMembersToGroup,
  removeMembersFromGroup,
} from "../groupApi";
import type {
  Group,
  GroupConfig,
  CreateGroupConfig,
  GroupMember,
} from "@/lib/validation/schema";

// Mock dependencies
vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/utils", () => ({
  unwrap: vi.fn(),
}));

const mockHttpGet = http.get as MockedFunction<typeof http.get>;
const mockHttpPost = http.post as MockedFunction<typeof http.post>;
const mockHttpPut = http.put as MockedFunction<typeof http.put>;
const mockHttpDelete = http.delete as MockedFunction<typeof http.delete>;
const mockUnwrap = unwrap as MockedFunction<typeof unwrap>;

describe("groupApi", () => {
  const mockGroup: Group = {
    id: "group-123",
    name: "Developers Team",
    eventId: "event-456",
    leadUserId: "user-789",
    leadUserName: "John Doe",
    remark: "Main development team",
    sort: 1,
    status: 1,
    memberCount: 5,
    members: [
      {
        userId: "user-1",
        username: "Alice Johnson",
        email: "alice@example.com",
        phone: "+6591234567",
        roleId: "role-1",
        roleName: "Member",
        joinTime: new Date("2025-11-15T10:00:00Z"),
      },
    ],
    createTime: new Date("2025-11-15T09:00:00Z"),
    updateTime: new Date("2025-11-15T10:00:00Z"),
    statusName: "Active",
    eventName: "Tech Conference 2025",
  };

  const mockGroupMember: GroupMember = {
    userId: "user-2",
    username: "Bob Smith",
    email: "bob@example.com",
    phone: "+6598765432",
    roleId: "role-2",
    roleName: "Admin",
    joinTime: new Date("2025-11-15T11:00:00Z"),
  };

  const mockCreateGroupConfig: CreateGroupConfig = {
    name: "New Team",
    eventId: "event-789",
    leadUserId: "user-456",
    remark: "Test team",
    sort: 2,
  };

  const mockGroupConfig: GroupConfig = {
    name: "Updated Team",
    leadUserId: "user-123",
    remark: "Updated test team",
    sort: 3,
    status: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGroupsByEvent", () => {
    it("should fetch groups for an event successfully", async () => {
      // Arrange
      const eventId = "event-123";
      const mockGroups: Group[] = [mockGroup];
      const mockResponse = {
        data: { code: 0, data: mockGroups },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockGroups);

      // Act
      const result = await getGroupsByEvent(eventId);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/events/groups/list?eventId=${eventId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockGroups);
    });

    it("should return empty array when no groups exist", async () => {
      // Arrange
      const eventId = "event-456";
      const mockGroups: Group[] = [];
      const mockResponse = {
        data: { code: 0, data: mockGroups },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockGroups);

      // Act
      const result = await getGroupsByEvent(eventId);

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      // Arrange
      const eventId = "event-789";
      const error = new Error("Server error");
      mockHttpGet.mockRejectedValue(error);

      // Act & Assert
      await expect(getGroupsByEvent(eventId)).rejects.toThrow("Server error");
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const eventId = "event-123";
      const mockResponse = {
        data: { code: 1, msg: "Unauthorized" },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Unauthorized");
      });

      // Act & Assert
      await expect(getGroupsByEvent(eventId)).rejects.toThrow("Unauthorized");
    });
  });

  describe("createGroup", () => {
    it("should create a group successfully with all fields", async () => {
      // Arrange
      const expectedPayload = {
        name: mockCreateGroupConfig.name,
        eventId: mockCreateGroupConfig.eventId,
        leadUserId: mockCreateGroupConfig.leadUserId,
        remark: mockCreateGroupConfig.remark,
        sort: mockCreateGroupConfig.sort,
      };

      const mockResponse = {
        data: { code: 0, data: { id: "new-group-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "new-group-id" });

      // Act
      const result = await createGroup(mockCreateGroupConfig);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/events/groups/create", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ id: "new-group-id" });
    });

    it("should create a group with minimal fields (null defaults)", async () => {
      // Arrange
      const minimalConfig: CreateGroupConfig = {
        name: "Minimal Team",
        eventId: "event-123",
        leadUserId: "user-minimal",
        sort: 0,
      };

      const expectedPayload = {
        name: minimalConfig.name,
        eventId: minimalConfig.eventId,
        leadUserId: minimalConfig.leadUserId,
        remark: null,
        sort: minimalConfig.sort,
      };

      const mockResponse = {
        data: { code: 0, data: { id: "minimal-group-id" } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ id: "minimal-group-id" });

      // Act
      const result = await createGroup(minimalConfig);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/events/groups/create", expectedPayload);
      expect(result).toEqual({ id: "minimal-group-id" });
    });

    it("should handle API errors during creation", async () => {
      // Arrange
      const error = new Error("Creation failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(createGroup(mockCreateGroupConfig)).rejects.toThrow("Creation failed");
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const mockResponse = {
        data: { code: 1, msg: "Validation error" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Validation error");
      });

      // Act & Assert
      await expect(createGroup(mockCreateGroupConfig)).rejects.toThrow("Validation error");
    });
  });

  describe("updateGroup", () => {
    it("should update a group successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const expectedPayload = {
        id: groupId,
        name: mockGroupConfig.name,
        leadUserId: mockGroupConfig.leadUserId,
        remark: mockGroupConfig.remark,
        sort: mockGroupConfig.sort,
        status: mockGroupConfig.status,
      };

      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpPut.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await updateGroup(groupId, mockGroupConfig);

      // Assert
      expect(mockHttpPut).toHaveBeenCalledWith("/events/groups/update", expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should update group with null fields", async () => {
      // Arrange
      const groupId = "group-456";
      const configWithNulls: GroupConfig = {
        name: "Updated Team",
        leadUserId: null,
        remark: null,
        sort: 1,
        status: 1,
      };

      const expectedPayload = {
        id: groupId,
        name: configWithNulls.name,
        leadUserId: null,
        remark: null,
        sort: configWithNulls.sort,
        status: configWithNulls.status,
      };

      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpPut.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await updateGroup(groupId, configWithNulls);

      // Assert
      expect(mockHttpPut).toHaveBeenCalledWith("/events/groups/update", expectedPayload);
      expect(result).toEqual({ success: true });
    });

    it("should handle API errors during update", async () => {
      // Arrange
      const groupId = "group-123";
      const error = new Error("Update failed");
      mockHttpPut.mockRejectedValue(error);

      // Act & Assert
      await expect(updateGroup(groupId, mockGroupConfig)).rejects.toThrow("Update failed");
    });

    it("should handle group not found", async () => {
      // Arrange
      const groupId = "non-existent-group";
      const error = new Error("Group not found");
      mockHttpPut.mockRejectedValue(error);

      // Act & Assert
      await expect(updateGroup(groupId, mockGroupConfig)).rejects.toThrow("Group not found");
    });
  });

  describe("deleteGroup", () => {
    it("should delete a group successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await deleteGroup(groupId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/events/groups/delete/${groupId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should handle group not found during deletion", async () => {
      // Arrange
      const groupId = "non-existent-group";
      const error = new Error("Group not found");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteGroup(groupId)).rejects.toThrow("Group not found");
    });

    it("should handle API errors during deletion", async () => {
      // Arrange
      const groupId = "group-123";
      const error = new Error("Deletion failed");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(deleteGroup(groupId)).rejects.toThrow("Deletion failed");
    });
  });

  describe("getGroupMembers", () => {
    it("should fetch group members successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const mockMembers: GroupMember[] = [mockGroupMember];
      const mockResponse = {
        data: { code: 0, data: mockMembers },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockMembers);

      // Act
      const result = await getGroupMembers(groupId);

      // Assert
      expect(mockHttpGet).toHaveBeenCalledWith(`/events/groups/${groupId}/members`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual(mockMembers);
    });

    it("should return empty array when no members exist", async () => {
      // Arrange
      const groupId = "group-456";
      const mockMembers: GroupMember[] = [];
      const mockResponse = {
        data: { code: 0, data: mockMembers },
      };

      mockHttpGet.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(mockMembers);

      // Act
      const result = await getGroupMembers(groupId);

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle API errors", async () => {
      // Arrange
      const groupId = "group-123";
      const error = new Error("Server error");
      mockHttpGet.mockRejectedValue(error);

      // Act & Assert
      await expect(getGroupMembers(groupId)).rejects.toThrow("Server error");
    });
  });

  describe("addMemberToGroup", () => {
    it("should add member to group successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await addMemberToGroup(groupId, userId);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(`/events/groups/${groupId}/members/${userId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should handle member already in group", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const error = new Error("Member already in group");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(addMemberToGroup(groupId, userId)).rejects.toThrow("Member already in group");
    });

    it("should handle API errors", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const error = new Error("Server error");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(addMemberToGroup(groupId, userId)).rejects.toThrow("Server error");
    });
  });

  describe("removeMemberFromGroup", () => {
    it("should remove member from group successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const mockResponse = {
        data: { code: 0, data: { success: true } },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true });

      // Act
      const result = await removeMemberFromGroup(groupId, userId);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/events/groups/${groupId}/members/${userId}`);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true });
    });

    it("should handle member not in group", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const error = new Error("Member not in group");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(removeMemberFromGroup(groupId, userId)).rejects.toThrow("Member not in group");
    });

    it("should handle API errors", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const error = new Error("Server error");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(removeMemberFromGroup(groupId, userId)).rejects.toThrow("Server error");
    });
  });

  describe("addMembersToGroup", () => {
    it("should add multiple members to group successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const userIds = ["user-1", "user-2", "user-3"];
      const expectedPayload = { userIds };
      const mockResponse = {
        data: { code: 0, data: { success: true, added: 3 } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true, added: 3 });

      // Act
      const result = await addMembersToGroup(groupId, userIds);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(`/events/groups/${groupId}/members/batch`, expectedPayload);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true, added: 3 });
    });

    it("should handle empty user list", async () => {
      // Arrange
      const groupId = "group-123";
      const userIds: string[] = [];
      const expectedPayload = { userIds };
      const mockResponse = {
        data: { code: 0, data: { success: true, added: 0 } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true, added: 0 });

      // Act
      const result = await addMembersToGroup(groupId, userIds);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith(`/events/groups/${groupId}/members/batch`, expectedPayload);
      expect(result).toEqual({ success: true, added: 0 });
    });

    it("should handle API errors during batch add", async () => {
      // Arrange
      const groupId = "group-123";
      const userIds = ["user-1", "user-2"];
      const error = new Error("Batch add failed");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(addMembersToGroup(groupId, userIds)).rejects.toThrow("Batch add failed");
    });
  });

  describe("removeMembersFromGroup", () => {
    it("should remove multiple members from group successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const userIds = ["user-1", "user-2", "user-3"];
      const mockResponse = {
        data: { code: 0, data: { success: true, removed: 3 } },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true, removed: 3 });

      // Act
      const result = await removeMembersFromGroup(groupId, userIds);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/events/groups/${groupId}/members/batch`, {
        data: userIds,
      });
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(result).toEqual({ success: true, removed: 3 });
    });

    it("should handle empty user list for removal", async () => {
      // Arrange
      const groupId = "group-123";
      const userIds: string[] = [];
      const mockResponse = {
        data: { code: 0, data: { success: true, removed: 0 } },
      };

      mockHttpDelete.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ success: true, removed: 0 });

      // Act
      const result = await removeMembersFromGroup(groupId, userIds);

      // Assert
      expect(mockHttpDelete).toHaveBeenCalledWith(`/events/groups/${groupId}/members/batch`, {
        data: userIds,
      });
      expect(result).toEqual({ success: true, removed: 0 });
    });

    it("should handle API errors during batch remove", async () => {
      // Arrange
      const groupId = "group-123";
      const userIds = ["user-1", "user-2"];
      const error = new Error("Batch remove failed");
      mockHttpDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(removeMembersFromGroup(groupId, userIds)).rejects.toThrow("Batch remove failed");
    });
  });
});