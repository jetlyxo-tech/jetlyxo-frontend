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
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Ms");
  const [dob, setDob] = useState("");
  const [pan, setPan] = useState("");
  

  const [loading, setLoading] = useState(false);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "";
  
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
  
    let years = today.getFullYear() - birthDate.getFullYear();
  
    const monthDiff = today.getMonth() - birthDate.getMonth();
  
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      years--;
    }
  
    return Math.max(0, years).toString();
  };
  async function handleContinue() {
    try {
      setLoading(true);
  
      const token = getToken();
  
      if (!token) {
        toast.warning("Please login first.");
        router.push("/login");
        return;
      }

      if (!firstName.trim() || !lastName.trim()) {
        toast.warning("Please enter your first and last name.");
        return;
      }

      if (!dob) {
        toast.warning("Please select your date of birth.");
        return;
      }

      if (!age) {
        toast.warning("Age could not be calculated.");
        return;
      }
      
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        toast.warning("Please enter a valid PAN number.");
        return;
      }
      
      if (!/^\d{10}$/.test(phone)) {
        toast.warning("Please enter a valid 10-digit phone number.");
        return;
      }
      
      if (!/\S+@\S+\.\S+/.test(email)) {
        toast.warning("Please enter a valid email address.");
        return;
      }
  
  
      let did = "";

const quote = await fareQuote({
  id: flightId,
  searchId,
  tId,
});

console.log("QUOTE =", quote);
console.log("QUOTE JSON =", JSON.stringify(quote, null, 2));

did =
  quote?.dId ??
  quote?.data?.dId ??
  quote?.data?.data?.dId ??
  "";

console.log("Extracted dId =", did);

if (!did) {
  console.error("dId Missing:", quote);
  toast.error("Booking Detail ID (dId) not received.");
  return;
}

  
      console.log("Booking Detail ID:", did);
      console.log({
        firstName,
        lastName,
      });
  
      router.push(
        `/flight-seat?did=${encodeURIComponent(did)}` +
        `&flightId=${encodeURIComponent(flightId)}` +
        `&searchId=${encodeURIComponent(searchId)}` +
        `&tId=${encodeURIComponent(tId)}` +
        `&price=${encodeURIComponent(price)}` +
        `&airline=${encodeURIComponent(airline)}` +
        `&duration=${encodeURIComponent(duration)}` +
        `&firstName=${encodeURIComponent(firstName.trim())}` +
        `&lastName=${encodeURIComponent(lastName.trim())}` +
        `&age=${encodeURIComponent(age)}` +
        `&phone=${encodeURIComponent(phone)}` +
        `&email=${encodeURIComponent(email)}` +
        `&title=${encodeURIComponent(title)}` +
        `&dob=${encodeURIComponent(dob)}` +
        `&pan=${encodeURIComponent(pan)}`
      );
    } catch (err: any) {
      console.error(err);
  
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-96 space-y-4">

        <h1 className="text-2xl font-bold text-center">
          Flight Passenger Details
        </h1>

        <p>
          Airline:
          <span className="font-semibold ml-2">
            {airline}
          </span>
        </p>

        <p>
          Duration:
          <span className="font-semibold ml-2">
            {duration}
          </span>
        </p>

        <p>
          Price:
          <span className="font-semibold ml-2">
            ₹{price}
          </span>
        </p>
        <select
  className="w-full p-2 rounded bg-slate-700"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
>
  <option value="Mr">Mr</option>
  <option value="Ms">Ms</option>
  <option value="Mrs">Mrs</option>
</select>
<input
  className="w-full p-2 rounded bg-slate-700"
  placeholder="First Name"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
/>

<input
  className="w-full p-2 rounded bg-slate-700"
  placeholder="Last Name"
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
/>

<input
  type="date"
  max={new Date().toISOString().split("T")[0]}
  className="w-full p-2 rounded bg-slate-700"
  value={dob}
  onChange={(e) => {
    const selectedDob = e.target.value;
    setDob(selectedDob);
    setAge(calculateAge(selectedDob));
  }}
/>

<input
  type="text"
  className="w-full p-2 rounded bg-slate-600 cursor-not-allowed"
  placeholder="Age"
  value={age}
  readOnly
/>

        <input
          className="w-full p-2 rounded bg-slate-700"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-slate-700"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

<input
  className="w-full p-2 rounded bg-slate-700"
  placeholder="PAN Card"
  value={pan}
  onChange={(e) => setPan(e.target.value.toUpperCase())}
/>

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Verifying Fare..."
            : "Continue to Seat Selection"}
        </button>

      </div>
    </div>
  );
}

export default function FlightPassengerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <FlightPassengerPageContent />
    </Suspense>
  );
}