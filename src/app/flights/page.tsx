"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { searchFlights } from "@/lib/api";

export default function FlightsPage() {

  const router = useRouter();

  const [from, setFrom] =
    useState("BLR");

  const [to, setTo] =
    useState("DEL");

  const [date, setDate] =
    useState("2026-05-20");

  const [results, setResults] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const handleSearch = async () => {

    try {

      setLoading(true);

      const data =
        await searchFlights({
          from,
          to,
          date,
        });

      console.log("FLIGHTS:", data);

      setResults(data);

    } catch (e) {

      console.error(e);

      alert("Search failed");

    } finally {

      setLoading(false);
    }
  };

  async function handleBook(f: any) {

    const token =
      localStorage.getItem("jetly_token");

    if (!token) {

      alert("Please login first");

      router.push("/login");

      return;
    }

    router.push(
      `/flight-passenger?flightId=${f.id}` +
      `&price=${encodeURIComponent(f.price)}` +
      `&airline=${encodeURIComponent(f.airline)}` +
      `&duration=${encodeURIComponent(f.duration || "")}`
    );
  }

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Search Flights
      </h1>

      {/* SEARCH BAR */}

      <div className="flex flex-wrap gap-3 mb-6">

        <input
          value={from}
          onChange={(e) =>
            setFrom(
              e.target.value.toUpperCase()
            )
          }
          placeholder="From (BLR)"
          className="bg-slate-800 p-3 rounded-lg"
        />

        <input
          value={to}
          onChange={(e) =>
            setTo(
              e.target.value.toUpperCase()
            )
          }
          placeholder="To (DEL)"
          className="bg-slate-800 p-3 rounded-lg"
        />

        <input
          value={date}
          onChange={(e) =>
            setDate(e.target.value)
          }
          type="date"
          className="bg-slate-800 p-3 rounded-lg"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg"
        >
          {loading
            ? "Searching..."
            : "Search"}
        </button>
      </div>

      {/* RESULTS */}

      <div className="space-y-4">

        {results.map((f) => (

          <div
            key={f.id}
            className="border border-slate-700 bg-slate-800 p-5 rounded-xl"
          >

            <p className="text-xl font-semibold">
              {f.airline}
            </p>

            <p className="text-slate-300">
              {f.from} → {f.to}
            </p>

            <p className="text-slate-400">
              Departure:
              {" "}
              {f.departure || "N/A"}
            </p>

            <p className="text-slate-400">
              Duration:
              {" "}
              {f.duration || "N/A"}
            </p>

            <p className="text-2xl font-bold mt-2">
              ₹{f.price}
            </p>

            <button
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg mt-4"
              onClick={() =>
                handleBook(f)
              }
            >
              Book Flight
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}