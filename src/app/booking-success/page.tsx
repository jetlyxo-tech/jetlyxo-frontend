"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getBookingById,
  downloadBookingTicket,
} from "@/lib/api";


function Card({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div className="bg-slate-700 rounded-xl p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <div className="text-lg font-semibold break-words">
  {value ?? "-"}
</div>
    </div>
  );
}

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      setError("Booking ID is missing.");
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        console.log("========== LOADING TICKET ==========");
        console.log("Booking ID:", bookingId);

        const data = await getBookingById(Number(bookingId));

        console.log("BOOKING FROM BACKEND:");
        console.log(JSON.stringify(data, null, 2));

        setBooking(data);
      } catch (err) {
        console.error("Failed to load booking:", err);
        setError("Unable to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [searchParams]);

  if (loading) {
   return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xl">
      Loading Booking...
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <p className="text-xl mb-6">{error}</p>

      <button
        onClick={() => router.push("/my-bookings")}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
      >
        Back to My Bookings
      </button>
    </div>
  );
}

if (!booking) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      Booking data not found.
    </div>
  );
} 
 const bookingData = booking;

if (!bookingData) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Booking data not found.
    </div>
  );
}

const flightData = Array.isArray(bookingData.flightData)
  ? bookingData.flightData[0]
  : null;

 /* ==========================
   Extract fields safely
========================== */

const segment = flightData?.segs?.[0];

const bookingCode =
  flightData?.brn ||
  "-";

const pnr =
  bookingData.pnr ||
  flightData?.pnr ||
  flightData?.gdsPnr ||
  "-";

const passenger =
  bookingData.passengerName ||
  flightData?.trv?.[0]?.name ||
  "-";

const airline =
  segment?.airnm ||
  "-";

const flightNumber =
  segment
    ? `${segment.aircd || ""}-${segment.fltno || ""}`
    : "-";

const origin =
  segment?.orgapc ||
  flightData?.org ||
  "-";

const destination =
  segment?.dstapc ||
  flightData?.dst ||
  "-";

const originCity =
  segment?.orgcty ||
  "-";

const destinationCity =
  segment?.dstcty ||
  "-";

const departure =
  segment?.dptm ||
  "-";

const arrival =
  segment?.artm ||
  "-";

const seat =
  flightData?.mbg?.find(
    (x: any) => x.ssr_type === "SeatDynamic"
  )?.ssr_info ||
  "Not Selected";

const meal =
  flightData?.mbg?.find(
    (x: any) => x.ssr_type === "Meal"
  )?.ssr_info ||
  "No Meal";

const fare =
  Number(bookingData.totalPrice) ||
  Number(flightData?.prcd?.np) ||
  0;

const status =
  bookingData.status ||
  flightData?.status ||
  "CONFIRMED";


    function formatDate(date: string) {
      if (!date) return "-";
    
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    
  return (
  <div className="min-h-screen bg-slate-900 py-10 px-4 text-white">

    <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-slate-800">

      {/* Header */}
      <div className="bg-green-600 text-center py-8">

        <div className="text-6xl">
          ✅
        </div>

        <h1 className="text-4xl font-bold mt-2">
          Booking Confirmed
        </h1>

        <p className="text-green-100 mt-2">
          Your flight has been successfully booked.
        </p>

      </div>

      {/* Flight Banner */}
      <div className="border-b border-slate-700 p-8">

        <div className="flex flex-col md:flex-row justify-between items-center">

          <div>

            <h2 className="text-3xl font-bold">
              {origin}
              <span className="mx-4">✈</span>
              {destination}
            </h2>

            <p className="text-gray-300 mt-2">
              {originCity} → {destinationCity}
            </p>

            <p className="text-gray-400 mt-1">
              {airline} {flightNumber}
            </p>

          </div>

          <div className="text-right">

            <p className="text-sm text-gray-400">
              Booking Status
            </p>

            <p className="text-2xl font-bold text-green-400">
              {status}
            </p>

          </div>

        </div>

      </div>

      {/* Details */}
      <div className="p-8">

        <div className="grid md:grid-cols-2 gap-5">

          <Card
            title="Booking Code"
            value={bookingCode}
          />

          <Card
            title="PNR"
            value={pnr}
          />

          <Card
            title="Passenger"
            value={
              <>
                <div>{passenger}</div>

                <div className="text-sm text-gray-300 mt-1">
                  {flightData?.trv?.[0]?.pxt}
                </div>

                <div className="text-sm text-gray-300">
                  Cabin: {flightData?.trv?.[0]?.cbbg}
                </div>

                <div className="text-sm text-gray-300">
                  Check-in: {flightData?.trv?.[0]?.chbg}
                </div>
              </>
            }
          />

          <Card
            title="Flight"
            value={
              <>
                <div>
                  {airline} {flightNumber}
                </div>

                <div className="text-sm text-gray-300 mt-1">
                  {segment?.cbcls}
                </div>

                <div className="text-sm text-gray-300">
                  {segment?.dur}
                </div>
              </>
            }
          />

          <Card
            title="Departure"
            value={formatDate(departure)}
          />

          <Card
            title="Arrival"
            value={formatDate(arrival)}
          />

          <Card
            title="Seat"
            value={seat}
          />

          <Card
            title="Meal"
            value={meal}
          />

          <Card
            title="Fare Breakdown"
            value={
              <>
                <div>
                  Base Fare : ₹{flightData?.prcd?.bfr ?? 0}
                </div>

                <div>
                  Taxes : ₹{flightData?.prcd?.txf ?? 0}
                </div>

                <hr className="my-2 border-slate-500" />

                <div className="font-bold">
                  Total : ₹{fare}
                </div>
              </>
            }
          />

          <Card
            title="Status"
            value={status}
          />

        </div>

        {/* Buttons */}
        <div className="grid md:grid-cols-4 gap-4 mt-10">

          <button
  disabled={downloading}
  onClick={async () => {
    try {
      setDownloading(true);

      const blob = await downloadBookingTicket(
        Number(bookingData.id)
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `JetlyXO_Ticket_${bookingData.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ticket download failed:", error);
      alert("Unable to download ticket. Please try again.");
    } finally {
      setDownloading(false);
    }
  }}
  className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold disabled:opacity-50"
>
  {downloading ? "Downloading..." : "📄 Download Ticket"}
</button>

          <button
            onClick={() => router.push("/my-bookings")}
            className="bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-semibold"
          >
            📖 My Bookings
          </button>

          <button
            onClick={() => router.push("/")}
            className="bg-slate-600 hover:bg-slate-500 py-3 rounded-xl font-semibold"
          >
            🏠 Home
          </button>

          {bookingData.status === "CONFIRMED" && (
  <button
    onClick={() =>
      router.push(
        `/amendment?bookingId=${encodeURIComponent(
          String(bookingData.id)
        )}`
      )
    }
    className="bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-semibold"
  >
    ✏️ Amend Booking
  </button>
)}

        </div>

             </div>

      </div>

    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}