import { describe, it, expect } from "vitest";
import { loginUserSchema } from "@/lib/validation/schema";

describe("loginUserSchema", () => {
  it("accepts valid data", () => {
    const data = { username: "alice", password: "pw123456", remember: false };
    const parsed = loginUserSchema.parse(data);
    expect(parsed).toEqual(data);
  });

  it("rejects empty username", () => {
    const r = loginUserSchema.safeParse({
      username: "",
      password: "pw123",
      remember: false,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const usernameIssue = r.error.issues.find(
        (i) => i.path.join(".") === "username"
      );
      expect(usernameIssue?.message).toBe("Username is required");
    }
  });

  it("rejects too short password", () => {
    const r = loginUserSchema.safeParse({
      username: "alice",
      password: "ab",
      remember: false,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const pwdIssue = r.error.issues.find(
        (i) => i.path.join(".") === "password"
      );
      expect(pwdIssue?.message).toBe("Password must be at least 3 characters");
    }
  });

  it("trims username and still validates", () => {
    const res = loginUserSchema.parse({
      username: "  alice  ",
      password: "abc",
      remember: false,
    });
    expect(res.username).toBe("alice");
  });

  it("rejects overly long password", () => {
    const long = "x".repeat(129);
    const r = loginUserSchema.safeParse({
      username: "a",
      password: long,
      remember: false,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const pwdIssue = r.error.issues.find(
        (i) => i.path.join(".") === "password"
      );
      expect(pwdIssue?.message).toBe("Password is too long");
    }
  });
});
