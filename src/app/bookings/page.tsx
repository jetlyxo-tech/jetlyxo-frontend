"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchBookings,
  cancelBooking,
  Booking,
  fetchRecommendations,
  Recommendation,
  mapBookingsForAI
} from "@/lib/api";


import { getBookingById } from "@/lib/api";


export default function BookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [lastCancelled, setLastCancelled] = useState<Booking | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  const [showWalletAnim, setShowWalletAnim] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  /* =============================
     TIMER
  ============================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* =============================
     LOAD BOOKINGS
  ============================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    fetchBookings()
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(() => console.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  /* =============================
     LOAD RECOMMENDATIONS
  ============================= */
  useEffect(() => {
    if (!bookings.length) return;

    const loadRecommendations = async () => {
      try {
        const mapped = mapBookingsForAI(bookings);

        const validMapped = mapped.filter(
          (b) => b.source && b.destination
        );

        if (!validMapped.length) return;

        const data = await fetchRecommendations(validMapped);
        setRecommendations(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadRecommendations();
  }, [bookings]);

  /* =============================
     CANCEL LOGIC
  ============================= */
  const confirmCancel = async () => {
    if (!selectedId) return;

    const booking = bookings.find(b => b.id === selectedId);
    if (!booking) return;

    try {
      setCancelLoading(true);

      await cancelBooking(String(selectedId));

      setLastCancelled({ ...booking, status: "CONFIRMED" });

      setBookings(prev =>
        prev.map(b =>
          b.id === selectedId ? { ...b, status: "CANCELLED" } : b
        )
      );

      setToast("Cancelled successfully");
      setUndoVisible(true);

      setTimeout(() => {
        setUndoVisible(false);
        setLastCancelled(null);
      }, 5000);

      setShowModal(false);
      setSelectedId(null);

    } catch {
      setToast("Cancel failed");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUndo = () => {
    if (!lastCancelled) return;

    setBookings(prev =>
      prev.map(b =>
        b.id === lastCancelled.id ? lastCancelled : b
      )
    );

    setToast("Undo successful");
    setUndoVisible(false);
    setLastCancelled(null);
  };

  const loadBooking = async () => {
    if (!selectedId) return;
  
    try {
      const data = await getBookingById(selectedId);
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* =============================
     UI
  ============================= */

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-navy-950 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {/* BOOKINGS */}
      {bookings.map((booking) => (
        <div key={booking.id} className="glass-card p-6 flex justify-between mb-4">

          <div>
            <p>Booking ID: {booking.id}</p>
            <p className="text-green-400">{booking.status}</p>
          </div>

          <div>
            <p>₹{booking.totalPrice}</p>

            {booking.status === "CONFIRMED" && (
  <>
    <button
      onClick={() => {
        setSelectedId(booking.id);
        setShowModal(true);
      }}
      className="bg-red-500 px-3 py-1 rounded ml-2"
    >
      Cancel
    </button>

    <button
      onClick={async () => {
        const data = await getBookingById(booking.id);
        console.log("DETAILS:", data);
      }}
      className="bg-blue-500 px-3 py-1 rounded ml-2"
    >
      View
    </button>
  </>
)}
{booking.status === "CONFIRMED" && (
  <button onClick={loadBooking} className="bg-blue-500 px-3 py-1 rounded ml-2">
    View
  </button>
)}
          </div>

        </div>
      ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded">

            <h2>Cancel Booking?</h2>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)}>No</button>
              <button onClick={confirmCancel}>
                {cancelLoading ? "Cancelling..." : "Yes"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-black p-3 rounded">
          {toast}
          {undoVisible && (
            <button onClick={handleUndo} className="ml-2">
              Undo
            </button>
          )}
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <>
          <h2 className="text-xl mt-10">Recommended for You</h2>

          {recommendations.map((item) => (
            <div key={item.id} className="p-4 border mt-2">
              {item.source} → {item.destination} ₹{item.price}
            </div>
          ))}
        </>
      )}

    </div>
  );
}