"use client";

import { useState } from "react";
import {
  MapPin,
  CalendarDays,
  Users,
  ArrowRightLeft,
  Search,
} from "lucide-react";

import { searchI2SpaceBuses } from "@/lib/api";
import type { Bus } from "@/types/bus";

type Props = {
  onResults: (results: Bus[]) => void;
  onScrollToResults?: () => void;
};

export default function BusSearchWidget({
  onResults,
  onScrollToResults,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState(today);

  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const swapLocations = () => {
    const currentFrom = from;
    setFrom(to);
    setTo(currentFrom);
  };

  const setQuickDate = (days: number) => {
    const date = new Date();

    date.setDate(date.getDate() + days);

    setDeparture(date.toISOString().split("T")[0]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!from.trim()) {
      setError("Please enter your departure city.");
      return;
    }

    if (!to.trim()) {
      setError("Please enter your destination city.");
      return;
    }

    if (!departure) {
      setError("Please select your journey date.");
      return;
    }

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setError("Departure and destination cities cannot be the same.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const results = await searchI2SpaceBuses({
        from: from.trim(),
        to: to.trim(),
        date: departure,
      });

      onResults(results);

      if (results.length === 0) {
        setError(`No buses found from ${from} to ${to}.`);
      }

      onScrollToResults?.();
    } catch (err: any) {
      console.error("Bus search failed:", err);

      setError(
        err?.message || "Unable to search buses. Please try again."
      );

      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative mt-8 px-4 pb-12">
      <div className="mx-auto max-w-7xl">
        <div
          className="
            relative
            overflow-visible
            rounded-3xl
            border border-slate-700/60
            bg-slate-950/95
            shadow-[0_25px_80px_rgba(0,0,0,0.35)]
          "
        >
          {/* HEADER */}
          <div className="px-5 pt-6 md:px-7 md:pt-7 lg:px-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Search Buses
              </h2>

              <p className="text-sm text-slate-400">
                Search, compare and book buses at the best prices.
              </p>
            </div>
          </div>

          {/* SEARCH AREA */}
          <form
            onSubmit={handleSearch}
            className="px-5 pb-6 pt-5 md:px-7 md:pb-7 lg:px-8"
          >
            <div
              className="
                rounded-2xl
                border border-slate-700/70
                bg-slate-900/80
                p-2
                shadow-inner
              "
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">

                {/* FROM */}
                <div className="relative min-w-0 flex-[1.3]">
                  <div
                    className="
                      group relative
                      h-[78px]
                      rounded-xl
                      border border-slate-700
                      bg-slate-800/80
                      px-4 py-3
                      transition
                      hover:border-slate-600
                      focus-within:border-blue-500
                      focus-within:ring-2
                      focus-within:ring-blue-500/20
                    "
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      From
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <MapPin
                        size={17}
                        className="shrink-0 text-blue-400"
                      />

                      <input
                        value={from}
                        onChange={(e) => {
                          setFrom(e.target.value);
                          setError("");
                        }}
                        placeholder="Departure city"
                        className="
                          min-w-0
                          w-full
                          bg-transparent
                          text-base
                          font-semibold
                          text-white
                          outline-none
                          placeholder:text-sm
                          placeholder:font-normal
                          placeholder:text-slate-500
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* SWAP */}
                <div className="relative flex items-center justify-center lg:w-0">
                  <button
                    type="button"
                    onClick={swapLocations}
                    className="
                      z-20
                      flex h-10 w-10
                      items-center justify-center
                      rounded-full
                      border border-slate-300
                      bg-white
                      text-slate-800
                      shadow-lg
                      transition
                      hover:scale-105
                    "
                    aria-label="Swap departure and destination"
                  >
                    <ArrowRightLeft size={17} />
                  </button>
                </div>

                {/* TO */}
                <div className="relative min-w-0 flex-[1.3]">
                  <div
                    className="
                      group relative
                      h-[78px]
                      rounded-xl
                      border border-slate-700
                      bg-slate-800/80
                      px-4 py-3
                      transition
                      hover:border-slate-600
                      focus-within:border-blue-500
                      focus-within:ring-2
                      focus-within:ring-blue-500/20
                    "
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      To
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <MapPin
                        size={17}
                        className="shrink-0 text-indigo-400"
                      />

                      <input
                        value={to}
                        onChange={(e) => {
                          setTo(e.target.value);
                          setError("");
                        }}
                        placeholder="Destination city"
                        className="
                          min-w-0
                          w-full
                          bg-transparent
                          text-base
                          font-semibold
                          text-white
                          outline-none
                          placeholder:text-sm
                          placeholder:font-normal
                          placeholder:text-slate-500
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* DATE */}
                <div className="min-w-0 flex-[0.9]">
                  <label
                    className="
                      flex
                      h-[78px]
                      cursor-pointer
                      flex-col
                      justify-center
                      rounded-xl
                      border border-slate-700
                      bg-slate-800/80
                      px-4
                      transition
                      hover:border-slate-600
                      focus-within:border-blue-500
                      focus-within:ring-2
                      focus-within:ring-blue-500/20
                    "
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Journey Date
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <CalendarDays
                        size={17}
                        className="shrink-0 text-blue-400"
                      />

                      <input
                        type="date"
                        value={departure}
                        min={today}
                        onChange={(e) => setDeparture(e.target.value)}
                        className="
                          min-w-0
                          w-full
                          bg-transparent
                          text-sm
                          font-semibold
                          text-white
                          outline-none
                          [color-scheme:dark]
                        "
                      />
                    </div>
                  </label>
                </div>

                {/* PASSENGERS */}
                <div className="min-w-0 flex-[0.8]">
                  <div
                    className="
                      flex
                      h-[78px]
                      flex-col
                      justify-center
                      rounded-xl
                      border border-slate-700
                      bg-slate-800/80
                      px-4
                    "
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Passengers
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <Users
                        size={17}
                        className="shrink-0 text-blue-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setPassengers(Math.max(1, passengers - 1))
                        }
                        className="h-7 w-7 rounded-full border border-slate-600 text-white hover:border-blue-500"
                      >
                        −
                      </button>

                      <span className="w-5 text-center text-sm font-semibold text-white">
                        {passengers}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setPassengers(Math.min(10, passengers + 1))
                        }
                        className="h-7 w-7 rounded-full border border-slate-600 text-white hover:border-blue-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* SEARCH BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    flex
                    h-[78px]
                    min-w-[150px]
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-gradient-to-r
                    from-blue-600
                    via-indigo-600
                    to-violet-600
                    px-6
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    shadow-blue-900/30
                    transition
                    hover:shadow-blue-500/20
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <Search size={19} />

                  <span>
                    {loading ? "Searching..." : "Search Buses"}
                  </span>
                </button>
              </div>

              {/* QUICK DATES */}
              <div className="mt-3 flex flex-wrap items-center gap-2 px-2">
                <span className="mr-1 text-xs font-medium text-slate-500">
                  Quick date:
                </span>

                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-white"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-white"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-400">
                {error}
              </div>
            )}

            {/* BUS FEATURES */}
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 p-4">
                <p className="text-sm font-semibold text-white">
                  Live Bus Availability
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Check real-time seats and fares.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 p-4">
                <p className="text-sm font-semibold text-white">
                  Multiple Operators
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Compare buses in one place.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 p-4">
                <p className="text-sm font-semibold text-white">
                  Easy Booking
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Select your bus and continue.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}