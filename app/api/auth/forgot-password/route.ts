import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a reset link has been generated.",
      });
    }

    // Generate random 32-byte hex token valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiresAt: expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    console.log("-----------------------------------------");
    console.log(`PASSWORD RESET URL for ${user.email}:`);
    console.log(resetUrl);
    console.log("-----------------------------------------");

    return NextResponse.json({
      message: "If an account exists, a reset link has been generated.",
      devResetUrl: resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}