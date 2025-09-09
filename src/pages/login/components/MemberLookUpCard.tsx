import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { memberLookupSchema, type MemberLookup } from "@/lib/validation/schema";

type MemberLookupCardProps = {
  onBack: () => void;
  onSearch: (v: MemberLookup) => Promise<void>;
};

export function MemberLookupCard({ onBack, onSearch }: MemberLookupCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<MemberLookup>({
    resolver: zodResolver(memberLookupSchema),
    defaultValues: { event_id: "", member_id: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSearch(values);
    } catch (e: any) {
      setError("member_id", { message: e?.message ?? "Lookup failed" });
    }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Find your invitation</CardTitle>
        <CardDescription>Enter your Event ID and Member ID</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="event_id">Event ID</Label>
            <Input
              id="event_id"
              {...register("event_id")}
              aria-invalid={!!errors.event_id}
            />
            <p className="h-5 text-sm text-destructive">
              {errors.event_id?.message ?? "\u00A0"}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member_id">Member ID</Label>
            <Input
              id="member_id"
              {...register("member_id")}
              aria-invalid={!!errors.member_id}
            />
            <p className="h-5 text-sm text-destructive">
              {errors.member_id?.message ?? "\u00A0"}
            </p>
          </div>
          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting ? "Searching…" : "Search"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm underline underline-offset-4"
        >
          Back to sign in
        </button>
      </CardFooter>
    </Card>
  );
}
