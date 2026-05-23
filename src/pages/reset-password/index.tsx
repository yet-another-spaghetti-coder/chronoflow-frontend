import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/api/authApi";
import { strongPasswordSchema } from "@/lib/validation/passwordPolicy";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const bg = `${import.meta.env.BASE_URL}images/chrono_flow_login_bg.png`;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onChange",
  });

  const watchedPassword = watch("newPassword") ?? "";

  const tokenMissing = !token;

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "The reset link is invalid or has expired. Please request a new one.";
      await Swal.fire({
        icon: "error",
        title: "Reset failed",
        text: msg,
        confirmButtonText: "OK",
      });
    }
  });

  return (
    <div className="relative grid min-h-svh overflow-hidden bg-background lg:grid-cols-[60%_40%]">
      <div
        className="absolute inset-0 bg-cover bg-center lg:hidden"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-white/70 dark:bg-background/80 lg:hidden"
        aria-hidden
      />

      <div className="relative hidden overflow-hidden lg:block -mr-px isolate">
        <img
          src={bg}
          alt="People coordinating an event"
          className="absolute inset-0 h-full w-full object-cover [transform:translateZ(0)]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl border border-black/5 bg-background/85 shadow-xl backdrop-blur-md">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">
                {success ? "Password updated" : "Reset password"}
              </CardTitle>
              <CardDescription>
                {success
                  ? "Your password has been updated. You can now sign in with the new password."
                  : tokenMissing
                  ? "This page requires a valid reset link from your email."
                  : "Choose a new password for your account. The link can only be used once."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {success ? (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    Sign in with your <strong>username</strong> — not the email
                    you used for the reset.
                  </p>
                  <Button
                    type="button"
                    className="h-11 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Go to login
                  </Button>
                </div>
              ) : tokenMissing ? (
                <Button
                  type="button"
                  className="h-11 w-full"
                  onClick={() => navigate("/forgot-password")}
                >
                  Request a reset link
                </Button>
              ) : (
                <form className="space-y-5" onSubmit={onSubmit} noValidate>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 12 characters with mixed case, digit, and symbol"
                        className="pl-9 pr-10"
                        aria-invalid={!!errors.newPassword}
                        {...register("newPassword")}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPwd ? "Hide password" : "Show password"
                        }
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
                    <PasswordStrengthMeter password={watchedPassword} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        className="pl-9"
                        aria-invalid={!!errors.confirmPassword}
                        {...register("confirmPassword")}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating…" : "Update password"}
                  </Button>
                </form>
              )}
            </CardContent>

            <CardFooter className="justify-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
