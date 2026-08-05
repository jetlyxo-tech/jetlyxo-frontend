"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


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

  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingDetails");
  
    console.log("SESSION STORAGE:");
    console.log(data);
  
    if (!data) {
      router.push("/");
      return;
    }
  
    const parsed = JSON.parse(data);
  
    console.log("BOOKING OBJECT:");
    console.log(parsed);
    console.log(JSON.stringify(parsed, null, 2));
  
    setBooking(parsed);
  }, [router]);

  if (!booking) {
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xl">
        Loading Booking...
      </div>
    );
  }
  const bookingData = booking.data?.[0];

if (!bookingData) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Booking data not found.
    </div>
  );
}

  /* ==========================
     Extract fields safely
  ========================== */

  const bookingCode =
  bookingData.brn ||
  bookingData.invno ||
  "-";

  const pnr =
  bookingData.pnr ||
  bookingData.gdsPnr ||
  "-";

  const passenger =
  bookingData.trv?.[0]?.name ||
  "-";

  const airline =
  bookingData.segs?.[0]?.airnm ||
  "-";

  const flightNumber =
  `${bookingData.segs?.[0]?.aircd || ""}-${bookingData.segs?.[0]?.fltno || ""}`;

    const origin =
    bookingData.segs?.[0]?.orgcty ||
    bookingData.org ||
    "-";

    const destination =
    bookingData.segs?.[0]?.dstcty ||
    bookingData.dst ||
    "-";
    const departure =
    bookingData.segs?.[0]?.dptm ||
    "-";

    const arrival =
    bookingData.segs?.[0]?.artm ||
    "-";

    const seat =
    bookingData.mbg?.[0]?.ssr_info ||
    "Not Selected";

    const meal =
    bookingData.mbg?.find(
      (x: any) => x.ssr_type === "Meal"
    )?.ssr_info || "No Meal";

    const fare =
    bookingData.prcd?.np || 0;

    const status =
    bookingData.status || "Confirmed";

    const ticketUrl =
  bookingData.pdfUrl ??
  bookingData.ticketUrl ??
  bookingData.eTicketUrl ??
  bookingData.pdf ??
  bookingData.ticket ??
  "";

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
  {bookingData.segs?.[0]?.orgapc}
  <span className="mx-4">✈</span>
  {bookingData.segs?.[0]?.dstapc}
</h2>

<p className="text-gray-300 mt-2">
  {bookingData.segs?.[0]?.orgcty} → {bookingData.segs?.[0]?.dstcty}
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
        {bookingData.trv?.[0]?.pxt}
      </div>
      <div className="text-sm text-gray-300">
        Cabin: {bookingData.trv?.[0]?.cbbg}
      </div>
      <div className="text-sm text-gray-300">
        Check-in: {bookingData.trv?.[0]?.chbg}
      </div>
    </>
  }
/>


<Card
  title="Flight"
  value={
    <>
      <div>{airline} {flightNumber}</div>
      <div className="text-sm text-gray-300 mt-1">
        {bookingData.segs?.[0]?.cbcls}
      </div>
      <div className="text-sm text-gray-300">
        {bookingData.segs?.[0]?.dur}
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
      <div>Base Fare : ₹{bookingData.prcd?.bfr}</div>
      <div>Taxes : ₹{bookingData.prcd?.txf}</div>
      <hr className="my-2 border-slate-500" />
      <div className="font-bold">
        Total : ₹{bookingData.prcd?.np}
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
              disabled={!ticketUrl}
              onClick={() =>
                window.open(ticketUrl, "_blank")
              }
              className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              📄 Download Ticket
            </button>

            <button
              onClick={() =>
                router.push("/my-bookings")
              }
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
            <button
  onClick={() =>
    router.push(`/amendment?bookingCode=${bookingCode}`)
  }
  className="bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-semibold"
>
  ✏️ Amend Booking
</button>

            

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