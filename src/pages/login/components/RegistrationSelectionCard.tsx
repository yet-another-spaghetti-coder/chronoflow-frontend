import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { UserPlus, Users } from "lucide-react";

type RegistrationSelectionCardProps = {
  onBack: () => void;
  onOrganizerRegistration: () => void;
  onMemberRegistration: () => void;
};

export function RegistrationSelectionCard({
  onBack,
  onOrganizerRegistration,
  onMemberRegistration,
}: RegistrationSelectionCardProps) {
  return (
    <Card className="w-full max-w-2xl rounded-2xl border border-black/5 bg-background/85 shadow-xl backdrop-blur-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Choose how you want to register for ChronoFlow.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Stacks on small screens, 2 columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="button"
            onClick={onOrganizerRegistration}
            className="h-14 w-full justify-center gap-2 text-base"
            aria-label="Register as Organizer"
          >
            <UserPlus className="h-5 w-5" />
            Register as Organizer
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onMemberRegistration}
            className="h-14 w-full justify-center gap-2 text-base"
            aria-label="Register as Member"
          >
            <Users className="h-5 w-5" />
            Register as Member
          </Button>
        </div>
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
