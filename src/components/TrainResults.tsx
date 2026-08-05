"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/* -------- TYPES -------- */

type TrainResult = {
  id?: number;
  trainName?: string;
  name?: string;
  operator?: string;

  fromCity?: string;
  toCity?: string;
  from?: string;
  to?: string;

  route?: string;

  duration?: string;

  departure?: string;
  arrival?: string;

  departureTime?: string;
  arrivalTime?: string;

  price?: number;
  seats?: number | string;
};

type Props = {
  trains?: TrainResult[];
};

/* -------- DURATION CALCULATOR -------- */

function calculateDuration(dep?: string, arr?: string) {
  if (!dep || !arr) return "—";

  if (dep.includes(":") && arr.includes(":")) {
    const [dh, dm] = dep.split(":").map(Number);
    const [ah, am] = arr.split(":").map(Number);

    if (isNaN(dh) || isNaN(dm) || isNaN(ah) || isNaN(am)) return "—";

    let depMin = dh * 60 + dm;
    let arrMin = ah * 60 + am;

    if (arrMin < depMin) arrMin += 24 * 60; // overnight

    const diff = arrMin - depMin;

    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h}h ${m}m`;
  }

  return "—";
}

/* -------- NORMALIZE -------- */

function normalizeTrain(t: TrainResult, index: number) {
  const from =
    t.fromCity ??
    t.from ??
    t.route?.split("-")[0] ??
    "N/A";

  const to =
    t.toCity ??
    t.to ??
    t.route?.split("-")[1] ??
    "N/A";

  const departure =
    t.departure ??
    t.departureTime ??
    "";

  const arrival =
    t.arrival ??
    t.arrivalTime ??
    "";

  return {
    id: typeof t?.id === "number" ? t.id : index + 1,

    trainName:
      t?.trainName ?? t?.name ?? t?.operator ?? "Train",

    from,
    to,

    duration: calculateDuration(departure, arrival), // ✅ FIXED

    priceNumber:
      typeof t?.price === "number" ? t.price : 0,

    priceDisplay:
      typeof t?.price === "number"
        ? `₹${t.price.toLocaleString("en-IN")}`
        : "—",

    seats:
      typeof t?.seats === "number"
        ? t.seats
        : typeof t?.seats === "string"
        ? parseInt(t.seats)
        : null,
  };
}

/* -------- COMPONENT -------- */

export default function TrainResults({ trains = [] }: Props) {
  const router = useRouter();

  /* -------- REMOVE DUPLICATES (STRONG FIX) -------- */
  const uniqueTrains = Array.from(
    new Map(
      trains.map((t) => [
        JSON.stringify({
          name: t.trainName ?? t.name,
          price: t.price,
          from: t.fromCity ?? t.from,
          to: t.toCity ?? t.to,
        }),
        t,
      ])
    ).values()
  );

  /* -------- NORMALIZED -------- */
  const normalized = useMemo(
    () => uniqueTrains.map((t, i) => normalizeTrain(t, i)),
    [uniqueTrains]
  );

  /* -------- NAVIGATION -------- */
  function handleBook(train: ReturnType<typeof normalizeTrain>) {
    const token = localStorage.getItem("jetly_token");
  
    const bookingData = {
      action: "passenger",
      type: "train",
      data: {
        trainId: train.id,
        trainName: train.trainName,
        duration: train.duration,
        price: train.priceNumber,
      },
    };
  
    // ❌ NOT LOGGED IN → SAVE INTENT
    if (!token) {
      localStorage.setItem(
        "redirectAfterLogin",
        JSON.stringify(bookingData)
      );
  
      router.push("/login");
      return;
    }
  
    // ✅ LOGGED IN → CONTINUE
    router.push(
      `/train-passenger?trainId=${train.id}&trainName=${encodeURIComponent(
        train.trainName
      )}&duration=${encodeURIComponent(
        train.duration
      )}&price=${train.priceNumber}`
    );
  }

  /* -------- EMPTY -------- */
  if (!normalized.length) {
    return (
      <div className="glass-card p-8 text-center text-white/70">
        No train results found.
      </div>
    );
  }

  /* -------- UI -------- */

  return (
    <div className="space-y-4">

      <h3 className="text-xl font-semibold text-white mb-4">
        🚆 Train Results
      </h3>

      {normalized.map((train, i) => (
        <motion.div
          key={`${train.id}-${i}`}
          className="glass-card p-5 flex flex-col sm:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          {/* LEFT */}
          <div>
            <p className="font-semibold text-white">
              {train.trainName}
            </p>

            <p className="text-sm text-white/60">
              {train.from} → {train.to}
            </p>

            <p className="text-sm text-white/50">
              Duration: {train.duration}
            </p>

            <p
              className={`text-sm ${
                train.seats === 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {train.seats === null
                ? "Seats: N/A"
                : train.seats === 0
                ? "Sold Out ❌"
                : `Seats Available: ${train.seats}`}
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <p className="text-xl font-bold text-white">
              {train.priceDisplay}
            </p>

            <button
  onClick={() => handleBook(train)}
  disabled={train.seats === 0}
  className={`px-4 py-2 rounded text-white ${
    train.seats === 0
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {train.seats === 0 ? "Sold Out" : "Book Now"}
</button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}