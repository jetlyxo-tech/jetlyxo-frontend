"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { Bus } from "@/types/bus";

/* -------- DURATION -------- */

function calculateDuration(dep?: string, arr?: string) {
  if (!dep || !arr) return "—";

  if (dep.includes(":") && arr.includes(":")) {
    const [dh, dm] = dep.split(":").map(Number);
    const [ah, am] = arr.split(":").map(Number);

    if (isNaN(dh) || isNaN(dm) || isNaN(ah) || isNaN(am)) return "—";

    let depMin = dh * 60 + dm;
    let arrMin = ah * 60 + am;

    if (arrMin < depMin) arrMin += 24 * 60;

    const diff = arrMin - depMin;

    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h}h ${m}m`;
  }

  return "—";
}

/* -------- NORMALIZE -------- */

function normalizeBus(bus: Bus, index: number) {
  return {
    id: bus?.id ?? index + 1,
    operator: bus?.busName ?? "Bus",
    from: bus?.fromCity ?? "N/A",
    to: bus?.toCity ?? "N/A",

    duration: calculateDuration(bus.departure, bus.arrival),

    priceNumber: typeof bus?.price === "number" ? bus.price : 0,
    priceDisplay:
      typeof bus?.price === "number"
        ? `₹${bus.price.toLocaleString("en-IN")}`
        : "—",

    seats:
      typeof bus?.seats === "number"
        ? bus.seats
        : typeof bus?.seats === "string"
        ? parseInt(bus.seats)
        : null,
  };
}

/* -------- COMPONENT -------- */

export default function BusResults({ buses }: { buses: Bus[] }) {
  const router = useRouter();

  /* ✅ STRONG DEDUPE FIX */
  const unique = Array.from(
    new Map(
      buses.map((b) => [
        JSON.stringify({
          name: b.busName,
          from: b.fromCity,
          to: b.toCity,
          price: b.price,
        }),
        b,
      ])
    ).values()
  );

  /* -------- NORMALIZED -------- */
  const normalized = useMemo(
    () => unique.map((b, i) => normalizeBus(b, i)),
    [unique]
  );

  /* -------- NAVIGATION -------- */
  const handleBook = (bus: ReturnType<typeof normalizeBus>) => {
    const token = localStorage.getItem("jetly_token");
  
    const bookingData = {
      action: "passenger",
      type: "bus",
      data: {
        busId: bus.id,
        operator: bus.operator,
        duration: bus.duration,
        price: bus.priceNumber,
      },
    };
  
    // ❌ NOT LOGGED IN
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
      `/bus-passenger?busId=${bus.id}&operator=${encodeURIComponent(
        bus.operator
      )}&duration=${encodeURIComponent(
        bus.duration
      )}&price=${bus.priceNumber}`
    );
  };

  /* -------- EMPTY -------- */
  if (!normalized.length) {
    return (
      <div className="glass-card p-8 text-center text-white/70">
        No bus results found.
      </div>
    );
  }

  /* -------- UI -------- */

  return (
    <div className="space-y-4">

      <h3 className="text-xl font-semibold text-white mb-4">
        🚌 Bus Results
      </h3>

      {normalized.map((bus, i) => (
        <motion.div
          key={`${bus.id}-${i}`}
          className="glass-card p-5 flex flex-col sm:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          {/* LEFT */}
          <div>
            <p className="font-semibold text-white">
              {bus.operator}
            </p>

            <p className="text-sm text-white/60">
              {bus.from} → {bus.to}
            </p>

            <p className="text-sm text-white/50">
              Duration: {bus.duration}
            </p>

            <p
              className={`text-sm ${
                bus.seats === 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {bus.seats === null
                ? "Seats: N/A"
                : bus.seats === 0
                ? "Sold Out ❌"
                : `Seats Available: ${bus.seats}`}
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <p className="text-xl font-bold text-white">
              {bus.priceDisplay}
            </p>

            <button
  onClick={() => handleBook(bus)}
  disabled={bus.seats === 0}
  className={`px-4 py-2 rounded text-white ${
    bus.seats === 0
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  {bus.seats === 0 ? "Sold Out" : "Book Now"}
</button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}