import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
  deleteToken,
} from "firebase/messaging";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  SAMLAuthProvider,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence,
  type Auth,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let messagingPromise: Promise<Messaging | null>;
let authInitialized = false;
let redirectCheckInProgress: Promise<{ user: FirebaseUser; idToken: string } | null> | null = null;

export async function initFirebase(): Promise<void> {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Set persistence to local storage to survive page redirects
    await setPersistence(auth, browserLocalPersistence);
    authInitialized = true;
    messagingPromise = isSupported().then((ok) =>
      ok ? getMessaging(app!) : null
    );
  }
}

/** Get Firebase Auth instance */
export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    await initFirebase();
  }
  return auth!;
}

/** Sign in with Google using popup (preferred) or redirect flow as fallback */
export async function signInWithGoogle(): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const firebaseAuth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  // Force account selection every time
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    // Try popup first (works with relaxed COOP headers)
    console.log("[Firebase] Attempting popup sign-in...");
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    console.log("[Firebase] Popup sign-in successful");
    return {
      user: result.user,
      idToken,
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.log("[Firebase] Popup failed:", firebaseError.code, firebaseError.message);

    // User closed popup - just cancel silently
    if (firebaseError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled");
    }

    // If popup was blocked or COOP issue, fall back to redirect
    if (
      firebaseError.code === "auth/popup-blocked" ||
      firebaseError.message?.includes("Cross-Origin-Opener-Policy")
    ) {
      console.log("[Firebase] Falling back to redirect flow...");
      sessionStorage.setItem("firebase_redirect_pending", "1");
      await signInWithRedirect(firebaseAuth, provider);
      throw new Error("Redirecting to Google sign-in...");
    }

    // Re-throw other errors
    throw error;
  }
}

/** Sign in with Facebook using popup (preferred) or redirect flow as fallback */
export async function signInWithFacebook(): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const firebaseAuth = await getFirebaseAuth();
  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  provider.addScope("public_profile");

  try {
    console.log("[Firebase] Attempting Facebook popup sign-in...");
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    console.log("[Firebase] Facebook popup sign-in successful");
    return {
      user: result.user,
      idToken,
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.log("[Firebase] Facebook popup failed:", firebaseError.code, firebaseError.message);

    if (firebaseError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled");
    }

    if (
      firebaseError.code === "auth/popup-blocked" ||
      firebaseError.message?.includes("Cross-Origin-Opener-Policy")
    ) {
      console.log("[Firebase] Falling back to redirect flow...");
      sessionStorage.setItem("firebase_redirect_pending", "1");
      await signInWithRedirect(firebaseAuth, provider);
      throw new Error("Redirecting to Facebook sign-in...");
    }

    throw error;
  }
}

/** Sign in with Apple using popup (preferred) or redirect flow as fallback */
export async function signInWithApple(): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const firebaseAuth = await getFirebaseAuth();
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");

  try {
    console.log("[Firebase] Attempting Apple popup sign-in...");
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    console.log("[Firebase] Apple popup sign-in successful");
    return {
      user: result.user,
      idToken,
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.log("[Firebase] Apple popup failed:", firebaseError.code, firebaseError.message);

    if (firebaseError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled");
    }

    if (
      firebaseError.code === "auth/popup-blocked" ||
      firebaseError.message?.includes("Cross-Origin-Opener-Policy")
    ) {
      console.log("[Firebase] Falling back to redirect flow...");
      sessionStorage.setItem("firebase_redirect_pending", "1");
      await signInWithRedirect(firebaseAuth, provider);
      throw new Error("Redirecting to Apple sign-in...");
    }

    throw error;
  }
}

/** Sign in with Microsoft (Entra ID / Azure AD) using popup (preferred) or redirect flow as fallback */
export async function signInWithMicrosoft(): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const firebaseAuth = await getFirebaseAuth();
  const provider = new OAuthProvider("microsoft.com");
  // Request email and profile scopes
  provider.addScope("email");
  provider.addScope("profile");
  // Force account selection every time
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    console.log("[Firebase] Attempting Microsoft popup sign-in...");
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    console.log("[Firebase] Microsoft popup sign-in successful");
    return {
      user: result.user,
      idToken,
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.log("[Firebase] Microsoft popup failed:", firebaseError.code, firebaseError.message);

    if (firebaseError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled");
    }

    if (
      firebaseError.code === "auth/popup-blocked" ||
      firebaseError.message?.includes("Cross-Origin-Opener-Policy")
    ) {
      console.log("[Firebase] Falling back to redirect flow...");
      sessionStorage.setItem("firebase_redirect_pending", "1");
      await signInWithRedirect(firebaseAuth, provider);
      throw new Error("Redirecting to Microsoft sign-in...");
    }

    throw error;
  }
}

/**
 * Sign in with Enterprise SSO (SAML provider)
 * @param providerId - The SAML provider ID configured in Firebase (e.g., "saml.okta", "saml.azure")
 */
export async function signInWithSAML(providerId: string): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const firebaseAuth = await getFirebaseAuth();
  const provider = new SAMLAuthProvider(providerId);

  try {
    console.log(`[Firebase] Attempting SAML sign-in with ${providerId}...`);
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    console.log("[Firebase] SAML sign-in successful");
    return {
      user: result.user,
      idToken,
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.log("[Firebase] SAML popup failed:", firebaseError.code, firebaseError.message);

    if (firebaseError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled");
    }

    if (
      firebaseError.code === "auth/popup-blocked" ||
      firebaseError.message?.includes("Cross-Origin-Opener-Policy")
    ) {
      console.log("[Firebase] Falling back to redirect flow...");
      sessionStorage.setItem("firebase_redirect_pending", "1");
      sessionStorage.setItem("firebase_sso_provider", providerId);
      await signInWithRedirect(firebaseAuth, provider);
      throw new Error("Redirecting to SSO sign-in...");
    }

    throw error;
  }
}

/**
 * Sign in with Enterprise SSO (OIDC provider)
 * @param providerId - The OIDC provider ID configured in Firebase (e.g., "oidc.okta", "oidc.azure")
 */
export async function signInWithOIDC(providerId: string): Promise<{
  user: FirebaseUser;
  idToken: string;
}> {
  const firebaseAuth = await getFirebaseAuth();
  const provider = new OAuthProvider(providerId);

  try {
    console.log(`[Firebase] Attempting OIDC sign-in with ${providerId}...`);
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    console.log("[Firebase] OIDC sign-in successful");
    return {
      user: result.user,
      idToken,
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.log("[Firebase] OIDC popup failed:", firebaseError.code, firebaseError.message);

    if (firebaseError.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled");
    }

    if (
      firebaseError.code === "auth/popup-blocked" ||
      firebaseError.message?.includes("Cross-Origin-Opener-Policy")
    ) {
      console.log("[Firebase] Falling back to redirect flow...");
      sessionStorage.setItem("firebase_redirect_pending", "1");
      sessionStorage.setItem("firebase_sso_provider", providerId);
      await signInWithRedirect(firebaseAuth, provider);
      throw new Error("Redirecting to SSO sign-in...");
    }

    throw error;
  }
}

/** Get list of configured SSO providers (configure these based on your Firebase setup) */
export const SSO_PROVIDERS = {
  // SAML Providers - add your configured provider IDs here
  OKTA_SAML: "saml.okta",
  AZURE_AD_SAML: "saml.azure-ad",
  ONELOGIN_SAML: "saml.onelogin",

  // OIDC Providers - add your configured provider IDs here
  OKTA_OIDC: "oidc.okta",
  AZURE_AD_OIDC: "oidc.azure-ad",
  AUTH0_OIDC: "oidc.auth0",
} as const;

/** Wait for Firebase Auth to be ready and return the current user */
function waitForAuthReady(auth: Auth): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/** Check for redirect result on page load */
export async function checkGoogleRedirectResult(): Promise<{
  user: FirebaseUser;
  idToken: string;
} | null> {
  // Prevent duplicate calls (React Strict Mode calls useEffect twice)
  if (redirectCheckInProgress) {
    console.log("[Firebase] Redirect check already in progress, returning existing promise");
    return redirectCheckInProgress;
  }

  redirectCheckInProgress = (async () => {
    try {
      const firebaseAuth = await getFirebaseAuth();
      const pendingRedirect = sessionStorage.getItem("firebase_redirect_pending");
      console.log("[Firebase] Checking redirect result... pendingRedirect:", pendingRedirect);

      // If no pending redirect, skip the check
      if (pendingRedirect !== "1") {
        console.log("[Firebase] No pending redirect, skipping");
        return null;
      }

      // First try to get the redirect result
      const result = await getRedirectResult(firebaseAuth);
      console.log("[Firebase] getRedirectResult returned:", result ? "UserCredential" : "null");

      if (result && result.user) {
        console.log("[Firebase] User found from redirect:", result.user.email);
        sessionStorage.removeItem("firebase_redirect_pending");
        const idToken = await result.user.getIdToken();
        console.log("[Firebase] Got ID token");
        return {
          user: result.user,
          idToken,
        };
      }

      // If no redirect result, wait for auth state to be ready
      // This handles cases where the redirect result was already consumed
      console.log("[Firebase] Waiting for auth state...");
      const currentUser = await waitForAuthReady(firebaseAuth);
      console.log("[Firebase] Auth ready, current user:", currentUser?.email || "null");

      if (currentUser) {
        console.log("[Firebase] Found signed-in user after redirect");
        sessionStorage.removeItem("firebase_redirect_pending");
        const idToken = await currentUser.getIdToken();
        return {
          user: currentUser,
          idToken,
        };
      }

      // Clear the flag if we couldn't find a user
      sessionStorage.removeItem("firebase_redirect_pending");
      return null;
    } catch (error) {
      console.error("[Firebase] Redirect result error:", error);
      sessionStorage.removeItem("firebase_redirect_pending");
      return null;
    } finally {
      redirectCheckInProgress = null;
    }
  })();

  return redirectCheckInProgress;
}

/** Get current user's ID token (for refreshing) */
export async function getFirebaseIdToken(): Promise<string | null> {
  const firebaseAuth = await getFirebaseAuth();
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken(true); // Force refresh
}

/** Sign out from Firebase */
export async function signOutFirebase(): Promise<void> {
  const firebaseAuth = await getFirebaseAuth();
  await firebaseSignOut(firebaseAuth);
}

/** Get current Firebase user */
export async function getCurrentFirebaseUser(): Promise<FirebaseUser | null> {
  const firebaseAuth = await getFirebaseAuth();
  return firebaseAuth.currentUser;
}

/** Must be called from a user gesture (click/tap) */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}

/** Ensure the messaging SW exists and is activated, then return it */
async function ensureSw(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker not supported");
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) return existing;

  const reg =
    existing ??
    (await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));

  // If already active, done
  if (reg.active) return reg;

  // Otherwise wait until activated
  await new Promise<void>((resolve, reject) => {
    const sw = reg.installing || reg.waiting;
    if (!sw) return resolve();
    const onChange = () => {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", onChange);
        resolve();
      } else if (sw.state === "redundant") {
        sw.removeEventListener("statechange", onChange);
        reject(new Error("Service worker became redundant"));
      }
    };
    sw.addEventListener("statechange", onChange);
  });

  return reg;
}

export async function getFcmToken(vapidKey: string): Promise<string | null> {
  const messaging = await messagingPromise;
  if (!messaging) {
    console.warn("[FCM] Not supported in this browser/context.");
    return null;
  }
  if (!vapidKey) {
    console.warn("[FCM] Missing VAPID key.");
    return null;
  }
  if (Notification.permission !== "granted") {
    console.warn(
      "[FCM] Notification permission is not granted; skip getToken."
    );
    return null;
  }

  try {
    const swReg = await ensureSw();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });
    return token || null;
  } catch (err) {
    console.error("[FCM] Error while retrieving token:", err);
    return null;
  }
}

export async function listenForMessages(
  callback: (payload: MessagePayload) => void
): Promise<void> {
  const messaging = await messagingPromise;
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export async function isFcmSupported(): Promise<boolean> {
  return isSupported();
}

export async function deleteFcmToken(): Promise<boolean> {
  const messaging = await messagingPromise;
  if (!messaging) return false;
  try {
    const ok = await deleteToken(messaging);
    return ok;
  } catch (e) {
    console.warn("[FCM] deleteToken failed:", e);
    return false;
  }
}
