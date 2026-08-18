"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  getBookingById,
  downloadBookingTicket,
} from "@/lib/api";
import type { Booking } from "@/types";
import {
  Bus,
  Plane,
  Train,
  Download,
  Ticket,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";



function TicketPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    const loadBooking = async () => {
      try {
        const res = await getBookingById(Number(bookingId));
        setBooking(res);
      } catch (error) {
        router.push("/my-bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, router]);

  const getTypeIcon = () => {
    if (!booking) return <Ticket size={22} />;

    switch (booking.bookingType) {
  case "BUS":
    return <Bus size={22} />;

  case "TRAIN":
    return <Train size={22} />;

  case "FLIGHT":
    return <Plane size={22} />;

  default:
    return <Ticket size={22} />;
}
  };

 const downloadTicket = async () => {
  if (!booking) return;

  try {
    const blob =
      await downloadBookingTicket(booking.id);

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `JetlyXO_Ticket_${booking.pnr || booking.id}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(
      "Ticket download failed:",
      error
    );

    alert(
      "Unable to download ticket. Please try again."
    );
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-lg">
        Loading ticket...
      </div>
    );
  }

  if (!booking || booking.status !== "CONFIRMED") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-xl">Booking not confirmed</p>

        <button
          onClick={() => router.push("/my-bookings")}
          className="px-5 py-3 rounded-xl bg-blue-600"
        >
          My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl overflow-hidden bg-white shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                {getTypeIcon()}
                <span>Jetly Confirmed Ticket</span>
              </div>

              <h1 className="text-3xl font-bold mt-2">
                {booking.bookingType}
              </h1>

              <div className="flex items-center gap-2 mt-3 text-sm">
                <CheckCircle2 size={18} />
                Confirmed Booking
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm opacity-80">PNR</p>
              <p className="font-bold text-xl">{booking.pnr ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 text-slate-800 space-y-6">

{/* Route */}
<div className="rounded-2xl bg-slate-100 p-5">
  <div className="flex items-center justify-between">

    {/* FROM */}
    <div>
      <p className="text-sm text-slate-500">
        From
      </p>

      <p className="text-2xl font-bold">
        {booking.flightData?.orgcty || "—"}
      </p>

      <p className="text-sm text-slate-500">
        {booking.flightData?.orgapc || "—"}
      </p>
    </div>

    <ArrowRight className="text-blue-600" />

    {/* TO */}
    <div className="text-right">
      <p className="text-sm text-slate-500">
        To
      </p>

      <p className="text-2xl font-bold">
        {booking.flightData?.dstcty || "—"}
      </p>

      <p className="text-sm text-slate-500">
        {booking.flightData?.dstapc || "—"}
      </p>
    </div>

  </div>
</div>

     {/* Passenger / Flight Details */}
<div className="grid grid-cols-2 gap-4">

  <div className="rounded-2xl border p-4">
    <p className="text-sm text-slate-500">
      Passenger
    </p>

    <p className="font-bold text-lg">
      {booking.passengerName || "—"}
    </p>
  </div>

  <div className="rounded-2xl border p-4">
    <p className="text-sm text-slate-500">
      Booking ID
    </p>

    <p className="font-bold text-lg">
      {booking.id}
    </p>
  </div>

  <div className="rounded-2xl border p-4">
    <p className="text-sm text-slate-500">
      Seat
    </p>

    <p className="font-bold text-lg">
      {booking.flightData?.mbg?.find(
        (item) => item.ssr_type === "SeatDynamic"
      )?.ssr_info || "—"}
    </p>
  </div>

  <div className="rounded-2xl border p-4">
    <p className="text-sm text-slate-500">
      Fare
    </p>

    <p className="font-bold text-lg text-green-600">
      ₹{Number(booking.totalPrice).toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl border p-4">
    <p className="text-sm text-slate-500">
      Date
    </p>

    <p className="font-bold text-lg">
      {booking.flightData?.dptm
        ? new Date(
            booking.flightData.dptm
          ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—"}
    </p>
  </div>

  <div className="rounded-2xl border p-4">
    <p className="text-sm text-slate-500">
      Time
    </p>

    <p className="font-bold text-lg">
      {booking.flightData?.dptm
        ? new Date(
            booking.flightData.dptm
          ).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—"}
    </p>
  </div>

</div>

          {/* Dashed Divider */}
          <div className="border-t-2 border-dashed" />

          {/* Actions */}
          <div className="space-y-3">

            <button
              onClick={downloadTicket}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download PDF Ticket
            </button>

            <button
              onClick={() => router.push("/my-bookings")}
              className="w-full border py-3 rounded-2xl font-semibold"
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketPageContent />
    </Suspense>
  );
}