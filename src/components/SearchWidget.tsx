"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CalendarDays,
  Users,
  Briefcase,
  ArrowRightLeft,
  Search,
  X,
  ChevronDown,
  ShieldCheck,
  Zap,
  Bot,
  Headphones,
  RotateCcw,
} from "lucide-react";

import { searchFlights } from "@/lib/api";
import type { Flight } from "@/types";

type Tab = "one-way" | "round-trip" | "multi-city";

const TABS = [
  { id: "one-way", label: "One Way" },
  { id: "round-trip", label: "Round Trip" },
  { id: "multi-city", label: "Multi City" },
] as const;

type Service = "flights" | "trains" | "buses";

type Props = {
  service?: Service;

  onFlightResults?: (results: Flight[]) => void;
  onScrollToResults?: () => void;

  onFlightResultsAction?: (results: Flight[]) => void;
  onScrollToResultsAction?: () => void;
};

const FARES = [
  "Regular",
  "Student",
  "Defence",
  "Business",
  "Senior",
  "Medical",
];

const CABINS = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
];

export default function SearchWidget({
  service = "flights",
  onFlightResults,
  onScrollToResults,
  onFlightResultsAction,
  onScrollToResultsAction,
}: Props) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const [activeTab, setActiveTab] = useState<Tab>("one-way");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [travellers, setTravellers] = useState(1);
  const [cabin, setCabin] = useState("economy");

  const [selectedFare, setSelectedFare] = useState("Regular");

  const [showTravellerPanel, setShowTravellerPanel] = useState(false);

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
        } catch {
          // Ignore location lookup failures
        }
      },
      () => {
        // User denied location access
      }
    );
  }, []);

 async function handleSearch(e?: React.FormEvent) {
  e?.preventDefault();

  if (loading) return;

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
        returnDate: activeTab === "round-trip" ? returnDate : undefined,
        travellers,
        children: 0,
        infants: 0,
        cabin,
        fareType: selectedFare,
        tripType:
          activeTab === "one-way" ? "ONE_WAY" : "ROUND_TRIP",
      };

      const results = await searchFlights(params as any);

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

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const getCabinLabel = () => {
    return (
      CABINS.find((item) => item.value === cabin)?.label ||
      "Economy"
    );
  };

  const getTravellerLabel = () => {
    return `${travellers} Traveller${travellers > 1 ? "s" : ""}`;
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section
      id="search"
      className="relative mt-8 px-4 pb-12"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="
            relative
            overflow-visible
            rounded-3xl
            border border-slate-700/60
            bg-slate-950/95
            shadow-[0_25px_80px_rgba(0,0,0,0.35)]
          "
        >
          {/* =========================================================
              HEADER
          ========================================================== */}

          <div className="px-5 pt-6 md:px-7 md:pt-7 lg:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  Find Your Perfect Flight
                </h2>

                <p className="mt-1.5 text-sm text-slate-400">
                  Search, compare and book flights at the best prices.
                </p>
              </div>

              {/* Trust badge */}
              <div
                className="
                  hidden
                  md:flex
                  items-center
                  gap-2
                  rounded-full
                  border border-emerald-500/20
                  bg-emerald-500/10
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-emerald-300
                "
              >
                <ShieldCheck size={17} />
                Hassle-Free Bookings
              </div>
            </div>

            {/* =========================================================
                TRIP TYPE TABS
            ========================================================== */}

            <div className="mt-6">
              <div
                className="
                  inline-flex
                  rounded-xl
                  border border-slate-700
                  bg-slate-800/80
                  p-1
                "
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      rounded-lg
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      transition-all
                      md:px-5
                      ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                          : "text-slate-400 hover:bg-slate-700/70 hover:text-white"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================
              SEARCH AREA
          ========================================================== */}

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
              {/* =====================================================
                  MAIN SEARCH BAR
              ====================================================== */}

              <div
                className={`
                  flex
                  flex-col
                  gap-2
                  lg:flex-row
                  lg:items-stretch
                `}
              >
                {/* ===================================================
                    FROM
                ==================================================== */}

                <div className="relative min-w-0 flex-[1.35]">
                  <div
                    className="
                      group
                      relative
                      h-[78px]
                      rounded-xl
                      border border-slate-700
                      bg-slate-800/80
                      px-4
                      py-3
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
                        onChange={(e) => setFrom(e.target.value)}
                        placeholder="City or Airport"
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

                      {from && (
                        <button
                          type="button"
                          onClick={() => setFrom("")}
                          className="
                            shrink-0
                            rounded-full
                            p-1
                            text-slate-500
                            transition
                            hover:bg-slate-700
                            hover:text-white
                          "
                          aria-label="Clear departure location"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* =================================================
                      SWAP BUTTON
                  ================================================== */}

<button
                    type="button"
                    onClick={swapLocations}
                    className="
  absolute
  z-20
  right-0
  top-1/2
  flex
  h-10
  w-10
  -translate-y-1/2
  translate-x-1/2
  items-center
  justify-center
  rounded-full
  border
  border-slate-300
  bg-white
  text-slate-800
  shadow-lg
"
                    aria-label="Swap departure and destination"
                  >
                    <ArrowRightLeft size={17} />
                    </button>
                </div>

                {/* ===================================================
                    TO
                ==================================================== */}

                <div className="min-w-0 flex-[1.35]">
                  <div
                    className="
                      group
                      relative
                      h-[78px]
                      rounded-xl
                      border border-slate-700
                      bg-slate-800/80
                      px-4
                      py-3
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
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="City or Airport"
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

                      {to && (
                        <button
                          type="button"
                          onClick={() => setTo("")}
                          className="
                            shrink-0
                            rounded-full
                            p-1
                            text-slate-500
                            transition
                            hover:bg-slate-700
                            hover:text-white
                          "
                          aria-label="Clear destination"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ===================================================
                    DEPARTURE
                ==================================================== */}

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
                      Departure
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
                        onChange={(e) =>
                          setDeparture(e.target.value)
                        }
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

                {/* ===================================================
                    RETURN - ONLY ROUND TRIP / MULTI CITY
                ==================================================== */}

                {activeTab !== "one-way" && (
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
                        Return
                      </span>

                      <div className="mt-1 flex items-center gap-2">
                        <RotateCcw
                          size={17}
                          className="shrink-0 text-indigo-400"
                        />

                        <input
                          type="date"
                          value={returnDate}
                          min={departure || today}
                          onChange={(e) =>
                            setReturnDate(e.target.value)
                          }
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
                )}

                {/* ===================================================
                    TRAVELLERS + CABIN
                ==================================================== */}

                <div className="relative min-w-0 flex-[1]">
                  <button
                    type="button"
                    onClick={() =>
                      setShowTravellerPanel(
                        !showTravellerPanel
                      )
                    }
                    className="
                      flex
                      h-[78px]
                      w-full
                      flex-col
                      justify-center
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-800/80
                      px-4
                      text-left
                      transition
                      hover:border-slate-600
                      focus:border-blue-500
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500/20
                    "
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Travellers & Class
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <Users
                        size={17}
                        className="shrink-0 text-blue-400"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {getTravellerLabel()}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {getCabinLabel()}
                        </p>
                      </div>

                      <ChevronDown
                        size={17}
                        className={`
                          shrink-0
                          text-slate-500
                          transition-transform
                          ${
                            showTravellerPanel
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />
                    </div>
                  </button>

                  {/* =================================================
                      TRAVELLER POPOVER
                  ================================================== */}

                  <AnimatePresence>
                    {showTravellerPanel && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -8,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -8,
                          scale: 0.98,
                        }}
                        transition={{ duration: 0.18 }}
                        className="
                          absolute
                          right-0
                          top-[calc(100%+10px)]
                          z-50
                          w-full
                          min-w-[280px]
                          rounded-2xl
                          border
                          border-slate-700
                          bg-slate-900
                          p-5
                          shadow-2xl
                        "
                      >
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-white">
                            Travellers
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Select the number of travellers
                          </p>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/10 p-2">
                              <Users
                                size={18}
                                className="text-blue-400"
                              />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-white">
                                Travellers
                              </p>

                              <p className="text-xs text-slate-500">
                                Adults
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={travellers <= 1}
                              onClick={() =>
                                setTravellers(
                                  Math.max(
                                    1,
                                    travellers - 1
                                  )
                                )
                              }
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-slate-600
                                text-white
                                transition
                                hover:border-blue-500
                                hover:bg-blue-500/10
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                              "
                            >
                              −
                            </button>

                            <span className="w-6 text-center text-sm font-semibold text-white">
                              {travellers}
                            </span>

                            <button
                              type="button"
                              disabled={travellers >= 6}
                              onClick={() =>
                                setTravellers(
                                  Math.min(
                                    6,
                                    travellers + 1
                                  )
                                )
                              }
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-slate-600
                                text-white
                                transition
                                hover:border-blue-500
                                hover:bg-blue-500/10
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                              "
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <Briefcase size={14} />
                            Cabin Class
                          </label>

                          <select
                            value={cabin}
                            onChange={(e) =>
                              setCabin(e.target.value)
                            }
                            className="
                              h-11
                              w-full
                              rounded-xl
                              border
                              border-slate-700
                              bg-slate-800
                              px-3
                              text-sm
                              font-medium
                              text-white
                              outline-none
                              focus:border-blue-500
                              focus:ring-2
                              focus:ring-blue-500/20
                            "
                          >
                            {CABINS.map((item) => (
                              <option
                                key={item.value}
                                value={item.value}
                              >
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowTravellerPanel(false)
                          }
                          className="
                            mt-4
                            w-full
                            rounded-xl
                            bg-blue-600
                            py-2.5
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-blue-500
                          "
                        >
                          Done
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ===================================================
                    SEARCH BUTTON
                ==================================================== */}

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
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
                    {loading
                      ? "Searching..."
                      : "Search Flights"}
                  </span>
                </motion.button>
              </div>

              {/* =====================================================
                  SPECIAL FARES
              ====================================================== */}

              <div className="mt-3 flex flex-col gap-3 px-1 py-2 lg:flex-row lg:items-center">
                <div className="shrink-0">
                  <span className="text-sm font-semibold text-white">
                    Special Fares
                  </span>

                  <span className="ml-1 text-xs text-slate-500">
                    (Optional)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FARES.map((fare) => (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      key={fare}
                      type="button"
                      onClick={() =>
                        setSelectedFare(fare)
                      }
                      className={`
                        rounded-full
                        border
                        px-3.5
                        py-1.5
                        text-xs
                        font-medium
                        transition-all
                        ${
                          selectedFare === fare
                            ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-900/30"
                            : "border-slate-700 bg-slate-800/70 text-slate-400 hover:border-slate-500 hover:text-white"
                        }
                      `}
                    >
                      {fare}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* =====================================================
                  TRUST / SERVICE STRIP
              ====================================================== */}

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-x-4
                  gap-y-2
                  rounded-xl
                  border
                  border-blue-500/10
                  bg-blue-500/[0.06]
                  px-4
                  py-3
                  text-xs
                  text-slate-400
                "
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={15}
                    className="text-emerald-400"
                  />
                  <span className="font-medium text-slate-300">
                    Secure Payments
                  </span>
                </div>

                <span className="hidden text-slate-600 sm:block">
                  •
                </span>

                <div className="flex items-center gap-2">
                  <RotateCcw
                    size={15}
                    className="text-blue-400"
                  />
                  <span>Instant Refunds</span>
                </div>

                <span className="hidden text-slate-600 sm:block">
                  •
                </span>

                <div className="flex items-center gap-2">
                  <Headphones
                    size={15}
                    className="text-violet-400"
                  />
                  <span>Priority Customer Support</span>
                </div>

                <span className="hidden text-slate-600 sm:block">
                  •
                </span>

                <div className="flex items-center gap-2">
                  <Zap
                    size={15}
                    className="text-yellow-400"
                  />
                  <span>Fast Booking</span>
                </div>
              </div>
            </div>

            {/* =======================================================
                ERROR
            ======================================================== */}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                  mt-4
                  rounded-xl
                  border
                  border-red-500/20
                  bg-red-500/10
                  px-4
                  py-3
                  text-center
                  text-sm
                  font-medium
                  text-red-400
                "
              >
                {error}
              </motion.div>
            )}

            {/* =======================================================
                FEATURES
            ======================================================== */}

            <div className="mt-5 grid grid-cols-1 gap-3 pb-1 md:grid-cols-3">
              {/* Instant Booking */}
              <motion.div
                whileHover={{ y: -3 }}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-700/70
                  bg-slate-800/40
                  p-4
                  transition-all
                  duration-300
                  hover:border-blue-500/40
                  hover:bg-slate-800/70
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-yellow-400/10
                    "
                  >
                    <Zap
                      size={19}
                      className="text-yellow-400"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Instant Booking
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Book your trip in seconds.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* AI Powered */}
              <motion.div
                whileHover={{ y: -3 }}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-700/70
                  bg-slate-800/40
                  p-4
                  transition-all
                  duration-300
                  hover:border-blue-500/40
                  hover:bg-slate-800/70
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-500/10
                    "
                  >
                    <Bot
                      size={19}
                      className="text-violet-400"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      AI Powered
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Smart travel recommendations.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Secure Payments */}
              <motion.div
                whileHover={{ y: -3 }}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-700/70
                  bg-slate-800/40
                  p-4
                  transition-all
                  duration-300
                  hover:border-blue-500/40
                  hover:bg-slate-800/70
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-emerald-500/10
                    "
                  >
                    <ShieldCheck
                      size={19}
                      className="text-emerald-400"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Secure Payments
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Safe & encrypted transactions.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}