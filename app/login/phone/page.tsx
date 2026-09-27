"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PhoneLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code");

      setStep("OTP");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("phone-otp", {
        redirect: false,
        phone,
        otp,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50/50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {step === "PHONE" ? "Login with Phone" : "Verify Phone Number"}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            {step === "PHONE"
              ? "Enter your mobile number to receive a 6-digit OTP code"
              : `Enter the 6-digit code sent to ${phone}`}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {step === "PHONE" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send Verification Code</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3.5 py-2.5 text-center text-xl tracking-widest font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Sign In</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("PHONE");
                setOtp("");
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-800 transition text-center"
            >
              Change phone number
            </button>
          </form>
        )}

        <div className="pt-4 text-center border-t border-gray-100 flex flex-col gap-2">
          <Link
            href="/login"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Email Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}