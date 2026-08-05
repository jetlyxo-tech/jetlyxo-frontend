"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { searchFlights } from "@/lib/api";
import { Flight } from "@/types";
import { getToken } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";

export default function FlightsPage() {
  const router = useRouter();

  const [from, setFrom] = useState("BLR");
  const [to, setTo] = useState("DEL");
  const [date, setDate] = useState("2026-05-20");

  const [results, setResults] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);

      const data = await searchFlights({
        from,
        to,
        departureDate: date,
        travellers: 1,
        children: 0,
        infants: 0,
      });

      console.log("FLIGHTS:", data);

      setResults(data);
    } catch (error) {
      console.error(error);
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (flight: Flight) => {
    const token = getToken();

    if (!token) {
      alert("Please login first");
      router.push(ROUTES.LOGIN);
      return;
    }

    router.push(
      `/flight-passenger?flightId=${flight.id}` +
        `&price=${encodeURIComponent(String(flight.price))}` +
        `&airline=${encodeURIComponent(flight.airline)}` +
        `&duration=${encodeURIComponent(flight.duration)}`
    );
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Search Flights
      </h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={from}
          onChange={(e) =>
            setFrom(e.target.value.toUpperCase())
          }
          placeholder="From (BLR)"
          className="bg-slate-800 p-3 rounded-lg"
        />

        <input
          value={to}
          onChange={(e) =>
            setTo(e.target.value.toUpperCase())
          }
          placeholder="To (DEL)"
          className="bg-slate-800 p-3 rounded-lg"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-slate-800 p-3 rounded-lg"
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-3 rounded-lg"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((flight) => (
          <div
            key={flight.id}
            className="border border-slate-700 bg-slate-800 p-5 rounded-xl"
          >
            <p className="text-xl font-semibold">
              {flight.airline}
            </p>

            <p className="text-slate-300">
              {flight.from ??
                flight.fromCity ??
                "N/A"}{" "}
              →
              {" "}
              {flight.to ??
                flight.toCity ??
                "N/A"}
            </p>

            <p className="text-slate-400">
              Departure:{" "}
              {flight.departure ?? "N/A"}
            </p>

            <p className="text-slate-400">
              Duration: {flight.duration}
            </p>

            <p className="text-2xl font-bold mt-2">
              ₹{flight.price}
            </p>

            <button
              onClick={() => handleBook(flight)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg mt-4"
            >
              Book Flight
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}