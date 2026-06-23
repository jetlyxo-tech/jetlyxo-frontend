"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createOrder,
  getBookingById,
  verifyPayment,
} from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/* =========================
   PAYMENT CONTENT
========================= */
function PaymentPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const bookingId = params.get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  /* =========================
     LOAD BOOKING
  ========================= */
  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        const res = await getBookingById(Number(bookingId));
        setBooking(res?.data || res || null);
      } catch (error) {
        console.error("Failed to load booking:", error);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  /* =========================
     JOURNEY LABEL
  ========================= */
  const journeyLabel = useMemo(() => {
    if (!booking) return "Travel Booking";

    if (booking.flight?.airline) return booking.flight.airline;
    if (booking.bus?.busName) return booking.bus.busName;
    if (booking.train?.trainName) return booking.train.trainName;

    return `${booking.bookingType || "Travel"} Booking`;
  }, [booking]);

  /* =========================
     HANDLE PAYMENT
  ========================= */
  const handlePayment = async () => {
    if (!bookingId || processing) return;

    try {
      setProcessing(true);

      /* Create Razorpay Order */
      const orderResponse = await createOrder(
        Number(bookingId)
      );

      const order =
        orderResponse?.order ||
        orderResponse?.data?.order ||
        orderResponse;

      if (!order?.id) {
        throw new Error("Order creation failed");
      }

      if (!window.Razorpay) {
        throw new Error(
          "Payment gateway not loaded. Refresh page."
        );
      }

      const razorpay = new window.Razorpay({
        key:
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "rzp_test_SaDtavZFKoFDmK",

        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id,

        name: "JetlyXO",
        description: `Booking #${bookingId}`,

        prefill: {
          name:
            booking?.passengerName || "Guest User",
          email: booking?.email || "",
          contact: booking?.phone || "",
        },

        notes: {
          bookingId,
        },

        modal: {
          escape: true,
          backdropclose: false,
          ondismiss: () => {
            setProcessing(false);
          },
        },

        theme: {
          color: "#2563eb",
        },

        handler: async (response: any) => {
          try {
            await verifyPayment({
              ...response,
              bookingId: Number(bookingId),
            });

            router.push(
              `/ticket?bookingId=${bookingId}`
            );
          } catch (error: any) {
            console.error(error);

            alert(
              error?.response?.data?.message ||
                "Payment verification failed"
            );

            setProcessing(false);
          }
        },
      });

      razorpay.open();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Payment failed"
      );

      setProcessing(false);
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-lg animate-pulse">
          Loading payment...
        </div>
      </div>
    );
  }

  /* =========================
     NOT FOUND
  ========================= */
  if (!bookingId || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-lg">
        Booking not found
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">

        {/* Header */}
        <div className="mb-6">
          <p className="text-blue-400 text-sm">
            Secure Checkout
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Complete Payment
          </h1>
        </div>

        {/* Booking Card */}
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4 space-y-3 text-sm sm:text-base">

          <Row
            label="Booking ID"
            value={booking.id}
          />

          <Row
            label="Journey"
            value={journeyLabel}
          />

          <Row
            label="Passenger"
            value={
              booking.passengerName || "Guest"
            }
          />

          <Row
            label="Status"
            value={booking.status}
          />

          <div className="flex justify-between pt-3 border-t border-white/10 text-lg font-semibold">
            <span>Amount</span>
            <span>
              ₹{booking.totalPrice}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-3">

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition disabled:opacity-60"
          >
            {processing
              ? "Opening payment..."
              : "Pay with Razorpay"}
          </button>

          <button
            onClick={() =>
              router.push("/my-bookings")
            }
            disabled={processing}
            className="w-full border border-white/15 py-3 rounded-xl hover:bg-white/5 text-white/80"
          >
            Back to bookings
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================
   REUSABLE ROW
========================= */
function Row({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/60">
        {label}
      </span>

      <span className="font-medium text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

/* =========================
   MAIN EXPORT
========================= */
export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          Loading payment...
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}