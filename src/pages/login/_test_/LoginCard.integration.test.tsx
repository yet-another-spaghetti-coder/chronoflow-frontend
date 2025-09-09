import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "@/test/utils";
import { LoginCard } from "../components/LoginCard";

const loginMock = vi.fn();
vi.mock("@/api/authApi", () => ({
  login: (...args: any[]) => loginMock(...args),
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const mod = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...mod,
    useNavigate: () => navigateMock,
  };
});

beforeEach(() => {
  localStorage.clear();
  loginMock.mockReset();
  navigateMock.mockReset();
});

describe("LoginCard — integration", () => {
  it("submits with valid credentials and navigates to /", async () => {
    let resolveLogin!: (v: any) => void;
    const loginPromise = new Promise((res) => {
      resolveLogin = res;
    });

    loginMock.mockImplementationOnce(() => loginPromise);

    renderWithRouter(
      <LoginCard
        onRegistrationSelection={() => {}}
        onForgotPassword={() => {}}
      />
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(
      screen.getByLabelText("Password", { selector: "input" }),
      "pw123456"
    );
    await user.click(screen.getByRole("button", { name: "Login" }));

    const loadingBtn = await screen.findByRole("button", {
      name: /signing in/i,
    });

    expect(loadingBtn).toBeDisabled();

    resolveLogin({
      data: {
        data: {
          user: { id: 1 },
          accessToken: "t",
          accessTokenExpireTime: Date.now() + 3600_000,
        },
      },
    });

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        username: "alice",
        password: "pw123456",
        remember: false,
      });
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("shows server error when login fails", async () => {
    loginMock.mockRejectedValueOnce({
      response: {
        data: { message: "Login failed. Please check your credentials." },
      },
    });

    renderWithRouter(
      <LoginCard
        onRegistrationSelection={() => {}}
        onForgotPassword={() => {}}
      />
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Username"), "bob");
    await user.type(
      screen.getByLabelText("Password", { selector: "input" }),
      "wrongpw"
    );
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText(/Login failed. Please check your credentials./i)
    ).toBeInTheDocument();
  });
});
