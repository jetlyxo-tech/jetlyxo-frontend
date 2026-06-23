"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { createBooking } from "@/lib/api";
import { getToken } from "@/lib/auth";

function FlightPassengerPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const flightId = params.get("flightId");
  const airline = params.get("airline") || "Flight";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "0";

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    try {
      setLoading(true);

      /* =========================
         LOGIN CHECK
      ========================= */
      const token = getToken();

      if (!token) {
        alert("Please login first");
        router.push("/login");
        return;
      }

      /* =========================
         VALIDATION
      ========================= */
      if (!flightId) {
        alert("Flight info missing");
        return;
      }

      if (!name || !age || !phone || !email) {
        alert("Please fill all details");
        return;
      }

      /* =========================
         BOOKING PAYLOAD
      ========================= */
      const payload = {
        bookingType: "FLIGHT",
        entityId: Number(flightId),

        passengerName: name,
        passengerAge: Number(age),
        passengerPhone: phone,
        passengerEmail: email,
      };

      console.log("BOOKING PAYLOAD:", payload);

      /* =========================
         CREATE BOOKING
      ========================= */
      const res = await createBooking(payload);

const bookingId = res.bookingId;

      if (!bookingId) {
        alert("Booking failed");
        return;
      }

      /* =========================
         GO TO PAYMENT
      ========================= */
      router.push(`/payment?bookingId=${bookingId}`);
    } catch (err: any) {
      console.error("BOOKING ERROR:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Error creating booking"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 p-8 rounded-xl w-96 shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-center">
           Flight Passenger Details
        </h1>

        <p>
          Airline: <span className="font-semibold">{airline}</span>
        </p>

        <p>
          Duration: <span className="font-semibold">{duration}</span>
        </p>

        <p>
          Price: <span className="font-semibold">&#8377;{price}</span>
        </p>

        <input
          placeholder="Full Name"
          className="w-full p-2 rounded bg-slate-700"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Age"
          className="w-full p-2 rounded bg-slate-700"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <input
          placeholder="Phone Number"
          className="w-full p-2 rounded bg-slate-700"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full p-2 rounded bg-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Continue to Payment"}
        </button>
      </div>
    </div>
  );
}

export default function FlightPassengerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">Loading...</div>}>
      <FlightPassengerPageContent />
    </Suspense>
  );
}


