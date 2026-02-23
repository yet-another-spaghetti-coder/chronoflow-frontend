import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
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

const mockHttpPost = http.post as MockedFunction<typeof http.post>;
const mockUnwrap = unwrap as MockedFunction<typeof unwrap>;
const mockUseAuthStore = useAuthStore as unknown as {
  getState: MockedFunction<() => ReturnType<typeof useAuthStore.getState>>;
};

// Mock console methods (logout logs/warns)
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
};
Object.defineProperty(console, "log", { value: mockConsole.log });
Object.defineProperty(console, "warn", { value: mockConsole.warn });

describe("authApi (MVP, no FCM)", () => {
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
    mockUseAuthStore.getState.mockReturnValue(mockAuthStore as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully and set auth state", async () => {
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

      mockHttpPost.mockResolvedValue(mockResponse as any);
      mockUnwrap.mockReturnValue(expectedAuthCredentials as any);

      const result = await login(credentials);

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/login", credentials);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(mockAuthStore.setAuth).toHaveBeenCalledWith({ user: mockUser });
      expect(result).toEqual(expectedAuthCredentials);
    });

    it("should login successfully without user data in response", async () => {
      const credentials: LoginUser = {
        username: "testuser",
        password: "password123",
        remember: false,
      };

      const mockResponse = {
        data: { code: 0, data: { user: null } },
      };

      mockHttpPost.mockResolvedValue(mockResponse as any);
      mockUnwrap.mockReturnValue({ user: null } as any);

      const result = await login(credentials);

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/login", credentials);
      expect(mockUnwrap).toHaveBeenCalledWith(mockResponse.data);
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
      expect(result).toEqual({ user: null });
    });

    it("should handle login http errors", async () => {
      const credentials: LoginUser = {
        username: "testuser",
        password: "wrongpassword",
        remember: false,
      };

      mockHttpPost.mockRejectedValue(new Error("Invalid credentials"));

      await expect(login(credentials)).rejects.toThrow("Invalid credentials");
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
    });

    it("should handle unwrap errors", async () => {
      const credentials: LoginUser = {
        username: "testuser",
        password: "password123",
        remember: false,
      };

      const mockResponse = {
        data: { code: 1, msg: "Server error" },
      };

      mockHttpPost.mockResolvedValue(mockResponse as any);
      mockUnwrap.mockImplementation(() => {
        throw new Error("Server error");
      });

      await expect(login(credentials)).rejects.toThrow("Server error");
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should logout successfully and always clear local auth state", async () => {
      mockHttpPost.mockResolvedValue({ data: { code: 0 } } as any);

      await logout();

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/logout", {});
      expect(mockAuthStore.clear).toHaveBeenCalled();
    });

    it("should clear local auth state even if logout request fails", async () => {
      mockHttpPost.mockRejectedValue(new Error("Server error"));

      await logout();

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/logout", {});
      expect(mockConsole.warn).toHaveBeenCalledWith("[Logout] Logout request failed:", expect.any(Error));
      expect(mockAuthStore.clear).toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should refresh successfully and update auth state when user exists", async () => {
      mockHttpPost.mockResolvedValue({
        data: { data: { user: mockUser } },
      } as any);

      const result = await refresh();

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.setAuth).toHaveBeenCalledWith({ user: mockUser });
      expect(result).toBe(true);
    });

    it("should refresh successfully and not set auth when no user", async () => {
      mockHttpPost.mockResolvedValue({
        data: { data: {} },
      } as any);

      const result = await refresh();

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should refresh successfully with null response and not set auth", async () => {
      mockHttpPost.mockResolvedValue({ data: null } as any);

      const result = await refresh();

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.setAuth).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should handle refresh failure and clear auth state", async () => {
      mockHttpPost.mockRejectedValue(new Error("Token expired"));

      const result = await refresh();

      expect(mockHttpPost).toHaveBeenCalledWith("/users/auth/refresh", {});
      expect(mockAuthStore.clear).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should return the same promise if refresh is already in progress", async () => {
      mockHttpPost.mockResolvedValue({
        data: { data: { user: mockUser } },
      } as any);

      const promise1 = refresh();
      const promise2 = refresh();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(promise1).toBe(promise2);
    });

    it("should allow a new refresh after previous one completes", async () => {
      mockHttpPost.mockResolvedValue({
        data: { data: { user: mockUser } },
      } as any);

      const result1 = await refresh();
      const result2 = await refresh();

      expect(mockHttpPost).toHaveBeenCalledTimes(2);
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("should reset refreshing state after failure, so next refresh can succeed", async () => {
      mockHttpPost
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ data: { data: { user: mockUser } } } as any);

      const result1 = await refresh();
      const result2 = await refresh();

      expect(mockHttpPost).toHaveBeenCalledTimes(2);
      expect(result1).toBe(false);
      expect(result2).toBe(true);
      expect(mockAuthStore.setAuth).toHaveBeenCalledWith({ user: mockUser });
    });
  });
});