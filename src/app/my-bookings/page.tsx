"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchBookings,
  fetchRecommendations,
  mapBookingsForAI,
  type Recommendation,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function MyBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const loadBookings = async () => {
      let safeBookings: any[] = [];

      // -----------------------------
      // Try backend bookings
      // -----------------------------
      try {
        const data = await fetchBookings();
        safeBookings = Array.isArray(data) ? data : [];
      } catch (err) {
        console.log("Backend booking history unavailable.");
      }

      // -----------------------------
      // Backend bookings found
      // -----------------------------
      if (safeBookings.length > 0) {
        setBookings(safeBookings);

        try {
          const mapped = mapBookingsForAI(safeBookings).filter(
            (item) => item.source && item.destination
          );

          if (mapped.length > 0) {
            const recs = await fetchRecommendations(mapped as any[]);
            setRecommendations(Array.isArray(recs) ? recs : []);
          }
        } catch (err) {
          console.log("Recommendation fetch failed.");
        }

        setLoading(false);
        return;
      }

      // -----------------------------
      // Fallback to latest Bonton booking
      // -----------------------------
      const cached = sessionStorage.getItem("bookingDetails");

      console.log("SESSION:");
      console.log(cached);

      if (!cached) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(cached);

        const booking = parsed?.data?.[0];

        if (!booking) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const bontonBooking = {
          id: booking.brn,
          bookingType: "Flight",

          status: booking.status ?? "Confirmed",

          totalPrice: booking.prcd?.np ?? 0,

          passengerName: booking.trv?.[0]?.name ?? "-",

          pnr: booking.pnr ?? booking.gdsPnr ?? "-",

          airline: booking.segs?.[0]?.airnm ?? "-",

          flightNo: `${booking.segs?.[0]?.aircd ?? ""}-${booking.segs?.[0]?.fltno ?? ""}`,

          origin: booking.segs?.[0]?.orgapc ?? "-",

          destination: booking.segs?.[0]?.dstapc ?? "-",

          originCity: booking.segs?.[0]?.orgcty ?? "-",

          destinationCity: booking.segs?.[0]?.dstcty ?? "-",

          departure: booking.segs?.[0]?.dptm,

          arrival: booking.segs?.[0]?.artm,

          seat:
            booking.mbg?.find(
              (x: any) => x.ssr_type === "SeatDynamic"
            )?.ssr_info ?? "Not Selected",

          meal:
            booking.mbg?.find(
              (x: any) => x.ssr_type === "Meal"
            )?.ssr_info ?? "No Meal",
        };

        setBookings([bontonBooking]);
    

try {
  const mappedBooking = [
    {
      source: bontonBooking.originCity,
      destination: bontonBooking.destinationCity,
      type: "flight",
    },
  ];
  
  console.log("AI Request:");
  console.log(mappedBooking);
  
  const recs = await fetchRecommendations(mappedBooking as any[]);
  setRecommendations(Array.isArray(recs) ? recs : []);
} catch (err) {
  console.log("Recommendation fetch failed.");
}
      } catch (err) {
        console.log("Failed to parse cached booking.");
        setBookings([]);
      }

      setLoading(false);
    };

    loadBookings();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">

      <h1 className="text-3xl font-bold mb-8">
        My Bookings
      </h1>

      {bookings.length === 0 && (
        <div className="text-center text-gray-400 mt-20">
          No bookings available.
        </div>
      )}

      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 mb-6"
        >
          {/* Header */}

          <div className="flex justify-between items-start">

            <div>

              <h2 className="text-2xl font-bold">
                {booking.airline} {booking.flightNo}
              </h2>

              <p className="text-gray-400 mt-1">
                {booking.status}
              </p>

            </div>

            <span className="bg-green-600 px-4 py-2 rounded-full font-semibold">
              {booking.status}
            </span>

          </div>

          {/* Route */}

          <div className="mt-8 text-center">

            <div className="text-4xl font-bold">

              {booking.origin}

              <span className="mx-5 text-blue-400">
                ✈
              </span>

              {booking.destination}

            </div>

            <div className="text-gray-400 mt-2">
              {booking.originCity} → {booking.destinationCity}
            </div>

          </div>

          {/* Details */}

          <div className="grid md:grid-cols-4 gap-6 mt-8">

            <div>
              <p className="text-gray-400 text-sm">
                Passenger
              </p>
              <p>{booking.passengerName}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                PNR
              </p>
              <p>{booking.pnr}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Departure
              </p>
              <p>
                {booking.departure
                  ? new Date(booking.departure).toLocaleString("en-IN")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                Seat
              </p>
              <p>{booking.seat}</p>
            </div>

          </div>

          <div className="flex justify-between items-center mt-8">

            <div>
              <p className="text-gray-400">
                Total Fare
              </p>

              <p className="text-2xl font-bold">
                ₹{booking.totalPrice}
              </p>
            </div>

            <button
              onClick={() => router.push("/booking-success")}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
            >
              View Ticket
            </button>

          </div>
        </div>
      ))}

      {recommendations.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-12 mb-5">
            Recommended Trips
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5"
              >
                <h3 className="text-xl font-semibold">
                  {recommendation.source} → {recommendation.destination}
                </h3>

                <p className="mt-2">
                  Starting from ₹{recommendation.price}
                </p>

                <button
                  onClick={() =>
                    router.push(
                      `/results?type=${recommendation.type}&from=${recommendation.source}&to=${recommendation.destination}`
                    )
                  }
                  className="mt-4 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200"
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