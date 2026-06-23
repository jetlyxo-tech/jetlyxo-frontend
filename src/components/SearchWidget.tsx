"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRightLeft, X } from "lucide-react";
import {
  searchFlights,
  type FlightSearchParams,
  type FlightResult,
} from "@/lib/api";

type Tab = "one-way" | "round-trip" | "multi-city";

const TABS: { id: Tab; label: string }[] = [
  { id: "one-way", label: "One Way" },
  { id: "round-trip", label: "Round Trip" },
  { id: "multi-city", label: "Multi City" },
];

type SearchWidgetProps = {
  onFlightResults?: (results: FlightResult[]) => void;
  onScrollToResults?: () => void;
  onFlightResultsAction?: (results: FlightResult[]) => void;
  onScrollToResultsAction?: () => void;
};

export default function SearchWidget({
  onFlightResults,
  onScrollToResults,
  onFlightResultsAction,
  onScrollToResultsAction,
}: SearchWidgetProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [activeTab, setActiveTab] = useState<Tab>("one-way");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travellers, setTravellers] = useState(1);
  const [cabin, setCabin] = useState("economy");
  const [selectedFare, setSelectedFare] = useState("Regular");

  const publishResults = (results: FlightResult[]) => {
    onFlightResults?.(results);
    onFlightResultsAction?.(results);
  };

  const scrollToResults = () => {
    onScrollToResults?.();
    onScrollToResultsAction?.();
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state;

          if (city) setFrom(city);
        } catch {
          console.log("Location fetch failed");
        }
      },
      () => {
        console.log("User denied location");
      }
    );
  }, []);

  

const handleSearch = async (event?: React.FormEvent) => {
  event?.preventDefault();

  if (isSearching) return;
  setIsSearching(true);

  setError(null);
  setLoading(true);

  try {
    // non-blocking tracking
    fetch(`${API_BASE}/api/behavior/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SEARCH",
        metadata: { from, to },
      }),
    }).catch(() => {});

    const params: FlightSearchParams = {
      from: from || undefined,
      to: to || undefined,
      departure: departure || undefined,
      return:
        activeTab !== "one-way"
          ? returnDate || undefined
          : undefined,
      travellers,
      cabin,
      fareType: selectedFare,
    };

    const results = await searchFlights(params);

    if (!results || results.length === 0) {
      publishResults([
        {
          airline: "IndiGo",
          price: 5980,
          duration: "5h 20m",
          stops: "1 stop",
          dep: "06:30",
        },
      ]);
    } else {
      publishResults(results);
    }

    scrollToResults();
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Search failed");
  }
    finally {
      setLoading(false);
      setIsSearching(false);
    }
};

  const handleUseLocation = () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.state;
      if (city) setFrom(city);
    });
  };

  return (
    <section id="search" className="py-8 md:py-12 px-4 scroll-mt-20">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          className="glass-card p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
{/* Tabs */}
<div className="flex gap-2 mb-6 overflow-x-auto pb-2">
  {TABS.map((tab) => (
    <button
      key={tab.id}
      type="button"
      onClick={() => setActiveTab(tab.id)}
      className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
        activeTab === tab.id
          ? "bg-blue-600 text-white shadow-lg"
          : "bg-white/10 text-white/70 hover:bg-white/15"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

{/* Travel Perks */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-white text-lg font-semibold">
      Travel Perks
    </h3>

    <span className="text-xs px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300">
      ✈ {selectedFare}
    </span>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {[
      {
        title: "Regular",
        icon: "✈️",
        desc: "Standard fare",
      },
      {
        title: "Student",
        icon: "🎓",
        desc: "Extra baggage",
      },
      {
        title: "Defence",
        icon: "🛡️",
        desc: "Military fares",
      },
      {
        title: "Business",
        icon: "💼",
        desc: "GST benefits",
      },
      {
        title: "Senior",
        icon: "👴",
        desc: "Special savings",
      },
      {
        title: "Medical",
        icon: "🩺",
        desc: "Healthcare offers",
      },
    ].map((fare) => (
      <button
        key={fare.title}
        type="button"
        onClick={() => setSelectedFare(fare.title)}
        className={`rounded-2xl border text-left p-3 transition-all duration-300 ${
          selectedFare === fare.title
            ? "border-blue-400 bg-gradient-to-br from-blue-600/30 to-indigo-600/20 shadow-lg shadow-blue-500/20 scale-[1.02]"
            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-400/40"
        }`}
      >
        <div className="text-xl mb-2">
          {fare.icon}
        </div>

        <div className="text-white font-medium text-sm">
          {fare.title}
        </div>

        <div className="text-xs text-gray-400 mt-1">
          {fare.desc}
        </div>
      </button>
    ))}
  </div>
</div>

{/* Search Form */}
<form
  onSubmit={handleSearch}
  className="grid grid-cols-1 md:grid-cols-2 gap-5"
>
  {/* FROM + TO */}
  <div className="md:col-span-2 relative">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* FROM */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          From
        </label>

        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Enter departure city"
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {from && (
            <button
              type="button"
              onClick={() => setFrom("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseLocation}
          className="text-xs text-blue-400 mt-2 hover:text-blue-300"
        >
          Use current location
        </button>
      </div>

      {/* TO */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          To
        </label>

        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Enter destination"
            className="w-full pl-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    {/* SWAP BUTTON */}
    <button
      type="button"
      onClick={() => {
        const temp = from;
        setFrom(to);
        setTo(temp);
      }}
      className="
      md:hidden flex justify-center mt-3
      absolute
      left-1/2
      top-[48px]
      -translate-x-1/2
      items-center
      justify-center
      w-11
      h-11
      rounded-full
      bg-slate-800
      border
      border-white/10
      text-white
      shadow-lg
      hover:scale-110
      transition
      z-20
      "
    >
      <ArrowRightLeft size={18} />
    </button>
  </div>

  {/* DEPARTURE */}
  <div>
    <label className="block text-xs text-gray-400 mb-2">
      Departure
    </label>

    <input
      type="date"
      value={departure}
      onChange={(e) => setDeparture(e.target.value)}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* RETURN */}
  {activeTab !== "one-way" && (
    <div>
      <label className="block text-xs text-gray-400 mb-2">
        Return
      </label>

      <input
        type="date"
        value={returnDate}
        onChange={(e) => setReturnDate(e.target.value)}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )}

  {/* TRAVELLERS */}
  <div>
    <label className="block text-xs text-gray-400 mb-2">
      Travellers
    </label>

    <select
      value={travellers}
      onChange={(e) => setTravellers(Number(e.target.value))}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <option key={n} value={n}>
          {n} Traveller{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>
  </div>

  {/* CABIN */}
  <div>
    <label className="block text-xs text-gray-400 mb-2">
      Cabin
    </label>

    <select
      value={cabin}
      onChange={(e) => setCabin(e.target.value)}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="economy">Economy</option>
      <option value="premium-economy">
        Premium Economy
      </option>
      <option value="business">Business</option>
      <option value="first">First Class</option>
    </select>
  </div>
</form>

{/* Search Button */}
<button
  onClick={handleSearch}
  disabled={loading}
  className="
  w-full
  mt-8
  py-4
  rounded-2xl
  text-white
  font-semibold
  text-base
  bg-gradient-to-r
  from-blue-500
  via-indigo-500
  to-purple-600
  shadow-lg
  hover:scale-[1.01]
  transition-all
  disabled:opacity-50
  "
>
  {loading ? "Searching..." : "Search Flights"}
</button>

{error && (
  <p className="text-red-400 mt-4">
    {error}
  </p>
)}
        </motion.div>
      </div>
    </section>
  );
}
