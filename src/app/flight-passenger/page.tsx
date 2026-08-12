"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { fareQuote } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

function FlightPassengerPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const flightId = params.get("flightId") ?? "";
  const searchId = params.get("searchId") ?? "";
  const tId = params.get("tId") ?? "";

  const airline = params.get("airline") || "Flight";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "0";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] =
  useState("+91");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Ms");
  const [dob, setDob] = useState("");

  // Indian / non-Indian
  const [residence, setResidence] = useState("IN");

  // Indian resident
  const [pan, setPan] = useState("");

  // Non-Indian resident
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [passportCountry, setPassportCountry] = useState("");

  const [loading, setLoading] = useState(false);

  /* =========================
     CALCULATE AGE
  ========================= */

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "";

    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    let years =
      today.getFullYear() - birthDate.getFullYear();

    const monthDiff =
      today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      years--;
    }

    return Math.max(0, years).toString();
  };

  const todayString = new Date()
    .toISOString()
    .split("T")[0];

  /* =========================
     CONTINUE
  ========================= */

  async function handleContinue() {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        toast.warning("Please login first.");
        router.push("/login");
        return;
      }

      /* ---------- NAME ---------- */

      if (!firstName.trim()) {
        toast.warning("Please enter your first name.");
        return;
      }

      if (!lastName.trim()) {
        toast.warning("Please enter your last name.");
        return;
      }

      /* ---------- DOB ---------- */

      if (!dob) {
        toast.warning("Please select your date of birth.");
        return;
      }

      if (!age) {
        toast.warning("Age could not be calculated.");
        return;
      }

      /* ---------- RESIDENCY ---------- */

      if (!residence) {
        toast.warning("Please select your country of residence.");
        return;
      }

      /* =========================
         INDIAN RESIDENT
      ========================= */

      const normalizedPan = pan
        .trim()
        .toUpperCase();

      if (residence === "IN") {
        if (
          !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
            normalizedPan
          )
        ) {
          toast.warning(
            "Please enter a valid 10-character PAN number."
          );
          return;
        }
      }

      /* =========================
         NON-INDIAN RESIDENT
      ========================= */

      const normalizedPassport =
        passportNumber.trim().toUpperCase();

      const normalizedPassportCountry =
        passportCountry.trim().toUpperCase();

      if (residence !== "IN") {
        if (!normalizedPassport) {
          toast.warning(
            "Please enter your passport number."
          );
          return;
        }

        if (!passportExpiry) {
          toast.warning(
            "Please select your passport expiry date."
          );
          return;
        }

        if (!normalizedPassportCountry) {
          toast.warning(
            "Please enter your passport country."
          );
          return;
        }

        // Passport must not be expired
        if (passportExpiry < todayString) {
          toast.warning(
            "Passport must be valid on the travel date."
          );
          return;
        }
      }

      /* ---------- PHONE ---------- */

      const normalizedPhone = phone.trim();

      if (
  !/^\d{7,15}$/.test(normalizedPhone)
) {
  toast.warning(
    "Please enter a valid phone number."
  );
  return;
}

      /* ---------- EMAIL ---------- */

      const normalizedEmail =
        email.trim().toLowerCase();

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizedEmail
        )
      ) {
        toast.warning(
          "Please enter a valid email address."
        );
        return;
      }

      /* =========================
         FARE QUOTE
      ========================= */

      const quote = await fareQuote({
        id: flightId,
        searchId,
        tId,
      });

      console.log("========== FRONTEND FARE QUOTE ==========");
console.log(JSON.stringify(quote, null, 2));
console.log("dId:", quote?.dId);
console.log("data.dId:", quote?.data?.dId);
console.log("data.data.dId:", quote?.data?.data?.dId);
console.log(
  "data.data.data.dId:",
  quote?.data?.data?.data?.dId
);
console.log("=========================================");

      const did =
        quote?.dId ??
        quote?.data?.dId ??
        quote?.data?.data?.dId ??
        quote?.data?.data?.data?.dId ??
        "";

      if (!did) {
        console.error(
          "dId missing from Fare Quote response:",
          quote
        );

        toast.error(
          "Booking Detail ID (dId) not received."
        );

        return;
      }

      console.log(
        "Booking Detail ID received:",
        did
      );

      /* =========================
         GO TO SEAT SELECTION
      ========================= */

      const query = new URLSearchParams({
        did,
        flightId,
        searchId,
        tId,
        price,
        airline,
        duration,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age,
        phone: normalizedPhone,
        phoneCountryCode,
        email: normalizedEmail,
        title,
        dob,
        residence,
        pan:
          residence === "IN"
            ? normalizedPan
            : "",
        passportNumber:
          residence !== "IN"
            ? normalizedPassport
            : "",
        passportExpiry:
          residence !== "IN"
            ? passportExpiry
            : "",
        passportCountry:
          residence !== "IN"
            ? normalizedPassportCountry
            : "",
      });

      router.push(`/flight-seat?${query.toString()}`);
    } catch (err: any) {
      console.error(
        "Passenger Continue Error:",
        err
      );

      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* =========================
            HEADER
        ========================= */}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Passenger Details
          </h1>

          <p className="text-slate-400 mt-2">
            Enter the passenger details exactly as
            they appear on the travel documents.
          </p>
        </div>

        {/* =========================
            FLIGHT SUMMARY
        ========================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-lg">

          <h2 className="text-lg font-semibold mb-4">
            Flight Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Airline
              </p>

              <p className="font-semibold mt-1">
                {airline}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Duration
              </p>

              <p className="font-semibold mt-1">
                {duration || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Fare
              </p>

              <p className="font-semibold mt-1 text-green-400">
                ₹{price}
              </p>
            </div>

          </div>
        </div>

        {/* =========================
            PASSENGER FORM
        ========================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">

          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Passenger Information
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Fields marked with{" "}
              <span className="text-red-400">*</span>{" "}
              are required.
            </p>
          </div>

          <div className="space-y-5">

            {/* TITLE + FIRST NAME */}

            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Title
                </label>

                <select
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Mr">Mr</option>
                  <option value="Ms">Ms</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(e.target.value)
                  }
                  className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

            </div>

            {/* LAST NAME */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Last Name{" "}
                <span className="text-red-400">*</span>
              </label>

              <input
                type="text"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* DOB + AGE */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of Birth{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="date"
                  max={todayString}
                  value={dob}
                  onChange={(e) => {
                    const selectedDob =
                      e.target.value;

                    setDob(selectedDob);
                    setAge(
                      calculateAge(selectedDob)
                    );
                  }}
                  className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Age
                </label>

                <input
                  type="text"
                  value={age}
                  readOnly
                  placeholder="Auto calculated"
                  className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 cursor-not-allowed"
                />
              </div>

            </div>

            {/* =========================
                COUNTRY OF RESIDENCE
            ========================= */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Country of Residence{" "}
                <span className="text-red-400">*</span>
              </label>

              <select
                value={residence}
                onChange={(e) => {
                  const value = e.target.value;

                  setResidence(value);

                  // Clear document data when switching
                  if (value === "IN") {
                    setPassportNumber("");
                    setPassportExpiry("");
                    setPassportCountry("");
                  } else {
                    setPan("");
                  }
                }}
                className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="IN">
                  India
                </option>

                <option value="US">
                  United States
                </option>

                <option value="GB">
                  United Kingdom
                </option>

                <option value="CA">
                  Canada
                </option>

                <option value="AU">
                  Australia
                </option>

                <option value="AE">
                  United Arab Emirates
                </option>

                <option value="SG">
                  Singapore
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            {/* =========================
                INDIAN RESIDENT → PAN
            ========================= */}

            {residence === "IN" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  PAN Card Number{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter 10-character PAN"
                  value={pan}
                  maxLength={10}
                  autoCapitalize="characters"
                  onChange={(e) =>
                    setPan(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 10)
                    )
                  }
                  className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none uppercase tracking-wider"
                />

                <p className="text-xs text-slate-400 mt-2">
                  PAN is required for Indian residents
                  for flight booking.
                </p>
              </div>
            )}

            {/* =========================
                NON-INDIAN → PASSPORT
            ========================= */}

            {residence !== "IN" && (
              <div className="space-y-5">

                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-900">
                  <p className="text-sm text-blue-200">
                    Passport details are required for
                    non-Indian residents according to
                    the flight booking requirements.
                  </p>
                </div>

                {/* PASSPORT NUMBER */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Passport Number{" "}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter passport number"
                    value={passportNumber}
                    maxLength={20}
                    onChange={(e) =>
                      setPassportNumber(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                      )
                    }
                    className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none uppercase"
                  />
                </div>

                {/* PASSPORT EXPIRY */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Passport Expiry Date{" "}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="date"
                    min={todayString}
                    value={passportExpiry}
                    onChange={(e) =>
                      setPassportExpiry(
                        e.target.value
                      )
                    }
                    className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* PASSPORT COUNTRY */}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Passport Country{" "}
                    <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={passportCountry}
                    onChange={(e) =>
                      setPassportCountry(
                        e.target.value
                      )
                    }
                    className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

              </div>
            )}
{/* =========================
    PHONE
========================= */}

<div>
  <label className="block text-sm font-medium mb-2">
    Phone Number{" "}
    <span className="text-red-400">*</span>
  </label>

  <div className="flex gap-2">

    {/* COUNTRY CODE */}

    <select
      value={phoneCountryCode}
      onChange={(e) =>
        setPhoneCountryCode(e.target.value)
      }
      className="h-11 w-28 px-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
    >
      <option value="+91">
        +91 India
      </option>

      <option value="+1">
        +1 USA/Canada
      </option>

      <option value="+44">
        +44 UK
      </option>

      <option value="+61">
        +61 Australia
      </option>

      <option value="+971">
        +971 UAE
      </option>

      <option value="+65">
        +65 Singapore
      </option>
    </select>

    {/* PHONE NUMBER */}

    <input
      type="tel"
      inputMode="numeric"
      maxLength={15}
      placeholder="Enter phone number"
      value={phone}
      onChange={(e) =>
        setPhone(
          e.target.value
            .replace(/\D/g, "")
            .slice(0, 15)
        )
      }
      className="flex-1 h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
    />

  </div>

  <p className="text-xs text-slate-400 mt-2">
    Include the correct country code for the
    passenger's contact number.
  </p>
</div>
            

            {/* EMAIL */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address{" "}
                <span className="text-red-400">*</span>
              </label>

              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* CONTINUE */}

            <div className="pt-3">

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Verifying Fare..."
                  : "Continue to Seat Selection"}
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlightPassengerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          Loading...
        </div>
      }
    >
      <FlightPassengerPageContent />
    </Suspense>
  );
}