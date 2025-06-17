import { UserType } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  country: z.string().toLowerCase(),
  language: z.string().toUpperCase().optional().default("EN"),
});

export const onboardingSchema = z.object({
    userType: z.enum([
        UserType.STUDENT
    ]),
    educationLevel: z.string().min(1, "Education level is required"),
    subjects: z.array(z.string()).min(1, "At least one subject is required"),
    studyGoals: z.string().min(1, "Study goals are required"),
    examType: z.string().optional(),
})