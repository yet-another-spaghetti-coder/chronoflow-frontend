import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
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
import { forgotPassword } from "@/api/authApi";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const bg = `${import.meta.env.BASE_URL}images/chrono_flow_login_bg.png`;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "We couldn't process your request. Please try again.";
      await Swal.fire({
        icon: "error",
        title: "Request failed",
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
                {submitted ? "Check your email" : "Forgot password"}
              </CardTitle>
              <CardDescription>
                {submitted
                  ? "If an account exists for that email, a reset link has been sent. The link is valid for 30 minutes."
                  : "Enter the email address linked to your account and we'll send you a reset link."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {submitted ? (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    Didn't receive an email? Check your spam folder, then try
                    again with the exact email on your account.
                  </p>
                  <Button
                    type="button"
                    className="h-11 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Back to login
                  </Button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={onSubmit} noValidate>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        aria-invalid={!!errors.email}
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending…" : "Send reset link"}
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
