import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { login, loginWithGoogle, loginWithMicrosoft, handleGoogleRedirectResult, verifyTotpAndLogin } from "@/api/authApi";
import { loginUserSchema, type LoginUser } from "@/lib/validation/schema";
import { useEffect, useState } from "react";

type LoginCardProps = {
  onRegistrationSelection: () => void;
};

export function LoginCard({ onRegistrationSelection }: LoginCardProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [isTotpSubmitting, setIsTotpSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: localStorage.getItem("cf.remember") === "1",
    },
  });

  useEffect(() => {
    const remembered = localStorage.getItem("cf.remember") === "1";
    setValue("remember", remembered, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [setValue]);

  // Check for Google redirect result on mount
  useEffect(() => {
    (async () => {
      try {
        setIsGoogleLoading(true);
        console.log("[Login] Checking for Google redirect result...");
        const result = await handleGoogleRedirectResult();
        console.log("[Login] Redirect result:", result);
        if (result) {
          console.log("[Login] Login successful, navigating to /events");
          navigate("/events");
        } else {
          console.log("[Login] No redirect result found");
        }
      } catch (err) {
        console.error("[Login] Google redirect failed:", err);
        await Swal.fire({
          icon: "error",
          title: "Google Sign-in Failed",
          text: err instanceof Error ? err.message : "Failed to complete Google sign-in",
          confirmButtonText: "OK",
        });
      } finally {
        setIsGoogleLoading(false);
      }
    })();
  }, [navigate]);

  const onSubmit = handleSubmit(async ({ username, password, remember }) => {
    try {
      const result = await login({ username: username.trim(), password, remember });

      // Check if MFA is required
      if (result.mfaRequired && result.mfaToken) {
        setMfaRequired(true);
        setMfaToken(result.mfaToken);
        if (remember) localStorage.setItem("cf.remember", "1");
        else localStorage.removeItem("cf.remember");
        return;
      }

      if (remember) localStorage.setItem("cf.remember", "1");
      else localStorage.removeItem("cf.remember");
      navigate("/events");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";
      await Swal.fire({
        icon: "error",
        title: "Login failed",
        text: msg,
        confirmButtonText: "OK",
      });
    }
  });

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken || totpCode.length !== 6) return;

    setIsTotpSubmitting(true);
    try {
      await verifyTotpAndLogin(mfaToken, totpCode);
      navigate("/events");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid verification code. Please try again.";
      await Swal.fire({
        icon: "error",
        title: "Verification failed",
        text: msg,
        confirmButtonText: "OK",
      });
      setTotpCode("");
    } finally {
      setIsTotpSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setMfaToken(null);
    setTotpCode("");
  };

  const remember = watch("remember");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Save remember preference before potential redirect
      if (remember) localStorage.setItem("cf.remember", "1");
      else localStorage.removeItem("cf.remember");

      await loginWithGoogle(remember);
      navigate("/events");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";

      // Don't show error if redirecting or cancelled
      if (msg.includes("Redirecting")) {
        return;
      }
      if (msg.includes("cancelled")) {
        setIsGoogleLoading(false);
        return;
      }

      await Swal.fire({
        icon: "error",
        title: "Sign-in failed",
        text: msg || "Google sign-in failed. Please try again.",
        confirmButtonText: "OK",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      if (remember) localStorage.setItem("cf.remember", "1");
      else localStorage.removeItem("cf.remember");

      await loginWithMicrosoft(remember);
      navigate("/events");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";

      if (msg.includes("Redirecting")) {
        return;
      }
      if (msg.includes("cancelled")) {
        setIsGoogleLoading(false);
        return;
      }

      await Swal.fire({
        icon: "error",
        title: "Sign-in failed",
        text: msg || "Microsoft sign-in failed. Please try again.",
        confirmButtonText: "OK",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md rounded-2xl border border-black/5 bg-background/85 shadow-xl backdrop-blur-md"
      )}
    >
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-4xl font-bold tracking-tight">
          {mfaRequired ? "Two-Factor Authentication" : "Sign in"}
        </CardTitle>
        <CardDescription>
          {mfaRequired
            ? "Enter the 6-digit code from your authenticator app."
            : "Access your workspace to manage tasks, shifts, and timelines."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {mfaRequired ? (
          <form className="space-y-5" onSubmit={handleTotpSubmit} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="totpCode">Verification Code</Label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="pl-9 text-center text-2xl tracking-widest"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isTotpSubmitting || totpCode.length !== 6}
            >
              {isTotpSubmitting ? "Verifying..." : "Verify"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </form>
        ) : (
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className="pl-9"
                aria-invalid={!!errors.username}
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                className="pl-9 pr-10"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPwd ? "Hide password" : "Show password"}
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => {
                const val = v === true;
                setValue("remember", val, { shouldDirty: true });
              }}
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Login"}
          </Button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              "Signing in…"
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Microsoft Sign-in Button */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={handleMicrosoftSignIn}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              "Signing in…"
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                Continue with Microsoft
              </>
            )}
          </Button>
        </form>
        )}
      </CardContent>

      {!mfaRequired && (
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onRegistrationSelection}
              className="font-medium underline underline-offset-4"
            >
              Register
            </button>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
