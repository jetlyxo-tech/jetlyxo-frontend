"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  CalendarDays,
  Users,
  Briefcase,
  ArrowRightLeft,
  Search,
  X,
} from "lucide-react";

import { searchFlights } from "@/lib/api";
import type { Flight } from "@/types";

type Tab = "one-way" | "round-trip" | "multi-city";

const TABS = [
  { id: "one-way", label: "One Way" },
  { id: "round-trip", label: "Round Trip" },
  { id: "multi-city", label: "Multi City" },
] as const;

type Props = {
  onFlightResults?: (results: Flight[]) => void;
  onScrollToResults?: () => void;
  onFlightResultsAction?: (results: Flight[]) => void;
  onScrollToResultsAction?: () => void;
};

export default function SearchWidget({
  onFlightResults,
  onScrollToResults,
  onFlightResultsAction,
  onScrollToResultsAction,
}: Props) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api";

  const [activeTab, setActiveTab] =
    useState<Tab>("one-way");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [travellers, setTravellers] = useState(1);
  const [cabin, setCabin] = useState("economy");

  const [selectedFare, setSelectedFare] =
    useState("Regular");

  const publish = (results: Flight[]) => {
    onFlightResults?.(results);
    onFlightResultsAction?.(results);
  };

  const scroll = () => {
    onScrollToResults?.();
    onScrollToResultsAction?.();
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );

          const j = await r.json();

          setFrom(
            j.address?.city ||
              j.address?.town ||
              j.address?.state ||
              ""
          );
        } catch {}
      }
    );
  }, []);

  async function handleSearch(
    e?: React.FormEvent
  ) {
    e?.preventDefault();

    setLoading(true);
    setError("");

    try {
      fetch(`${API_BASE}/behavior/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "SEARCH",
          metadata: {
            from,
            to,
          },
        }),
      }).catch(() => {});

      const params = {
        from,
        to,
        departureDate: departure,
        travellers,
        children: 0,
        infants: 0,
        cabin,
        fareType: selectedFare,
        tripType:
          activeTab === "one-way"
            ? "ONE_WAY"
            : "ROUND_TRIP",
      };

      const results = await searchFlights(
        params as any
      );

      publish(results);

      if (results.length === 0) {
        setError("No flights found.");
      }

      scroll();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-10 px-4">

      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .5 }}
          className="
          rounded-3xl
          border
          border-slate-700/40
          bg-slate-900/70
          backdrop-blur-xl
          shadow-2xl
          p-6
          md:p-8
          lg:p-10
        "
        >

          <div className="mb-8">

            <h2 className="text-3xl font-bold text-white">
              Find Your Perfect Flight
            </h2>

            <p className="text-slate-400 mt-2">
              Search, compare and book flights at
              the best prices.
            </p>

          </div>

          <div className="inline-flex bg-slate-800 rounded-xl p-1 mb-8">

            {TABS.map((tab) => (

              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`px-6 py-3 rounded-lg font-medium transition-all

                ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>

            ))}

          </div>

          <form
  onSubmit={handleSearch}
  className="
    grid
    grid-cols-1
    md:grid-cols-2
    lg:grid-cols-12
    gap-6
  "
>

            {/* FROM */}
              <div className="relative lg:col-span-6">

              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">

                From

              </label>

              <MapPin
                size={18}
                className="absolute left-4 top-[52px] text-slate-400"
              />

              <input
                value={from}
                onChange={(e) =>
                  setFrom(e.target.value)
                }
                placeholder="City or Airport"
                className="
                w-full
                h-16
                pl-12
                pr-12
                rounded-2xl
                bg-slate-800/70
                border
                border-slate-700
                text-white
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/20
                transition
              "
              />

              {from && (

                <button
                  type="button"
                  onClick={() => setFrom("")}
                  className="absolute right-4 top-[50px] text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>

              )}

            </div>
            {/* TO */}

            <div className="relative lg:col-span-6">

              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                To
              </label>

              <MapPin
                size={18}
                className="absolute left-4 top-[52px] text-slate-400"
              />

              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="City or Airport"
                className="
                  w-full
                  h-16
                  pl-12
                  pr-12
                  rounded-2xl
                  bg-slate-800/70
                  border
                  border-slate-700
                  text-white
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-500/20
                  transition
                "
              />

              {to && (
                <button
                  type="button"
                  onClick={() => setTo("")}
                  className="absolute right-4 top-[50px] text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}

            </div>

            {/* SWAP */}

            <div className="lg:col-span-4 flex justify-center -mt-2 -mb-2">

              <motion.button
                whileHover={{ rotate: 180, scale: 1.08 }}
                whileTap={{ scale: .95 }}
                type="button"
                onClick={() => {
                  const temp = from;
                  setFrom(to);
                  setTo(temp);
                }}
                className="
                  w-14
                  h-14
                  rounded-full
                  bg-white
                  text-slate-800
                  shadow-xl
                  flex
                  items-center
                  justify-center
                "
              >
                <ArrowRightLeft size={20} />
              </motion.button>

            </div>

            {/* DEPARTURE */}

            <div className="lg:col-span-3">

              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
                Departure
              </label>

              <div className="relative">

                <CalendarDays
                  size={18}
                  className="absolute left-4 top-5 text-slate-400"
                />

                <input
                  type="date"
                  value={departure}
                  onChange={(e) =>
                    setDeparture(e.target.value)
                  }
                  className="
                    w-full
                    h-16
                    pl-12
                    rounded-2xl
                    bg-slate-800/70
                    border
                    border-slate-700
                    text-white
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-500/20
                  "
                />

              </div>

            </div>

           

     {/* RETURN */}

{activeTab !== "one-way" && (

  <div className="lg:col-span-3">

    <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
      Return
    </label>

    <div className="relative">

      <CalendarDays
        size={18}
        className="absolute left-4 top-5 text-slate-400"
      />

      <input
        type="date"
        value={returnDate}
        onChange={(e) => setReturnDate(e.target.value)}
        className="
          w-full
          h-16
          pl-12
          rounded-2xl
          bg-slate-800/70
          border
          border-slate-700
          text-white
          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-500/20
        "
      />

    </div>

  </div>

)}

            

         {/* TRAVELLERS */}

<div className="lg:col-span-3">

  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
    Travellers
  </label>

  <div className="relative">

    <Users
      size={18}
      className="absolute left-4 top-5 text-slate-400"
    />

    <select
      value={travellers}
      onChange={(e) => setTravellers(Number(e.target.value))}
      className="
        w-full
        h-16
        pl-12
        rounded-2xl
        bg-slate-800/70
        border
        border-slate-700
        text-white
      "
    >
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <option key={n} value={n}>
          {n} Traveller{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>

  </div>

</div>
            {/* CABIN */}

<div className="lg:col-span-3">

  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
    Cabin
  </label>

  <div className="relative">

    <Briefcase
      size={18}
      className="absolute left-4 top-5 text-slate-400"
    />

    <select
      value={cabin}
      onChange={(e) => setCabin(e.target.value)}
      className="
        w-full
        h-16
        pl-12
        rounded-2xl
        bg-slate-800/70
        border
        border-slate-700
        text-white
      "
    >
      <option value="economy">Economy</option>
      <option value="premium">Premium Economy</option>
      <option value="business">Business</option>
      <option value="first">First Class</option>
    </select>

  </div>

</div>

{/* FARE */}

<div className="lg:col-span-12">

  <label className="block text-xs uppercase tracking-widest text-slate-400 mb-3">
    Fare Type
  </label>

  <div className="flex flex-wrap gap-3">

    {[
  "Regular",
  "Student",
  "Defence",
  "Business",
  "Senior",
  "Medical",
].map((fare) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    key={fare}
    type="button"
    onClick={() => setSelectedFare(fare)}
    className={
      selectedFare === fare
        ? "px-5 py-3 rounded-full bg-blue-600 text-white shadow-lg"
        : "px-5 py-3 rounded-full border border-slate-600 bg-slate-800 text-slate-300 hover:border-blue-500 hover:text-white transition"
    }
  >
    {fare}
  </motion.button>
))}

  </div>

</div>
            {/* SEARCH */}

            <motion.button
              whileHover={{ scale:1.01 }}
              whileTap={{ scale:.98 }}
              type="submit"
              disabled={loading}
              className="
                lg:col-span-12
                h-16
                rounded-2xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                text-white
                font-semibold
                text-lg
                shadow-xl
                flex
                items-center
                justify-center
                gap-3
               cursor-pointer
               disabled:opacity-60
               disabled:cursor-not-allowed
              "
            >
              <Search size={20} />

              {loading
                ? "Searching Flights..."
                : "Search Flights"}
            </motion.button>

            {error && (
              <p className="lg:col-span-12 text-center text-red-400 font-medium">
                {error}
              </p>
            )}

          </form>

        </motion.div>

      </div>

    </section>
  );
}