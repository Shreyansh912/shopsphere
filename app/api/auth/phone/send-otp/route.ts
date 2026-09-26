import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid 10-digit phone number is required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Upsert user by phone
    await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {
        otp: generatedOtp,
        otpExpiresAt: expiresAt,
      },
      create: {
        phone: cleanPhone,
        otp: generatedOtp,
        otpExpiresAt: expiresAt,
        role: "customer",
      },
    });

    // In production: dispatch SMS gateway API call (Twilio / AWS SNS / Fast2SMS)
    console.log(`\n========================================`);
    console.log(`[AUTH OTP] Phone: +91 ${cleanPhone} | OTP Code: ${generatedOtp}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      // Include for easy local testing
      demoOtp: process.env.NODE_ENV === "development" ? generatedOtp : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to dispatch OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}