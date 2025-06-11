import { z } from "zod";

export const createDonationSchema = z.object({
    donorEmail: z.string().email("Invalid email address"),
    donorName: z.string().min(1, "Donor name is required"),
    targetCountry: z.string().optional(),
    targetLanguage: z.string().optional(),
    studentsToHelp: z.number().int().min(1, "At least one student must be selected"),
    donationFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL']).default('MONTHLY'),
    amount: z.number().min(3, "Minimum donation amount is $3").max(1000, "Maximum donation amount is $1000"),
}).strict()