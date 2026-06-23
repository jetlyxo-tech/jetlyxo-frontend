"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchBookings,
  fetchRecommendations,
  mapBookingsForAI,
  type Booking,
  type Recommendation,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const loadBookings = async () => {
      try {
        const data = await fetchBookings();
        const safeBookings = Array.isArray(data) ? data : [];
        setBookings(safeBookings);

        const mapped = mapBookingsForAI(safeBookings).filter(
          (booking) => booking.source && booking.destination
        );

        if (mapped.length > 0) {
          const recs = await fetchRecommendations(mapped);
          setRecommendations(Array.isArray(recs) ? recs : []);
        }
      } catch (err) {
        console.error("Error loading bookings", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [router]);

  if (loading) {
    return <div className="text-white text-center mt-20">Loading bookings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 && (
        <p className="text-center text-gray-400 mt-10">No bookings yet</p>
      )}

      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-xl mb-4 flex justify-between items-center"
        >
          <div>
            <p className="font-semibold">Booking ID: {booking.id}</p>
            <p className="text-gray-400">Type: {booking.bookingType}</p>
            <p className={booking.status === "CONFIRMED" ? "text-green-400" : "text-red-400"}>
              {booking.status}
            </p>
          </div>

          <div className="text-right space-y-2">
            <p className="font-bold">INR {booking.totalPrice}</p>
            <button
              onClick={() => router.push(`/ticket?bookingId=${booking.id}`)}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              View Ticket
            </button>
          </div>
        </div>
      ))}

      {recommendations.length > 0 && (
        <>
          <h2 className="text-2xl mt-10 mb-4">Recommended Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl shadow-lg"
              >
                <p className="font-semibold text-lg">
                  {recommendation.source} to {recommendation.destination}
                </p>
                <p className="text-sm text-gray-200">Starting from</p>
                <p className="text-xl font-bold">INR {recommendation.price}</p>
                <button
                  onClick={() =>
                    router.push(
                      `/results?type=${recommendation.type}&from=${recommendation.source}&to=${recommendation.destination}`
                    )
                  }
                  className="mt-3 bg-white text-black px-3 py-1 rounded hover:bg-gray-200"
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
