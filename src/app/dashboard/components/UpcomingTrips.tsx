"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardSection from "./DashboardSection";
import { fetchBookings } from "@/lib/api";
import type { Booking } from "@/types";

function TripsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="glass-card p-5 animate-pulse">
          <div className="h-4 w-40 bg-white/10 rounded mb-3" />
          <div className="h-3 w-56 bg-white/10 rounded mb-2" />
          <div className="h-3 w-44 bg-white/10 rounded mb-4" />
          <div className="h-8 w-24 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

function getTransportName(b: Booking) {
  return (
    b.bus?.operator ||
    b.flight?.airline ||
    b.train?.trainName ||
    "Transport"
  );
}

export default function UpcomingTrips() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(() => {
    // We don't have a trip date field in Booking; treat recent CONFIRMED as upcoming.
    return bookings
      .filter((b) => String(b.status).toUpperCase() === "CONFIRMED")
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 4);
  }, [bookings]);

  return (
    <DashboardSection
      title="Upcoming Trips"
      subtitle="Your confirmed bookings—ready when you are."
      right={
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      {loading ? (
        <TripsSkeleton />
      ) : upcoming.length === 0 ? (
        <div className="text-white/70 text-sm">
          No confirmed trips yet. Book a flight, bus, or train to see it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcoming.map((b) => (
            <div key={b.id} className="glass-card p-5 border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">
                    Booking #{b.id} • {b.bookingType}
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    {getTransportName(b)}
                  </p>
                  <p className="text-white/60 text-sm">
                    Booked on {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">
                    ₹{Number(b.totalPrice).toLocaleString("en-IN")}
                  </p>
                  <span className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">
                    CONFIRMED
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

