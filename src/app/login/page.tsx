"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken, setToken, setUser } from "@/lib/auth";

export default function LoginPage() {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = searchParams.get("redirect") || "/";

  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<"identifier" | "otp">("identifier");

  const [otpArray, setOtpArray] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const [notice, setNotice] = useState("");

  const isEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  
  const isPhone = (value: string) =>
    /^[6-9]\d{9}$/.test(value);

  /* =========================
     CHECK TOKEN VALIDITY
  ========================= */
  useEffect(() => {
    const token = getToken();

    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = payload.exp * 1000 < Date.now();

      if (expired) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      router.replace(redirectPath);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [router, redirectPath]);

  /* =========================
     SESSION EXPIRED NOTICE
  ========================= */
  useEffect(() => {
    const msg = sessionStorage.getItem("sessionExpired");

    if (msg) {
      setNotice(msg);
      sessionStorage.removeItem("sessionExpired");
    }
  }, []);

  /* =========================
     TIMER
  ========================= */
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* =========================
     SEND OTP
  ========================= */
  const sendOTP = async () => {
    if (
      !isEmail(identifier) &&
      !isPhone(identifier)
    ) {
      alert("Enter a valid email or mobile number");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to send OTP");
        return;
      }

      setStep("otp");
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      console.error(error);
      alert("Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     OTP INPUT
  ========================= */
  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otpArray];
    updated[index] = value;
    setOtpArray(updated);

    if (value && index < 5) {
      const next = document.getElementById(
        `otp-${index + 1}`
      ) as HTMLInputElement | null;

      next?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      const prev = document.getElementById(
        `otp-${index - 1}`
      ) as HTMLInputElement | null;

      prev?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLDivElement>
  ) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const filled = pasted.split("");

    while (filled.length < 6) filled.push("");

    setOtpArray(filled);

    const lastIndex = Math.min(pasted.length - 1, 5);

    const last = document.getElementById(
      `otp-${lastIndex}`
    ) as HTMLInputElement | null;

    last?.focus();
  };

  /* =========================
     VERIFY OTP
  ========================= */
  const verifyOTP = async () => {
    const finalOtp = otpArray.join("");

    if (finalOtp.length !== 6) {
      alert("Enter valid 6 digit OTP");
      return;
    }

    try {
      setVerifying(true);

      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          otp: finalOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "OTP verification failed");
        return;
      }

      if (!data.token) {
        alert("Invalid token from server");
        return;
      }

      setToken(data.token);

      setUser({
        email:
          data.user?.email ||
          (isEmail(identifier)
            ? identifier
            : ""),
        name:
          data.user?.name ||
          (isEmail(identifier)
            ? identifier.split("@")[0]
            : identifier),
      });

      router.replace(redirectPath);
      //router.refresh();
    } catch (error) {
      console.error(error);
      alert("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">

        {/* HEADER */}
        <div className="text-center mb-6">
          <p className="text-blue-400 text-sm">
            Welcome to Jetly
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Login / Signup
          </h1>

          <p className="text-white/60 text-sm mt-2">
            Secure OTP verification
          </p>

          {notice && (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-xl px-4 py-2">
              {notice}
            </div>
          )}
        </div>

        {/* EMAIL STEP */}
        {step === "identifier" && (
          <div className="space-y-4">
            <input
  type="text"
  placeholder="Enter Email or Mobile Number"
  value={identifier}
  onChange={(e) => setIdentifier(e.target.value)}
  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
/>
              

            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>
          </div>
        )}

        {/* OTP STEP */}
        {step === "otp" && (
          <div className="space-y-5">

<p className="text-center text-sm text-white/70">
  OTP sent to{" "}
  <span className="text-white font-medium">
    {identifier}
  </span>
</p>

            <div
              className="flex justify-between gap-2"
              onPaste={handlePaste}
            >
              {otpArray.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(
                      e.target.value,
                      index
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, index)
                  }
                  className="w-11 h-12 sm:w-12 sm:h-12 text-center rounded-xl bg-slate-800 border border-white/10 text-white text-lg font-semibold outline-none focus:border-blue-500"
                />
              ))}
            </div>

            <button
              onClick={verifyOTP}
              disabled={verifying}
              className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
            >
              {verifying
                ? "Verifying..."
                : "Verify OTP"}
            </button>

            <div className="text-center text-sm">
              {canResend ? (
                <button
                  onClick={sendOTP}
                  className="text-blue-400 hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-white/50">
                  Resend OTP in{" "}
                  <span className="text-white">
                    {timer}s
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setStep("identifier");
                setOtpArray([
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                ]);
              }}
              className="w-full border border-white/10 py-3 rounded-xl text-white/70 hover:bg-white/5"
            >
              Change Email / Mobile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}