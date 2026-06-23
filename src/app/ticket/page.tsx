"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getBookingById } from "@/lib/api";
import {
  Bus,
  Plane,
  Train,
  Download,
  Ticket,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

type Booking = {
  id: number;
  pnr: string;
  passengerName: string;
  bookingType: "BUS" | "TRAIN" | "FLIGHT";
  totalPrice: number;
  status: string;
};

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
        setBooking(res.data);
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

    const doc = new jsPDF("p", "mm", "a4");

    // Background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, "F");

    // Main card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 10, 190, 270, 6, 6, "F");

    // Header
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(10, 10, 190, 42, 6, 6, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("JETLY E-TICKET", 18, 25);

    doc.setFontSize(11);
    doc.text("Travel smarter. Travel faster.", 18, 33);

    doc.setFontSize(10);
    doc.text(`PNR: ${booking.pnr}`, 150, 24);
    doc.text("STATUS: CONFIRMED", 135, 33);

    // Reset text
    doc.setTextColor(0, 0, 0);

    // Passenger
    doc.setFontSize(11);
    doc.text("Passenger Name", 18, 65);

    doc.setFontSize(18);
    doc.text(booking.passengerName, 18, 74);

    // Journey
    doc.setFontSize(11);
    doc.text("Journey", 18, 92);

    doc.setFontSize(16);
    doc.text("Bangalore", 18, 102);
    doc.text("Chennai", 140, 102);

    doc.setFontSize(12);
    doc.text("BLR", 18, 109);
    doc.text("MAA", 140, 109);

    doc.line(70, 100, 135, 100);
    doc.text(">", 102, 99);

    // Details box
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(18, 120, 174, 55, 4, 4);

    doc.setFontSize(11);
    doc.text("Booking ID", 24, 132);
    doc.text(String(booking.id), 24, 140);

    doc.text("Type", 80, 132);
    doc.text(booking.bookingType, 80, 140);

    doc.text("Fare", 140, 132);
    doc.text(`Rs. ${booking.totalPrice}`, 140, 140);

    doc.text("Seat", 24, 158);
    doc.text("A1", 24, 166);

    doc.text("Date", 80, 158);
    doc.text("21 Apr 2026", 80, 166);

    doc.text("Time", 140, 158);
    doc.text("09:30 PM", 140, 166);

    // QR Code
    /*const qr = await QRCode.toDataURL(
      `JETLY|PNR:${booking.pnr}|BOOKING:${booking.id}`
    );*/
   

    const verifyUrl = `${window.location.origin}/verify/${booking.pnr}`;

const qr = await QRCode.toDataURL(verifyUrl, {
  width: 300,
  margin: 2,
  errorCorrectionLevel: "H",
});
doc.addImage(qr, "PNG", 65, 188, 80, 80);

    doc.setFontSize(10);
    doc.text("Scan to verify ticket", 78, 267);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Please carry valid ID proof during travel.", 18, 285);

    doc.save(`Jetly_Ticket_${booking.id}.pdf`);
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
              <p className="font-bold text-xl">{booking.pnr}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 text-slate-800 space-y-6">

          {/* Route */}
          <div className="rounded-2xl bg-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">From</p>
                <p className="text-2xl font-bold">Bangalore</p>
                <p className="text-sm text-slate-500">BLR</p>
              </div>

              <ArrowRight className="text-blue-600" />

              <div className="text-right">
                <p className="text-sm text-slate-500">To</p>
                <p className="text-2xl font-bold">Chennai</p>
                <p className="text-sm text-slate-500">MAA</p>
              </div>
            </div>
          </div>

          {/* Passenger */}
          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Passenger</p>
              <p className="font-bold text-lg">{booking.passengerName}</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Booking ID</p>
              <p className="font-bold text-lg">{booking.id}</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Seat</p>
              <p className="font-bold text-lg">A1</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Fare</p>
              <p className="font-bold text-lg text-green-600">
                ₹{booking.totalPrice}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Date</p>
              <p className="font-bold text-lg">21 Apr 2026</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Time</p>
              <p className="font-bold text-lg">09:30 PM</p>
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