import { useAuthStore } from "@/stores/authStore";
import { http } from "@/lib/http";
import type { User, AuthCredentials } from "@/lib/auth-type";
import type { LoginUser } from "@/lib/validation/schema";
import { unwrap } from "@/lib/utils";
import {
  deleteFcmToken,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  signInWithMicrosoft,
  signInWithSAML,
  signInWithOIDC,
  signOutFirebase,
  checkGoogleRedirectResult,
  SSO_PROVIDERS,
} from "@/lib/firebase/firebaseUtils";

export { SSO_PROVIDERS };
import { revokeDeviceByToken } from "./pushNotiApi";

let refreshing: Promise<boolean> | null = null;

function setAuthFromServer(payload: AuthCredentials) {
  const s = useAuthStore.getState();
  const credentials: AuthCredentials = {
    user: (payload.user ?? s.user) as User,
  };
  s.setAuth(credentials);
}

export async function login(credentials: LoginUser): Promise<AuthCredentials> {
  const res = await http.post("/users/auth/login", credentials);
  console.log("[authApi] Login response:", res.data);
  const data = unwrap<AuthCredentials>(res.data);
  console.log("[authApi] Unwrapped data:", data);
  console.log("[authApi] mfaRequired:", data.mfaRequired, "mfaToken:", data.mfaToken);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Sign in with Google using Firebase Authentication.
 * Uses popup flow (preferred) or redirect as fallback.
 * Returns AuthCredentials on success, or throws if redirecting.
 */
export async function loginWithGoogle(
  remember = true
): Promise<AuthCredentials> {
  // Try popup first, falls back to redirect if blocked
  const result = await signInWithGoogle();

  // If we got here, popup was successful - send to backend
  console.log("[authApi] Got Firebase user from popup, sending to backend...");

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    console.log("[authApi] Setting auth from server, user:", data.user);
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Register a new user with Google using Firebase Authentication.
 * Uses popup flow (preferred) or redirect as fallback.
 * Returns AuthCredentials on success, or throws if redirecting.
 */
export async function registerWithGoogle(
  _name: string,
  _organizationName?: string
): Promise<AuthCredentials> {
  // Try popup first, falls back to redirect if blocked
  const result = await signInWithGoogle();

  // If we got here, popup was successful - send to backend
  // Backend will auto-register the user if not exists
  console.log("[authApi] Got Firebase user from popup for registration...");

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember: true },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    console.log("[authApi] Setting auth from server, user:", data.user);
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Sign in with Facebook using Firebase Authentication.
 * Uses popup flow (preferred) or redirect as fallback.
 */
export async function loginWithFacebook(
  remember = true
): Promise<AuthCredentials> {
  const result = await signInWithFacebook();

  console.log("[authApi] Got Firebase user from Facebook, sending to backend...");

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Sign in with Apple using Firebase Authentication.
 * Uses popup flow (preferred) or redirect as fallback.
 */
export async function loginWithApple(
  remember = true
): Promise<AuthCredentials> {
  const result = await signInWithApple();

  console.log("[authApi] Got Firebase user from Apple, sending to backend...");

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Sign in with Microsoft (Entra ID / Azure AD) using Firebase Authentication.
 * Uses popup flow (preferred) or redirect as fallback.
 */
export async function loginWithMicrosoft(
  remember = true
): Promise<AuthCredentials> {
  const result = await signInWithMicrosoft();

  console.log("[authApi] Got Firebase user from Microsoft, sending to backend...");

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Sign in with Enterprise SSO (SAML provider).
 * @param providerId - The SAML provider ID configured in Firebase (e.g., "saml.okta")
 */
export async function loginWithSAML(
  providerId: string,
  remember = true
): Promise<AuthCredentials> {
  const result = await signInWithSAML(providerId);

  console.log(`[authApi] Got Firebase user from SAML (${providerId}), sending to backend...`);

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Sign in with Enterprise SSO (OIDC provider).
 * @param providerId - The OIDC provider ID configured in Firebase (e.g., "oidc.okta")
 */
export async function loginWithOIDC(
  providerId: string,
  remember = true
): Promise<AuthCredentials> {
  const result = await signInWithOIDC(providerId);

  console.log(`[authApi] Got Firebase user from OIDC (${providerId}), sending to backend...`);

  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

/**
 * Handle Google redirect result after returning from Google sign-in.
 * Call this on page load to complete the sign-in flow.
 */
export async function handleGoogleRedirectResult(): Promise<AuthCredentials | null> {
  console.log("[authApi] Checking Google redirect result...");
  const result = await checkGoogleRedirectResult();
  console.log("[authApi] Firebase redirect result:", result ? "found" : "null");

  if (!result) {
    return null;
  }

  console.log("[authApi] Got Firebase user, sending to backend...");
  console.log("[authApi] ID Token (first 50 chars):", result.idToken.substring(0, 50));

  // Send ID token to backend
  const remember = localStorage.getItem("cf.remember") === "1";
  const res = await http.post(
    "/users/auth/firebase-login",
    { remember },
    {
      headers: {
        Authorization: `Bearer ${result.idToken}`,
      },
    }
  );

  console.log("[authApi] Backend response:", res.data);

  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    console.log("[authApi] Setting auth from server, user:", data.user);
    setAuthFromServer({ user: data.user });
  }
  return data;
}

// TOTP (Two-Factor Authentication) APIs

export interface TotpSetupResponse {
  qrCodeDataUri: string;
  secret: string;
  totpUri: string;
}

export async function getTotpStatus(): Promise<boolean> {
  const res = await http.get("/users/auth/totp/status");
  return unwrap<boolean>(res.data);
}

export async function setupTotp(): Promise<TotpSetupResponse> {
  const res = await http.post("/users/auth/totp/setup");
  return unwrap<TotpSetupResponse>(res.data);
}

export async function enableTotp(secret: string, code: string): Promise<boolean> {
  const res = await http.post("/users/auth/totp/enable", { secret, code });
  return unwrap<boolean>(res.data);
}

export async function disableTotp(code: string): Promise<boolean> {
  const res = await http.delete("/users/auth/totp", { data: { code } });
  return unwrap<boolean>(res.data);
}

export async function verifyTotpAndLogin(mfaToken: string, code: string): Promise<AuthCredentials> {
  const res = await http.post("/users/auth/totp/verify", { mfaToken, code });
  const data = unwrap<AuthCredentials>(res.data);
  if (data.user) {
    setAuthFromServer({ user: data.user });
  }
  return data;
}

export async function logout() {
  const user = useAuthStore.getState().user;
  const cacheKey = user?.id ? `fcm_token_${user.id}` : "fcm_token_unknown";
  const token = localStorage.getItem(cacheKey);

  try {
    // Tell backend to revoke the FCM device (best effort)
    if (token) {
      try {
        await revokeDeviceByToken(token);
        console.log("[Logout] Device revoked on backend");
      } catch (e) {
        console.warn("[Logout] Failed to revoke device:", e);
      }
    }

    // Delete FCM token from Firebase (client side)
    try {
      await deleteFcmToken();
      console.log("[Logout] FCM token deleted locally");
    } catch (e) {
      console.warn("[Logout] Failed to delete FCM token:", e);
    }

    // Sign out from Firebase Auth (if signed in via Google)
    try {
      await signOutFirebase();
      console.log("[Logout] Firebase Auth signed out");
    } catch (e) {
      console.warn("[Logout] Firebase signOut failed:", e);
    }

    // Tell your backend to log out session
    await http.post("/users/system/auth/logout", {});
  } catch (e) {
    console.warn("[Logout] Logout request failed:", e);
  } finally {
    // Clean up local cache + user store regardless
    localStorage.removeItem(cacheKey);
    useAuthStore.getState().clear();
    console.log("[Logout] Local state cleared");
  }
}

export function refresh(): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const r = await http.post("/users/auth/refresh", {});
      const { user } = r.data?.data ?? {};
      if (user) setAuthFromServer({ user });
      return true;
    } catch {
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}
