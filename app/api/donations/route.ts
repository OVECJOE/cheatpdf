import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/lib/services/donation";
import { createDonationSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = await createDonationSchema.parseAsync(body);
    const checkoutSession = await donationService.createDonationCheckout(validatedData);
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating donation:", error);
    
    let errorMessage = "Failed to create donation";
    let statusCode = 500;
    
    if (error instanceof ZodError) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}