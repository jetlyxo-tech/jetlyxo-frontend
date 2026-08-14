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

function normalizeBooking(booking: any) {
  // -----------------------------
  // Bonton / live flight booking
  // -----------------------------
  if (
    booking.bookingType === "FLIGHT" &&
    Array.isArray(booking.flightData) &&
    booking.flightData.length > 0
  ) {
    const flightData = booking.flightData[0];
    const segment = flightData?.segs?.[0];

    const seat =
      flightData?.mbg?.find(
        (item: any) => item.ssr_type === "SeatDynamic"
      )?.ssr_info ?? "Not Selected";

    const meal =
      flightData?.mbg?.find(
        (item: any) => item.ssr_type === "Meal"
      )?.ssr_info ?? "No Meal";

    return {
      id: booking.id,

      // Bonton reference
      bookingCode: flightData?.brn ?? null,

      bookingType: booking.bookingType,
      status: booking.status,

      passengerName:
        booking.passengerName ??
        flightData?.trv?.[0]?.name ??
        "-",

      pnr:
        booking.pnr ??
        flightData?.pnr ??
        flightData?.gdsPnr ??
        "-",

      airline: segment?.airnm ?? "-",

      flightNo: segment
        ? `${segment.aircd ?? ""}-${segment.fltno ?? ""}`
        : "-",

      origin:
        segment?.orgapc ??
        flightData?.org ??
        "-",

      destination:
        segment?.dstapc ??
        flightData?.dst ??
        "-",

      originCity:
        segment?.orgcty ??
        "-",

      destinationCity:
        segment?.dstcty ??
        "-",

      departure:
        segment?.dptm ??
        null,

      arrival:
        segment?.artm ??
        null,

      seat,
      meal,

      totalPrice:
        Number(booking.totalPrice) ||
        Number(flightData?.prcd?.np) ||
        0,

      raw: booking,
    };
  }

  // -----------------------------
  // Normal DB flight
  // -----------------------------
  if (booking.flight) {
    return {
      id: booking.id,
      bookingCode: null,

      bookingType: booking.bookingType,
      status: booking.status,

      passengerName: booking.passengerName ?? "-",
      pnr: booking.pnr ?? "-",

      airline: booking.flight.airline ?? "-",

      flightNo:
        booking.flight.flightNo ?? "-",

      origin:
        booking.flight.fromCity ?? "-",

      destination:
        booking.flight.toCity ?? "-",

      originCity:
        booking.flight.fromCity ?? "-",

      destinationCity:
        booking.flight.toCity ?? "-",

      departure:
        booking.flight.departure ?? null,

      arrival:
        booking.flight.arrival ?? null,

      seat: "Not Selected",
      meal: "No Meal",

      totalPrice:
        Number(booking.totalPrice) || 0,

      raw: booking,
    };
  }

  // -----------------------------
  // Other booking types
  // -----------------------------
  return {
    id: booking.id,
    bookingCode: null,

    bookingType: booking.bookingType,
    status: booking.status,

    passengerName: booking.passengerName ?? "-",
    pnr: booking.pnr ?? "-",

    airline: "-",
    flightNo: "-",

    origin: "-",
    destination: "-",

    originCity: "-",
    destinationCity: "-",

    departure: null,
    arrival: null,

    seat: "Not Selected",
    meal: "No Meal",

    totalPrice:
      Number(booking.totalPrice) || 0,

    raw: booking,
  };
}

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
    try {
      const data = await fetchBookings();

      const rawBookings = Array.isArray(data)
        ? data
        : [];

      const safeBookings = rawBookings.map(normalizeBooking);

      setBookings(safeBookings);

      // -----------------------------
      // Recommendations
      // -----------------------------
      try {
        const mapped = mapBookingsForAI(rawBookings).filter(
          (item) => item.source && item.destination
        );

        if (mapped.length > 0) {
          const recs = await fetchRecommendations(mapped as any[]);
          setRecommendations(
            Array.isArray(recs) ? recs : []
          );
        }
      } catch (err) {
        console.log("Recommendation fetch failed.");
      }
    } catch (err) {
      console.error(
        "Failed to load bookings:",
        err
      );

      setBookings([]);
    } finally {
      setLoading(false);
    }
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
  onClick={() =>
    router.push(
      `/booking-success?bookingId=${encodeURIComponent(booking.id)}`
    )
  }
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