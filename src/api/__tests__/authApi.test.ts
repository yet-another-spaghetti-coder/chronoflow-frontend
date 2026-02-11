import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { deleteFcmToken } from "@/lib/firebase/firebaseUtils";
import { revokeDeviceByToken } from "../pushNotiApi";
import { login, logout, refresh } from "../authApi";
import type { User, AuthCredentials } from "@/lib/auth-type";
import type { LoginUser } from "@/lib/validation/schema";

// Mock dependencies
vi.mock("@/lib/http", () => ({
  http: {
    post: vi.fn(),
  },
}));

vi.mock("@/lib/utils", () => ({
  unwrap: vi.fn(),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/lib/firebase/firebaseUtils", () => ({
  deleteFcmToken: vi.fn(),
}));

vi.mock("../pushNotiApi", () => ({
  revokeDeviceByToken: vi.fn(),
}));

const mockHttpPost = http.post as MockedFunction<typeof http.post>;
const mockUnwrap = unwrap as MockedFunction<typeof unwrap>;
const mockUseAuthStore = useAuthStore as unknown as {
  getState: MockedFunction<() => ReturnType<typeof useAuthStore.getState>>;
};
const mockDeleteFcmToken = deleteFcmToken as MockedFunction<typeof deleteFcmToken>;
const mockRevokeDeviceByToken = revokeDeviceByToken as MockedFunction<typeof revokeDeviceByToken>;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
};
Object.defineProperty(console, 'log', { value: mockConsole.log });
Object.defineProperty(console, 'warn', { value: mockConsole.warn });

describe("authApi", () => {
  const mockUser: User = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
  };

  const mockAuthStore = {
    user: mockUser,
    setAuth: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.getState.mockReturnValue(mockAuthStore);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully and set auth state", async () => {
      // Arrange
      const credentials: LoginUser = {
        username: "testuser",
        password: "password123",
        remember: false,
      };

      const expectedAuthCredentials: AuthCredentials = {
        user: mockUser,
      };

      const mockResponse = {
        data: { code: 0, data: expectedAuthCredentials },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue(expectedAuthCredentials);

      // Act
      const result = await login(credentials);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/login", credentials);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(mockAuthStore.setAuth).toHaveBeenCalledWith({ user: mockUser });
      expect(result).toEqual(expectedAuthCredentials);
    });

    it("should login successfully without user data in response", async () => {
      // Arrange
      const credentials: LoginUser = {
        username: "testuser",
        password: "password123",
        remember: false,
      };

      // Response without user data
      const mockResponse = {
        data: { code: 0, data: { user: null } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockReturnValue({ user: null });

      // Act
      const result = await login(credentials);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/login", credentials);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
      expect(result).toEqual({ user: null });
    });

    it("should handle login errors", async () => {
      // Arrange
      const credentials: LoginUser = {
        username: "testuser",
        password: "wrongpassword",
        remember: false,
      };

      const error = new Error("Invalid credentials");
      mockHttpPost.mockRejectedValue(error);

      // Act & Assert
      await expect(login(credentials)).rejects.toThrow("Invalid credentials");
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
    });

    it("should handle unwrap errors", async () => {
      // Arrange
      const credentials: LoginUser = {
        username: "testuser",
        password: "password123",
        remember: false,
      };

      const mockResponse = {
        data: { code: 1, msg: "Server error" },
      };

      mockHttpPost.mockResolvedValue(mockResponse);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Server error");
      });

      // Act & Assert
      await expect(login(credentials)).rejects.toThrow("Server error");
    });
  });

  describe("logout", () => {
    it("should logout successfully with FCM token cleanup", async () => {
      // Arrange
      const fcmToken = "fcm-token-123";
      const cacheKey = `fcm_token_${mockUser.id}`;
      
      mockLocalStorage.getItem.mockReturnValue(fcmToken);
      mockRevokeDeviceByToken.mockResolvedValue();
      mockDeleteFcmToken.mockResolvedValue(true);
      mockHttpPost.mockResolvedValue({ data: { code: 0 } });

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(cacheKey);
      expect(mockRevokeDeviceByToken).toHaveBeenCalledWith(fcmToken);
      expect(mockDeleteFcmToken).toHaveBeenCalled();
      expect(mockHttpPost).toHaveBeenCalledWith("/users/system/auth/logout", {});
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(mockAuthStore.clear).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith("[Logout] Device revoked on backend");
      expect(mockConsole.log).toHaveBeenCalledWith("[Logout] FCM token deleted locally");
      expect(mockConsole.log).toHaveBeenCalledWith("[Logout] Local state cleared");
    });

    it("should logout successfully without FCM token", async () => {
      // Arrange
      const cacheKey = `fcm_token_${mockUser.id}`;
      
      mockLocalStorage.getItem.mockReturnValue(null);
      mockDeleteFcmToken.mockResolvedValue(true);
      mockHttpPost.mockResolvedValue({ data: { code: 0 } });

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(cacheKey);
      expect(mockRevokeDeviceByToken).not.toHaveBeenCalled();
      expect(mockDeleteFcmToken).toHaveBeenCalled();
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/logout", {});
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(mockAuthStore.clear).toHaveBeenCalled();
    });

    it("should logout successfully when user is null", async () => {
      // Arrange
      const nullUserAuthStore = {
        user: null,
        setAuth: vi.fn(),
        clear: vi.fn(),
      };
      mockUseAuthStore.getState.mockReturnValue(nullUserAuthStore);
      const cacheKey = "fcm_token_unknown";
      
      mockLocalStorage.getItem.mockReturnValue(null);
      mockDeleteFcmToken.mockResolvedValue(true);
      mockHttpPost.mockResolvedValue({ data: { code: 0 } });

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(cacheKey);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(nullUserAuthStore.clear).toHaveBeenCalled();
    });

    it("should handle revokeDeviceByToken failure gracefully", async () => {
      // Arrange
      const fcmToken = "fcm-token-123";
      const cacheKey = `fcm_token_${mockUser.id}`;
      
      mockLocalStorage.getItem.mockReturnValue(fcmToken);
      mockRevokeDeviceByToken.mockRejectedValue(new Error("Network error"));
      mockDeleteFcmToken.mockResolvedValue(true);
      mockHttpPost.mockResolvedValue({ data: { code: 0 } });

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(cacheKey);
      expect(mockRevokeDeviceByToken).toHaveBeenCalledWith(fcmToken);
      expect(mockConsole.warn).toHaveBeenCalledWith("[Logout] Failed to revoke device:", expect.any(Error));
      expect(mockDeleteFcmToken).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(mockAuthStore.clear).toHaveBeenCalled();
    });

    it("should handle deleteFcmToken failure gracefully", async () => {
      // Arrange
      const fcmToken = "fcm-token-123";
      const cacheKey = `fcm_token_${mockUser.id}`;
      
      mockLocalStorage.getItem.mockReturnValue(fcmToken);
      mockRevokeDeviceByToken.mockResolvedValue();
      mockDeleteFcmToken.mockRejectedValue(new Error("Firebase error"));
      mockHttpPost.mockResolvedValue({ data: { code: 0 } });

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(cacheKey);
      expect(mockDeleteFcmToken).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith("[Logout] Failed to delete FCM token:", expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(mockAuthStore.clear).toHaveBeenCalled();
    });

    it("should handle logout request failure gracefully", async () => {
      // Arrange
      const fcmToken = "fcm-token-123";
      const cacheKey = `fcm_token_${mockUser.id}`;
      
      mockLocalStorage.getItem.mockReturnValue(fcmToken);
      mockRevokeDeviceByToken.mockResolvedValue();
      mockDeleteFcmToken.mockResolvedValue(true);
      mockHttpPost.mockRejectedValue(new Error("Server error"));

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(cacheKey);
      expect(mockConsole.warn).toHaveBeenCalledWith("[Logout] Logout request failed:", expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(mockAuthStore.clear).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith("[Logout] Local state cleared");
    });

    it("should always clear local state even if all operations fail", async () => {
      // Arrange
      const fcmToken = "fcm-token-123";
      const cacheKey = `fcm_token_${mockUser.id}`;
      
      mockLocalStorage.getItem.mockReturnValue(fcmToken);
      mockRevokeDeviceByToken.mockRejectedValue(new Error("Network error"));
      mockDeleteFcmToken.mockRejectedValue(new Error("Firebase error"));
      mockHttpPost.mockRejectedValue(new Error("Server error"));

      // Act
      await logout();

      // Assert
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
      expect(mockAuthStore.clear).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith("[Logout] Local state cleared");
    });
  });

  describe("refresh", () => {
    it("should refresh successfully and update auth state", async () => {
      // Arrange
      const mockResponse = {
        data: { data: { user: mockUser } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);

      // Act
      const result = await refresh();

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.setAuth).toHaveBeenCalledWith({ user: mockUser });
      expect(result).toBe(true);
    });

    it("should refresh successfully without user data", async () => {
      // Arrange
      const mockResponse = {
        data: { data: {} },
      };

      mockHttpPost.mockResolvedValue(mockResponse);

      // Act
      const result = await refresh();

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should refresh successfully with null data", async () => {
      // Arrange
      const mockResponse = {
        data: null,
      };

      mockHttpPost.mockResolvedValue(mockResponse);

      // Act
      const result = await refresh();

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle refresh failure and clear auth state", async () => {
      // Arrange
      const error = new Error("Token expired");
      mockHttpPost.mockRejectedValue(error);

      // Act
      const result = await refresh();

      // Assert
      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.clear).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should return existing refresh promise if already refreshing", async () => {
      // Arrange
      const mockResponse = {
        data: { data: { user: mockUser } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);

      // Act - Call refresh twice simultaneously
      const promise1 = refresh();
      const promise2 = refresh();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert
      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(promise1).toBe(promise2); // Same promise instance
    });

    it("should allow new refresh after previous one completes", async () => {
      // Arrange
      const mockResponse = {
        data: { data: { user: mockUser } },
      };

      mockHttpPost.mockResolvedValue(mockResponse);

      // Act - Call refresh sequentially
      const result1 = await refresh();
      const result2 = await refresh();

      // Assert
      expect(mockHttpPost).toHaveBeenCalledTimes(2);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("should reset refreshing state after failure", async () => {
      // Arrange
      const error = new Error("Network error");
      mockHttpPost
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: { data: { user: mockUser } } });

      // Act - First refresh fails, second should work
      const result1 = await refresh();
      const result2 = await refresh();

      // Assert
      expect(mockHttpPost).toHaveBeenCalledTimes(2);
      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });
  });
});
