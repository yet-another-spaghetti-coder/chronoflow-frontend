import { z } from "zod";

//Login
//later need to adjust the password length to at least 8 characters
export const loginUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z
    .string()
    .min(3, "Password must be at least 3 characters")
    .max(128, "Password is too long"),
  remember: z.boolean(),
});

export type LoginUser = z.infer<typeof loginUserSchema>;

//Registeration
export const MAX_REGISTRATION_FORM_LENGTH = {
  name: 100,
  username: 100,
  password: 100,
  email: 200,
  mobile: 20,
  eventName: 100,
  eventDesc: 255,
} as const;

const requiredDate = (label: string) =>
  z.custom<Date>(
    (v): v is Date => v instanceof Date && !Number.isNaN(v.getTime()),
    { message: `${label} is required` }
  );

export const organizerRegistrationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    user_name: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Only letters, numbers, dot, underscore, hyphen"
      ),
    user_password: z.string().min(8, "Password must be at least 8 characters"),
    user_email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Invalid email address"),
    user_mobile: z
      .string()
      .trim()
      .min(3, "Mobile is required")
      .regex(/^[0-9+\-\s()]{3,20}$/, "Invalid mobile format"),
    event_name: z.string().trim().min(1, "Event name is required"),
    event_description: z
      .string()
      .max(MAX_REGISTRATION_FORM_LENGTH.eventDesc)
      .optional(),
    event_start_time: requiredDate("Start time"),
    event_end_time: requiredDate("End time"),
  })
  .superRefine((v, ctx) => {
    if (
      v.event_start_time instanceof Date &&
      v.event_end_time instanceof Date &&
      !Number.isNaN(v.event_start_time.getTime()) &&
      !Number.isNaN(v.event_end_time.getTime())
    ) {
      if (v.event_end_time.getTime() <= v.event_start_time.getTime()) {
        ctx.addIssue({
          path: ["event_end_time"],
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
        });
      }
    }
  });

export type OrganizerRegistration = z.infer<typeof organizerRegistrationSchema>;
