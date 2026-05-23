import { Check, X } from "lucide-react";
import { PASSWORD_RULES, passwordStrengthScore } from "@/lib/validation/passwordPolicy";

type Props = {
  password: string;
  showChecklist?: boolean;
};

const tierLabels = ["", "Very weak", "Weak", "Good", "Strong"];
const tierColors = [
  "bg-muted",
  "bg-destructive",
  "bg-amber-500",
  "bg-yellow-400",
  "bg-green-600",
];

export function PasswordStrengthMeter({ password, showChecklist = true }: Props) {
  const score = passwordStrengthScore(password);
  const tier = tierLabels[score];
  const segments = [1, 2, 3, 4];

  return (
    <div className="mt-1 space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {segments.map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded ${
                score >= s ? tierColors[score] : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="w-16 text-right text-xs text-muted-foreground">{tier}</span>
      </div>

      {showChecklist && password.length > 0 && (
        <ul className="space-y-1 text-xs">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.key}
                className={`flex items-center gap-1.5 ${
                  ok ? "text-green-700 dark:text-green-500" : "text-muted-foreground"
                }`}
              >
                {ok ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                <span>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
