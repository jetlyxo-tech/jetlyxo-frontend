"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBookings, type Booking } from "@/lib/api";

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await fetchBookings();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load payment history", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const paidBookings = useMemo(
    () => payments.filter((booking) => booking.status === "CONFIRMED" || booking.status === "CANCELLED"),
    [payments]
  );

  if (loading) {
    return <p className="text-white/60">Loading payment history...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Payment History</h2>

      {paidBookings.length === 0 && <p className="text-white/60">No payments yet.</p>}

      {paidBookings.map((payment) => (
        <div
          key={payment.id}
          className="bg-slate-800 p-5 rounded-xl border border-white/10 flex justify-between items-center"
        >
          <div>
            <p className="text-white font-semibold">Payment #{payment.id}</p>
            <p className="text-sm text-white/60">
              {payment.bookingType} at {new Date(payment.createdAt).toLocaleString()}
            </p>
            <p className={`text-sm ${payment.status === "CANCELLED" ? "text-yellow-400" : "text-green-400"}`}>
              {payment.status}
            </p>
          </div>

          <p className="text-xl font-bold text-white">INR {payment.totalPrice}</p>
        </div>
      ))}
    </div>
  );
}
