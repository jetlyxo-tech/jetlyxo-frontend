"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  fetchBookings,
  cancelBooking,
  fetchRecommendations,
  mapBookingsForAI,
  type Booking,
  type Recommendation,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

type FilterType =
  | "ALL"
  | "UPCOMING"
  | "CONFIRMED"
  | "PENDING_PAYMENT"
  | "CANCELLED";

export default function MyBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<FilterType>("ALL");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [toast, setToast] = useState("");

  /* =========================
     LOAD BOOKINGS
  ========================= */
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchBookings();
      const safeData = Array.isArray(data) ? data : [];

      setBookings(safeData);

      const mapped = mapBookingsForAI(safeData).filter(
        (item) => item.source && item.destination
      );

      if (mapped.length > 0) {
        const recs = await fetchRecommendations(mapped);
        setRecommendations(Array.isArray(recs) ? recs : []);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
      setToast("Failed to load bookings");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
     AUTH CHECK
  ========================= */
  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingAuth(false);
    loadBookings();
  }, [router, loadBookings]);

  /* =========================
     FILTER BOOKINGS
  ========================= */
  const filteredBookings = useMemo(() => {
    if (filter === "ALL") return bookings;

    if (filter === "UPCOMING") {
      return bookings.filter((b) => b.status === "CONFIRMED");
    }

    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  /* =========================
     CANCEL BOOKING
  ========================= */
  const handleCancel = async () => {
    if (!selectedId) return;

    try {
      setCancelLoading(true);

      await cancelBooking(String(selectedId));

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedId
            ? { ...booking, status: "CANCELLED" }
            : booking
        )
      );

      setToast("Booking cancelled successfully");
    } catch (error) {
      console.error("Cancel failed:", error);
      setToast("Failed to cancel booking");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
      setSelectedId(null);

      setTimeout(() => setToast(""), 2500);
    }
  };

  /* =========================
     STATUS COLORS
  ========================= */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500/20 text-green-400";
      case "PENDING_PAYMENT":
        return "bg-yellow-500/20 text-yellow-400";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400";
      case "FAILED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-white/10 text-white";
    }
  };

  /* =========================
     LOADING SCREEN
  ========================= */
  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-lg animate-pulse">Loading your bookings...</div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <p className="text-blue-400 text-sm">Jetly Travel Dashboard</p>
          <h1 className="text-4xl font-bold mt-1">My Bookings</h1>
          <p className="text-white/60 mt-2">
            Manage your trips, payments and tickets.
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            "ALL",
            "UPCOMING",
            "CONFIRMED",
            "PENDING_PAYMENT",
            "CANCELLED",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item as FilterType)}
              className={`px-4 py-2 rounded-xl border transition ${
                filter === item
                  ? "bg-blue-600 border-blue-600"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {item.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* EMPTY */}
        {filteredBookings.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-semibold">No bookings found</h2>
            <p className="text-white/60 mt-2">
              Start planning your next journey with Jetly.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-5 bg-blue-600 px-5 py-3 rounded-xl hover:bg-blue-700"
            >
              Search Trips
            </button>
          </div>
        )}

        {/* BOOKINGS */}
        <div className="space-y-5">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">
                {/* LEFT */}
                <div>
                  <p className="text-sm text-white/50">
                    Booking #{booking.id}
                  </p>

                  <h2 className="text-2xl font-bold mt-1">
                    {booking.bookingType}
                  </h2>

                  <p className="text-white/70 mt-1">
                    Passenger: {booking.passengerName || "Guest"}
                  </p>

                  <p className="text-white/70">
                    Amount: ₹{booking.totalPrice}
                  </p>
                </div>

                {/* RIGHT */}
                <div className="text-right space-y-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {booking.status === "CONFIRMED" && (
                      <>
                        <button
                          onClick={() =>
                            router.push(`/ticket?bookingId=${booking.id}`)
                          }
                          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          View Ticket
                        </button>

                        <button
                          onClick={() => {
                            setSelectedId(booking.id);
                            setShowCancelModal(true);
                          }}
                          className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === "PENDING_PAYMENT" && (
                      <button
                        onClick={() =>
                          router.push(`/payment?bookingId=${booking.id}`)
                        }
                        className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400"
                      >
                        Complete Payment
                      </button>
                    )}

                    {booking.status === "CANCELLED" && (
                      <button
                        onClick={() => router.push("/")}
                        className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20"
                      >
                        Book Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-5">Recommended Trips</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-5 bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <p className="text-xl font-semibold">
                    {item.source} → {item.destination}
                  </p>

                  <p className="text-white/80 mt-2">
                    Starting from ₹{item.price}
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/results?type=${item.type}&from=${item.source}&to=${item.destination}`
                      )
                    }
                    className="mt-4 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANCEL MODAL */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
              <h2 className="text-2xl font-bold">Cancel Booking?</h2>

              <p className="text-white/60 mt-2">
                This action may trigger refund rules.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-white/10 py-3 rounded-xl"
                >
                  Keep Booking
                </button>

                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="flex-1 bg-red-600 py-3 rounded-xl hover:bg-red-700"
                >
                  {cancelLoading ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className="fixed bottom-5 right-5 bg-black px-5 py-3 rounded-xl border border-white/10">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}