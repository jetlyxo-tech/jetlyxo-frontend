"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

import {
  getToken,
  setToken,
  setUser,
} from "@/lib/auth";

function SignupPageContent() {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath =
    searchParams.get("redirect") || "/";

  // ==========================================
  // FORM STATE
  // ==========================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [step, setStep] = useState<
    "details" | "otp"
  >("details");

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

  // ==========================================
  // VALIDATION
  // ==========================================

  const isEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    );

  const isPhone = (value: string) =>
    /^[6-9]\d{9}$/.test(
      value.trim()
    );

  // ==========================================
  // NORMALIZE EMAIL
  // ==========================================

  const normalizeEmail = (value: string) =>
    value.trim().toLowerCase();

  // ==========================================
  // NORMALIZE PHONE
  // ==========================================

  const normalizePhone = (value: string) => {
    const clean = value.trim();

    if (clean.startsWith("+91")) {
      return clean;
    }

    if (clean.startsWith("+")) {
      return clean;
    }

    return `+91${clean}`;
  };

  // ==========================================
  // CHECK EXISTING TOKEN
  // ==========================================

  useEffect(() => {
    const token = getToken();

    if (!token) return;

    try {
      const parts = token.split(".");

      if (parts.length !== 3) {
        throw new Error("Invalid token");
      }

      const payload = JSON.parse(
        atob(parts[1])
      );

      const expired =
        payload.exp * 1000 < Date.now();

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

  // ==========================================
  // SESSION EXPIRED NOTICE
  // ==========================================

  useEffect(() => {
    const msg =
      sessionStorage.getItem(
        "sessionExpired"
      );

    if (msg) {
      setNotice(msg);

      sessionStorage.removeItem(
        "sessionExpired"
      );
    }
  }, []);

  // ==========================================
  // OTP TIMER
  // ==========================================

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timer]);

  // ==========================================
  // SEND OTP
  // ==========================================

  const sendOTP = async () => {
    const cleanName = name.trim();
    const cleanEmail =
      normalizeEmail(email);

    const cleanPhone =
      phone.trim();

    // ------------------------------------------
    // Validate name
    // ------------------------------------------

    if (!cleanName) {
      toast.warning(
        "Please enter your full name."
      );
      return;
    }

    if (cleanName.length < 2) {
      toast.warning(
        "Please enter a valid name."
      );
      return;
    }

    // ------------------------------------------
    // Validate email
    // ------------------------------------------

    if (!isEmail(cleanEmail)) {
      toast.warning(
        "Please enter a valid email address."
      );
      return;
    }

    // ------------------------------------------
    // Validate phone
    // ------------------------------------------

    if (!isPhone(cleanPhone)) {
      toast.warning(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/auth/send-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
            "Failed to send OTP."
        );

        return;
      }

      // ------------------------------------------
      // Store normalized values
      // ------------------------------------------

      setName(cleanName);
      setEmail(cleanEmail);
      setPhone(cleanPhone);

      // ------------------------------------------
      // Clear old OTP
      // ------------------------------------------

      setOtpArray([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      // ------------------------------------------
      // Move to OTP step
      // ------------------------------------------

      setStep("otp");

      setTimer(60);
      setCanResend(false);

      toast.success(
        "OTP sent to your email and mobile number."
      );
    } catch (error) {
      console.error(
        "sendOTP error:",
        error
      );

      toast.error(
        "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OTP INPUT
  // ==========================================

  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const updated = [
      ...otpArray,
    ];

    updated[index] = value;

    setOtpArray(updated);

    // Move to next input
    if (
      value &&
      index < otpArray.length - 1
    ) {
      const next =
        document.getElementById(
          `otp-${index + 1}`
        ) as HTMLInputElement | null;

      next?.focus();
    }
  };

  // ==========================================
  // OTP BACKSPACE
  // ==========================================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      event.key === "Backspace" &&
      !otpArray[index] &&
      index > 0
    ) {
      const previous =
        document.getElementById(
          `otp-${index - 1}`
        ) as HTMLInputElement | null;

      previous?.focus();
    }
  };

  // ==========================================
  // OTP PASTE
  // ==========================================

  const handlePaste = (
    event: React.ClipboardEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const pasted =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pasted) {
      return;
    }

    const updated = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    pasted
      .split("")
      .forEach(
        (digit, index) => {
          updated[index] = digit;
        }
      );

    setOtpArray(updated);

    const lastIndex = Math.min(
      pasted.length - 1,
      5
    );

    const lastInput =
      document.getElementById(
        `otp-${lastIndex}`
      ) as HTMLInputElement | null;

    lastInput?.focus();
  };

  // ==========================================
  // VERIFY OTP
  // ==========================================

  const verifyOTP = async () => {
    const finalOtp =
      otpArray.join("");

    if (finalOtp.length !== 6) {
      toast.warning(
        "Please enter the 6-digit OTP."
      );

      return;
    }

    try {
      setVerifying(true);

      const response = await fetch(
        `${API_BASE}/auth/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            phone,
            otp: finalOtp,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
            "OTP verification failed."
        );

        return;
      }

      // ------------------------------------------
      // Validate token
      // ------------------------------------------

      if (!data.token) {
        toast.error(
          "Invalid token received from server."
        );

        return;
      }

      // ------------------------------------------
      // Validate returned user
      // ------------------------------------------

      if (!data.user) {
        toast.error(
          "User information was not returned."
        );

        return;
      }

      // ------------------------------------------
      // Backend is the source of truth
      // ------------------------------------------

      const returnedUser =
        data.user;

      const finalName =
        returnedUser.name ||
        name;

      // ------------------------------------------
      // Save token
      // ------------------------------------------

      setToken(data.token);

      // ------------------------------------------
      // Save complete user
      // ------------------------------------------

      setUser({
        id: returnedUser.id,

        name: finalName,

        email:
          returnedUser.email ||
          email,

        phone:
          returnedUser.phone ||
          normalizePhone(phone),
      });

      // ------------------------------------------
      // Success
      // ------------------------------------------

      toast.success(
        `Welcome, ${finalName}!`
      );

      // ------------------------------------------
      // Redirect
      // ------------------------------------------

      router.replace(
        redirectPath
      );
    } catch (error) {
      console.error(
        "verifyOTP error:",
        error
      );

      toast.error(
        "Verification failed."
      );
    } finally {
      setVerifying(false);
    }
  };

  // ==========================================
  // CHANGE DETAILS
  // ==========================================

  const changeDetails = () => {
    setStep("details");

    setOtpArray([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setTimer(0);
    setCanResend(true);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="text-center mb-7">

          <p className="text-blue-400 text-sm">
            Welcome to JetlyXO
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Create Account
          </h1>

          <p className="text-white/60 text-sm mt-2">
            Register with your name, email and mobile number
          </p>

          {notice && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-xl px-4 py-3">
              {notice}
            </div>
          )}

        </div>

        {/* =====================================
            DETAILS STEP
        ====================================== */}

        {step === "details" && (
          <div className="space-y-5">

            {/* FULL NAME */}

            <div>

              <label
                htmlFor="full-name"
                className="block text-sm text-white/70 mb-2"
              >
                Full Name
              </label>

              <input
                id="full-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                autoComplete="name"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm text-white/70 mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                inputMode="email"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

            </div>

            {/* MOBILE */}

            <div>

              <label
                htmlFor="phone"
                className="block text-sm text-white/70 mb-2"
              >
                Mobile Number
              </label>

              <div className="flex">

                <div className="flex items-center justify-center px-4 bg-slate-800 border border-r-0 border-white/10 rounded-l-xl text-white/70 text-sm">
                  +91
                </div>

                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      ).slice(0, 10)
                    )
                  }
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="flex-1 min-w-0 bg-slate-800 border border-white/10 rounded-r-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* INFO */}

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">

              <p className="text-xs text-blue-300 leading-relaxed">
                We'll send the same 6-digit OTP to
                your email and mobile number.
              </p>

            </div>

            {/* CONTINUE */}

            <button
              type="button"
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Sending OTP..."
                : "Continue"}
            </button>

            {/* LOGIN */}

            <div className="text-center pt-2">

              <p className="text-sm text-white/50">
                Already have an account?
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/login${
                      redirectPath !== "/"
                        ? `?redirect=${encodeURIComponent(
                            redirectPath
                          )}`
                        : ""
                    }`
                  )
                }
                className="text-blue-400 hover:text-blue-300 font-medium text-sm mt-1"
              >
                Login
              </button>

            </div>

          </div>
        )}

        {/* =====================================
            OTP STEP
        ====================================== */}

        {step === "otp" && (
          <div className="space-y-5">

            {/* OTP DESTINATION */}

            <div className="text-center">

              <p className="text-sm text-white/60">
                We sent the same OTP to:
              </p>

              <p className="text-white font-medium mt-2 break-all">
                {email}
              </p>

              <p className="text-white/70 text-sm mt-1">
                +91 {phone}
              </p>

            </div>

            {/* NAME */}

            <div className="text-center">

              <p className="text-sm text-white/50">
                Creating account for
              </p>

              <p className="text-white font-semibold mt-1">
                {name}
              </p>

            </div>

            {/* OTP INPUTS */}

            <div
              className="flex justify-between gap-2"
              onPaste={handlePaste}
            >
              {otpArray.map(
                (digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleOtpChange(
                        event.target.value,
                        index
                      )
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(
                        event,
                        index
                      )
                    }
                    className="w-11 h-12 sm:w-12 sm:h-12 text-center rounded-xl bg-slate-800 border border-white/10 text-white text-lg font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )
              )}
            </div>

            {/* VERIFY */}

            <button
              type="button"
              onClick={verifyOTP}
              disabled={verifying}
              className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying
                ? "Creating Account..."
                : "Verify & Create Account"}
            </button>

            {/* RESEND */}

            <div className="text-center text-sm">

              {canResend ? (
                <button
                  type="button"
                  onClick={sendOTP}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : "Resend OTP"}
                </button>
              ) : (
                <p className="text-white/50">
                  Resend OTP in{" "}
                  <span className="text-white font-medium">
                    {timer}s
                  </span>
                </p>
              )}

            </div>

            {/* CHANGE DETAILS */}

            <button
              type="button"
              onClick={changeDetails}
              className="w-full border border-white/10 py-3 rounded-xl text-white/70 hover:bg-white/5 transition"
            >
              Change Name / Email / Mobile
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

// ==========================================
// PAGE WRAPPER
// ==========================================

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}