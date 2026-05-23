import { z } from "zod";

/**
 * Frontend mirror of the backend's SR-A-07 password policy.
 *
 * Keep the rules here in sync with `@StrongPassword` on the backend and with
 * `common/src/main/resources/security/common-passwords.txt`. The backend remains the source of
 * truth — this only gives the user immediate feedback before submit.
 */

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/**
 * Tiny client-side subset of the common-passwords list. The backend rejects against a much larger
 * list; this exists only so the strength meter can flag the obvious cases immediately.
 */
const COMMON_PASSWORDS_CLIENT_SAMPLE: ReadonlySet<string> = new Set(
  [
    "password", "password1", "password123", "passw0rd", "p@ssw0rd",
    "123456", "123456789", "12345678", "1234567", "12345",
    "qwerty", "qwerty123", "qwertyuiop", "1q2w3e4r",
    "abc123", "abcd1234", "admin", "admin123", "administrator",
    "welcome", "welcome1", "welcome123", "letmein",
    "iloveyou", "monkey", "dragon", "master", "shadow",
    "superman", "batman", "football", "trustno1",
    "0000", "00000000", "1111", "11111111", "121212", "123123", "654321",
    "chronoflow", "chronoflow123", "nus", "nusiss", "singapore",
    "test", "test123", "test1234", "guest", "demo", "changeme",
  ].map((s) => s.toLowerCase())
);

export type PasswordRule = {
  key: string;
  label: string;
  test: (pw: string) => boolean;
};

export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  {
    key: "length",
    label: `At least ${PASSWORD_MIN} characters`,
    test: (pw) => pw.length >= PASSWORD_MIN,
  },
  { key: "upper", label: "One upper-case letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lower", label: "One lower-case letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "digit", label: "One digit", test: (pw) => /\d/.test(pw) },
  {
    key: "symbol",
    label: "One symbol (e.g. ! @ # $ %)",
    test: (pw) => /[^A-Za-z0-9\s]/.test(pw),
  },
  {
    key: "notCommon",
    label: "Not a commonly breached password",
    test: (pw) => pw.length > 0 && !COMMON_PASSWORDS_CLIENT_SAMPLE.has(pw.toLowerCase()),
  },
];

/**
 * Zod schema enforcing the full SR-A-07 policy. Cross-field rules (must-not-equal username/email)
 * are layered on with `.superRefine` at the form level, since they need extra context.
 */
export const strongPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`)
  .superRefine((pw, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(pw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: rule.label,
        });
      }
    }
  });

/**
 * Score 0–4 for the strength meter. 0 = empty/very weak, 4 = passes every client-side rule.
 */
export function passwordStrengthScore(pw: string): number {
  if (!pw) return 0;
  const passed = PASSWORD_RULES.filter((r) => r.test(pw)).length;
  // Map 0..6 → 0..4 for a 5-segment meter (empty + 4 strength tiers).
  if (passed <= 2) return 1;
  if (passed <= 3) return 2;
  if (passed <= 4) return 3;
  if (passed <= 5) return 4;
  return 4;
}
