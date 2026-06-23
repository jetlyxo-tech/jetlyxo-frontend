"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { verifyTicket } from "@/lib/api";

export default function ScannerPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleScan = async (text: string) => {
    try {
      const parts = text.split("/");
      const pnr = parts[parts.length - 1];

      const res = await verifyTicket(pnr);
      setData(res.booking || res.data?.booking || res);
      setError("");
    } catch {
      setError("Invalid Ticket");
      setData(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Jetly QR Scanner
      </h1>

      <div className="max-w-xl mx-auto rounded-3xl overflow-hidden bg-white">
        <Scanner
          onScan={(codes) => {
            if (codes?.[0]?.rawValue) {
              handleScan(codes[0].rawValue);
            }
          }}
        />
      </div>

      {data && (
        <div className="max-w-xl mx-auto mt-6 bg-white text-black rounded-3xl p-6">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Valid Ticket ✅
          </h2>

          <p><b>PNR:</b> {data.pnr}</p>
          <p><b>Name:</b> {data.passengerName}</p>
          <p><b>Status:</b> {data.status}</p>
        </div>
      )}

      {error && (
        <div className="max-w-xl mx-auto mt-6 bg-white text-black rounded-3xl p-6">
          <h2 className="text-2xl font-bold text-red-600">
            {error}
          </h2>
        </div>
      )}
    </div>
  );
}