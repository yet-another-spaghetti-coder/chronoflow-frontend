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

export const organizerRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  user_name: z
    .string()
    .trim()
    .min(6, "Username must be at least 6 characters")
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
  organisation_name: z.string().trim().min(1, "Organisation name is required"),
  organisation_address: z.string().max(255).optional(),
});

export type OrganizerRegistration = z.infer<typeof organizerRegistrationSchema>;

export const memberLookupSchema = z.object({
  organisation_id: z.string().trim().min(1, "Organisation ID is required"),
  user_id: z.string().trim().min(1, "User ID is required"),
});

export type MemberLookup = z.infer<typeof memberLookupSchema>;

export type MemberPrefill = {
  organisation_name: string;
  email: string;
};

export const memberCompleteRegistrationSchema = z.object({
  user_id: z.string().trim().min(1, "User ID is required"),
  user_name: z
    .string()
    .trim()
    .min(6, "Username must be at least 6 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Only letters, numbers, dot, underscore, hyphen"
    ),
  user_password: z.string().min(8, "Password must be at least 8 characters"),
  user_mobile: z
    .string()
    .trim()
    .min(3, "Mobile is required")
    .regex(/^[0-9+\-\s()]{3,20}$/, "Invalid mobile format"),
});

export type MemberCompleteRegistration = z.infer<
  typeof memberCompleteRegistrationSchema
>;
