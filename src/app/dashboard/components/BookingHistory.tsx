"use client";

import { useEffect, useState } from "react";
import { cancelBooking, fetchBookings } from "@/lib/api";
import type { Booking } from "@/types";

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: number) {
    try {
      await cancelBooking(String(id));
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, status: "CANCELLED" } : booking
        )
      );
    } catch (err) {
      console.error("Cancel failed", err);
    }
  }

  if (loading) {
    return <p className="text-white/60">Loading bookings...</p>;
  }

  if (!bookings.length) {
    return <p className="text-white/60">No bookings yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">My Bookings</h2>

      {bookings.map((booking) => {
        const isCancelled = booking.status === "CANCELLED";
        const from =
          booking.bus?.fromCity ||
          booking.train?.fromCity ||
          booking.flight?.fromCity ||
          booking.flight?.from ||
          "N/A";
        const to =
          booking.bus?.toCity ||
          booking.train?.toCity ||
          booking.flight?.toCity ||
          booking.flight?.to ||
          "N/A";

        return (
          <div
            key={booking.id}
            className="bg-slate-800 p-5 rounded-xl border border-white/10 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-white font-semibold">{booking.bookingType}</p>
              <span
                className={`px-3 py-1 text-xs rounded-full ${
                  isCancelled ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <p className="text-white text-lg font-medium">
              {from} to {to}
            </p>
            <p className="text-sm text-white/70 mt-1">Passenger: {booking.passengerName}</p>
            <p className="text-sm text-white/50 mt-2">
              {new Date(booking.createdAt).toLocaleString()}
            </p>

            <div className="flex justify-between items-center mt-4">
              <p className="text-xl font-bold text-white">INR {booking.totalPrice}</p>

              {!isCancelled && booking.status === "CONFIRMED" && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-white text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
