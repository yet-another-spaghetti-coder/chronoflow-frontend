import { describe, it, expect } from "vitest";
import { deriveWsUrl } from "../wsClient";

describe("deriveWsUrl", () => {
  describe("https base", () => {
    it("converts https to wss in production", () => {
      expect(deriveWsUrl("https://api.example.com", true)).toBe(
        "wss://api.example.com/ws"
      );
    });

    it("converts https to wss in development", () => {
      expect(deriveWsUrl("https://api.example.com", false)).toBe(
        "wss://api.example.com/ws"
      );
    });

    it("strips trailing slashes before appending /ws", () => {
      expect(deriveWsUrl("https://api.example.com/", true)).toBe(
        "wss://api.example.com/ws"
      );
      expect(deriveWsUrl("https://api.example.com///", true)).toBe(
        "wss://api.example.com/ws"
      );
    });

    it("preserves non-default port and path-less host", () => {
      expect(deriveWsUrl("https://chronoflow-test.up.railway.app", true)).toBe(
        "wss://chronoflow-test.up.railway.app/ws"
      );
    });
  });

  describe("http base", () => {
    it("converts http to ws in development", () => {
      expect(deriveWsUrl("http://localhost:8080", false)).toBe(
        "ws://localhost:8080/ws"
      );
    });

    it("REFUSES http base in production (no plaintext WS)", () => {
      // PLS 03: WSS required in prod. A misconfigured env var must fail loud,
      // not silently downgrade to plaintext.
      expect(() => deriveWsUrl("http://localhost:8080", true)).toThrow(
        /Refusing to open ws:\/\/.*production/
      );
    });

    it("refuses http://api.example.com in production too", () => {
      expect(() => deriveWsUrl("http://api.example.com", true)).toThrow();
    });
  });

  describe("invalid input", () => {
    it("throws when base URL is empty", () => {
      expect(() => deriveWsUrl("", false)).toThrow(/not set/);
      expect(() => deriveWsUrl("", true)).toThrow(/not set/);
    });

    it("throws when scheme is missing", () => {
      expect(() => deriveWsUrl("api.example.com", false)).toThrow(
        /must start with http/
      );
    });

    it("throws for unrelated schemes (ftp, file, ws, wss)", () => {
      // Caller must pass the HTTP base; we don't accept already-converted WS
      // URLs because that would hide an upstream config bug.
      expect(() => deriveWsUrl("ftp://host", false)).toThrow();
      expect(() => deriveWsUrl("file:///etc/passwd", false)).toThrow();
      expect(() => deriveWsUrl("ws://host", false)).toThrow();
      expect(() => deriveWsUrl("wss://host", true)).toThrow();
    });
  });
});
