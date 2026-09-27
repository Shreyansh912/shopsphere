import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body as { phone?: string };

    if (!phone || !/^\+?[0-9]{10,14}$/.test(phone.replace(/\s+/g, ""))) {
      return NextResponse.json(
        { error: "Please provide a valid 10 to 14 digit mobile number" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\s+/g, "");

    // 6-digit OTP generation (fixed in development, random in production)
    const otp =
      process.env.NODE_ENV === "development"
        ? "123456"
        : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Remove existing OTP requests for this phone number
    await prisma.otpVerification.deleteMany({
      where: { phone: cleanPhone },
    });

    // Save the new OTP
    await prisma.otpVerification.create({
      data: {
        phone: cleanPhone,
        otp,
        expiresAt,
      },
    });

    console.log(
      `\n==========================================\n[AUTH] Verification OTP for ${cleanPhone}: ${otp}\n==========================================\n`
    );

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    console.error("Error in OTP generation:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}