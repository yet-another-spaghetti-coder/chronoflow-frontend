import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Swal from "sweetalert2";
import { registerMember } from "@/api/registrationApi";
import {
  memberCompleteRegistrationSchema,
  type MemberCompleteRegistration,
} from "@/lib/validation/schema";

type Prefill = {
  event_id: string;
  member_id: string;
  eventName: string;
  email: string;
  role: string;
};

type MemberRegistrationCardProps = {
  onBack: () => void;
  fromInviteLink?: boolean;
  prefill: Prefill;
};

const toDefaults = (p: Prefill): DefaultValues<MemberCompleteRegistration> => ({
  event_id: p.event_id,
  member_id: p.member_id,
  user_name: "",
  user_password: "",
  user_mobile: "",
});

export function MemberRegistrationCard({
  onBack,
  prefill,
  fromInviteLink,
}: MemberRegistrationCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<MemberCompleteRegistration>({
    resolver: zodResolver(memberCompleteRegistrationSchema),
    defaultValues: toDefaults(prefill),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMember(values);
      await Swal.fire({
        icon: "success",
        title: "Registration complete",
        text: "Your member account has been created.",
        confirmButtonText: "OK",
      });
      reset(toDefaults(prefill));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Registration failed. Please try again.";
      setError("root", { message: msg });
      await Swal.fire({
        icon: "error",
        title: "Registration failed",
        text: msg,
        confirmButtonText: "OK",
      });
    }
  });

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Member Registration</CardTitle>
        <div className="mt-1 flex items-center justify-between">
          <CardDescription className="text-left">
            Review your invite and set your credentials.
          </CardDescription>
          <button
            type="button"
            onClick={onBack}
            className="text-sm underline underline-offset-4"
          >
            {fromInviteLink ? "Go to sign in" : "Back to sign in"}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {/* Read-only invite info */}
          <div className="grid gap-2 md:col-span-1">
            <Label>Event</Label>
            <Input
              value={prefill.eventName}
              readOnly
              className="h-10 bg-muted cursor-default"
            />
            <p className="h-5 text-sm leading-5">&nbsp;</p>
          </div>

          <div className="grid gap-2 md:col-span-1">
            <Label>Email</Label>
            <Input
              value={prefill.email}
              readOnly
              className="h-10 bg-muted cursor-default"
            />
            <p className="h-5 text-sm leading-5">&nbsp;</p>
          </div>

          <div className="grid gap-2 md:col-span-1">
            <Label>Role</Label>
            <Input
              value={prefill.role}
              readOnly
              className="h-10 bg-muted cursor-default"
            />
            <p className="h-5 text-sm leading-5">&nbsp;</p>
          </div>

          {/* Hidden IDs for submission */}
          <input type="hidden" {...register("event_id")} />
          <input type="hidden" {...register("member_id")} />

          {/* Username */}
          <div className="grid gap-2 md:col-span-1">
            <Label htmlFor="user_name">Username</Label>
            <Input
              id="user_name"
              className="h-10"
              {...register("user_name")}
              aria-invalid={!!errors.user_name}
            />
            <p className="h-5 text-sm leading-5 text-destructive">
              {errors.user_name?.message ?? "\u00A0"}
            </p>
          </div>

          {/* Mobile */}
          <div className="grid gap-2 md:col-span-1">
            <Label htmlFor="user_mobile">Mobile</Label>
            <Input
              id="user_mobile"
              className="h-10"
              {...register("user_mobile")}
              aria-invalid={!!errors.user_mobile}
            />
            <p className="h-5 text-sm leading-5 text-destructive">
              {errors.user_mobile?.message ?? "\u00A0"}
            </p>
          </div>

          {/* Password */}
          <div className="grid gap-2 md:col-span-1">
            <Label htmlFor="user_password">Password</Label>
            <Input
              id="user_password"
              type="password"
              autoComplete="new-password"
              className="h-10"
              {...register("user_password")}
              aria-invalid={!!errors.user_password}
            />
            <p className="h-5 text-sm leading-5 text-destructive">
              {errors.user_password?.message ?? "\u00A0"}
            </p>
          </div>

          {/* Empty cell to keep grid balanced on md+ */}
          <div className="md:col-span-1" />

          {/* Submit */}
          <div className="md:col-span-2 flex justify-center">
            <Button
              type="submit"
              className="h-11 w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create member account"}
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter />
    </Card>
  );
}
