"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchWidget from "@/components/SearchWidget";
import FlightResults from "@/components/FlightResults";
import TrainResults from "@/components/TrainResults";
import BusResults from "@/components/BusResults";
import TrendingDestinations from "@/components/TrendingDestinations";
import Deals from "@/components/Deals";
import Features from "@/components/Features";
import { fetchBuses, fetchTrains, type FlightResult } from "@/lib/api";
import type { Bus as BusUI } from "@/types/bus";

import DashboardSidebar from "./components/DashboardSidebar";
import DashboardSection from "./components/DashboardSection";
import UpcomingTrips from "./components/UpcomingTrips";
import BookingHistory from "./components/BookingHistory";
import PaymentHistory from "./components/PaymentHistory";

/* =========================
   TYPES
========================= */

type SearchMode = "flights" | "trains" | "buses";

/* ✅ UI TYPE FOR TRAINS */
type TrainUI = {
  id: number;
  trainName: string;
  fromCity?: string;
  toCity?: string;
  duration?: string;
  price?: number;
  seats?: number;
};

/* =========================
   MAIN PAGE
========================= */

export default function Page() {
  const resultsRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<SearchMode>("flights");

  const [flightResults, setFlightResults] = useState<FlightResult[] | null>(null);
  const [trainResults, setTrainResults] = useState<TrainUI[] | null>(null);
  const [busResults, setBusResults] = useState<BusUI[] | null>(null);

  const [loading, setLoading] = useState<null | SearchMode>(null);

  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* =========================
     LOAD TRAINS (FIXED)
  ========================= */

  const loadTrains = useCallback(async () => {
    if (loading) return;
    setLoading("trains");

    try {
      const trains = await fetchTrains();

      const adapted: TrainUI[] = trains.map((t: any, idx: number) => ({
        id: Number(t.id ?? idx), // ✅ FIX string → number

        trainName: String(
          t.trainName ?? t.name ?? t.operator ?? "Train"
        ),

        fromCity: String(t.fromCity ?? t.from ?? "N/A"),
        toCity: String(t.toCity ?? t.to ?? "N/A"),

        duration: String(t.duration ?? ""),

        price: Number(t.price ?? 0),

        seats: t.seats != null ? Number(t.seats) : undefined,
      }));

      setTrainResults(adapted);
      setBusResults(null);
      setFlightResults(null);

      setFromFilter("");
      setToFilter("");

      scrollToResults();
    } finally {
      setLoading(null);
    }
  }, [loading, scrollToResults]);

  /* =========================
     LOAD BUSES
  ========================= */

  const loadBuses = useCallback(async () => {
    if (loading) return;
    setLoading("buses");

    try {
      const buses = await fetchBuses();

      const adapted: BusUI[] = buses.map((b: any, idx: number) => ({
        id: Number(b.id ?? idx),
        busName: String(b.busName ?? b.operator ?? "Bus"),
        fromCity: String(b.fromCity ?? b.from ?? "N/A"),
        toCity: String(b.toCity ?? b.to ?? "N/A"),
        departure: String(b.departure ?? ""),
        arrival: String(b.arrival ?? ""),
        price: Number(b.price ?? 0),
        seats: b.seats != null ? Number(b.seats) : undefined,
      }));

      setBusResults(adapted);
      setTrainResults(null);
      setFlightResults(null);

      setFromFilter("");
      setToFilter("");

      scrollToResults();
    } finally {
      setLoading(null);
    }
  }, [loading, scrollToResults]);

  /* =========================
     TABS
  ========================= */

  const searchTabs = useMemo(
    () => [
      { id: "flights" as const, label: "Flights", icon: "✈️" },
      { id: "trains" as const, label: "Trains", icon: "🚄" },
      { id: "buses" as const, label: "Buses", icon: "🚌" },
    ],
    []
  );

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-navy-950">
      <Header />

      <div className="container mx-auto px-4 pb-12">
        <div className="flex gap-6">

          <DashboardSidebar />

          <div className="flex-1 space-y-6">

            {/* HEADER */}
            <div className="glass-card p-5">
              <h1 className="text-2xl font-bold text-white">
                Dashboard
              </h1>

              <div className="flex gap-2 mt-3">
                {searchTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMode(t.id)}
                    className={`px-3 py-2 rounded ${
                      mode === t.id
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH */}
            <DashboardSection title="Search">
              {mode === "flights" ? (
                <SearchWidget
                  onFlightResults={(results) => {
                    setFlightResults(results);
                    setTrainResults(null);
                    setBusResults(null);
                  }}
                  onScrollToResults={scrollToResults}
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    placeholder="From"
                    value={fromFilter}
                    onChange={(e) => setFromFilter(e.target.value)}
                    className="p-2 rounded bg-slate-700 text-white"
                  />

                  <input
                    placeholder="To"
                    value={toFilter}
                    onChange={(e) => setToFilter(e.target.value)}
                    className="p-2 rounded bg-slate-700 text-white"
                  />

                  {mode === "trains" && (
                    <button
                      onClick={loadTrains}
                      className="bg-blue-600 px-3 py-2 rounded text-white"
                    >
                      Load Trains
                    </button>
                  )}

                  {mode === "buses" && (
                    <button
                      onClick={loadBuses}
                      className="bg-green-600 px-3 py-2 rounded text-white"
                    >
                      Load Buses
                    </button>
                  )}
                </div>
              )}
            </DashboardSection>

            {/* RESULTS */}
            <div ref={resultsRef}>

              {mode === "flights" && flightResults && (
                <FlightResults flights={flightResults} />
              )}

              {mode === "trains" && trainResults && (
                <TrainResults
                  trains={
                    fromFilter || toFilter
                      ? trainResults.filter((t) =>
                          t.fromCity?.toLowerCase().includes(fromFilter.toLowerCase()) &&
                          t.toCity?.toLowerCase().includes(toFilter.toLowerCase())
                        )
                      : trainResults
                  }
                />
              )}

              {mode === "buses" && busResults && (
                <BusResults
                  buses={
                    fromFilter || toFilter
                      ? busResults.filter((b) =>
                          b.fromCity?.toLowerCase().includes(fromFilter.toLowerCase()) &&
                          b.toCity?.toLowerCase().includes(toFilter.toLowerCase())
                        )
                      : busResults
                  }
                />
              )}

            </div>

            <UpcomingTrips />
            <BookingHistory />
            <PaymentHistory />
            <TrendingDestinations />
            <Deals />
            <Features />

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}