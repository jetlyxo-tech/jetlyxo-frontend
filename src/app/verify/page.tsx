"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyTicket } from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
} from "lucide-react";

export default function VerifyPage() {
  const params = useParams();
  const pnr = params.pnr as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await verifyTicket(pnr);
        setData(res.booking || res.data?.booking || res);
      } catch {
        setFound(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pnr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-lg">
        Verifying Ticket...
      </div>
    );
  }

  if (!found || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={52} />
          <h1 className="text-2xl font-bold mb-2">Invalid Ticket</h1>
          <p className="text-slate-600">
            This QR code does not match any Jetly booking.
          </p>
        </div>
      </div>
    );
  }

  const status = String(data.status || "").toUpperCase();

  const getStatusUI = () => {
    if (status === "CONFIRMED") {
      return {
        icon: <CheckCircle2 size={52} className="text-green-600" />,
        title: "Verified Ticket",
        color: "text-green-600",
      };
    }

    if (status === "CANCELLED") {
      return {
        icon: <XCircle size={52} className="text-red-600" />,
        title: "Cancelled Ticket",
        color: "text-red-600",
      };
    }

    if (status === "USED") {
      return {
        icon: <Clock3 size={52} className="text-yellow-500" />,
        title: "Already Used",
        color: "text-yellow-600",
      };
    }

    return {
      icon: <AlertTriangle size={52} className="text-orange-500" />,
      title: "Pending Ticket",
      color: "text-orange-600",
    };
  };

  const ui = getStatusUI();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">{ui.icon}</div>

          <h1 className={`text-3xl font-bold ${ui.color}`}>
            {ui.title}
          </h1>
        </div>

        <div className="space-y-3 text-slate-800">

          <div className="flex justify-between border-b pb-2">
            <span>PNR</span>
            <b>{data.pnr}</b>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Passenger</span>
            <b>{data.passengerName}</b>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Type</span>
            <b>{data.bookingType}</b>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Status</span>
            <b>{status}</b>
          </div>

          <div className="flex justify-between">
            <span>Fare</span>
            <b>₹{data.totalPrice}</b>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Verified by Jetly Secure Ticket System
        </div>
      </div>
    </div>
  );
}