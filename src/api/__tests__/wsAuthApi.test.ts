import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { http } from "@/lib/http";
import { fetchWsToken } from "../wsAuthApi";

vi.mock("@/lib/http", () => ({
  http: {
    post: vi.fn(),
  },
}));

const mockHttpPost = http.post as MockedFunction<typeof http.post>;

describe("wsAuthApi.fetchWsToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs to /ws/token with no body and returns the token+exp", async () => {
    mockHttpPost.mockResolvedValue({
      data: { token: "abc.def.ghi", exp: 1234567890 },
    });

    const result = await fetchWsToken();

    expect(mockHttpPost).toHaveBeenCalledTimes(1);
    expect(mockHttpPost).toHaveBeenCalledWith("/ws/token");
    expect(result.token).toBe("abc.def.ghi");
    expect(result.exp).toBe(1234567890);
  });

  it("propagates network errors (401 unauthorized, etc.)", async () => {
    mockHttpPost.mockRejectedValue(new Error("Network Error"));

    await expect(fetchWsToken()).rejects.toThrow("Network Error");
  });
});
