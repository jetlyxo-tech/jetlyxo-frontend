"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Flight } from "@/types";
import { searchFlights } from "@/lib/api";
import { getToken } from "@/lib/auth";

/* ---------------------------------------------
   AIRLINE LOGOS
--------------------------------------------- */

const airlineLogos: Record<string, string> = {
  IndiGo: "/airlines/indigo.png",
  "Air India": "/airlines/airindia.png",
  "Air India Express": "/airlines/aix.png",
  "Akasa Air": "/airlines/akasa.png",
  SpiceJet: "/airlines/spicejet.png",
};

/* ---------------------------------------------
   SORT OPTIONS
--------------------------------------------- */

const SORT_OPTIONS = [
  "Cheapest",
  "Fastest",
  "Departure Time",
  "Airline",
] as const;

/* ---------------------------------------------
   TYPES
--------------------------------------------- */

type NormalizedFlight = {
  id: string | number;

  airline: string;

  priceNumber: number;
  priceDisplay: string;

  duration: string;

  dep: string;

  stops: string;

  seats: number | null;

  cabin: string;

  fareType: string;

  badge?: string;

  searchId?: string;

  tId?: string;
};

type FlightResultsProps = {
  flights: Flight[];

  from?: string;

  to?: string;

  departureDate?: string;
};

/* ---------------------------------------------
   HELPERS
--------------------------------------------- */

function parseDuration(duration: string) {
  const hrs = duration.match(/(\d+)h/);
  const mins = duration.match(/(\d+)m/);

  return (
    (hrs ? Number(hrs[1]) : 0) * 60 +
    (mins ? Number(mins[1]) : 0)
  );
}

function normalizeFlight(
  flight: Flight,
  index: number
): NormalizedFlight {
  const price = Number(flight.price ?? 0);

  return {
    id: flight.id ?? index,

    airline: flight.airline || "Unknown Airline",

    priceNumber: price,

    priceDisplay:
      price > 0
        ? `₹${price.toLocaleString("en-IN")}`
        : "—",

    duration: flight.duration || "N/A",

    dep: flight.departure || "--:--",

    stops:
      typeof flight.stops === "number"
        ? flight.stops === 0
          ? "Non-stop"
          : `${flight.stops} Stop`
        : "Non-stop",

    seats: flight.seats ?? null,

    cabin: "Economy",

    fareType: "Regular Fare",

    badge:
      index === 0
        ? "Best Value"
        : undefined,

    searchId: flight.searchId,

    tId: flight.tId,
  };
}

/* ---------------------------------------------
   BOOK BUTTON
--------------------------------------------- */

function BookNowButton({
  priceNumber,
  airline,
  duration,
  flightId,
  searchId,
  tId,
}: {
  priceNumber: number;
  airline: string;
  duration: string;
  flightId: Flight["id"];
  searchId?: string;
  tId?: string;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (!flightId) {
      toast.error("Flight ID missing");
      return;
    }

    const url =
      `/flight-passenger?flightId=${encodeURIComponent(
        String(flightId)
      )}` +
      `&searchId=${encodeURIComponent(searchId ?? "")}` +
      `&tId=${encodeURIComponent(tId ?? "")}` +
      `&price=${priceNumber}` +
      `&airline=${encodeURIComponent(airline)}` +
      `&duration=${encodeURIComponent(duration)}`;

    if (!getToken()) {
      router.push(
        `/login?redirect=${encodeURIComponent(url)}`
      );
      return;
    }

    router.push(url);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition text-white font-semibold shadow-lg"
    >
      Book Flight →
    </button>
  );
}

/* ---------------------------------------------
   COMPONENT
--------------------------------------------- */

export default function FlightResults({
  flights,
  from = "BLR",
  to = "DEL",
  departureDate,
}: FlightResultsProps) {
  const [flightList, setFlightList] =
    useState<Flight[]>(flights);

  const [sortBy, setSortBy] =
    useState<(typeof SORT_OPTIONS)[number]>(
      "Cheapest"
    );

  const [filters, setFilters] = useState({
    nonStop: false,
    oneStop: false,

    earlyMorning: false,
    morning: false,
    afternoon: false,
    evening: false,
  });

  const [selectedAirlines, setSelectedAirlines] =
    useState<string[]>([]);

  const [priceLimit, setPriceLimit] =
    useState(0);

  const [sliderMax, setSliderMax] =
    useState(0);

/* ---------------------------------------------
   EFFECTS
--------------------------------------------- */

  useEffect(() => {
    setFlightList(flights);
  }, [flights]);

  useEffect(() => {
    if (!flightList.length) return;

    const highest = Math.max(
      ...flightList.map((f) =>
        Number(f.price ?? 0)
      )
    );

    setSliderMax(highest);

    setPriceLimit(highest);
  }, [flightList]);

  const refreshFlightSeats =
    useCallback(async () => {
      try {
        const results = await searchFlights({
          from,
          to,
          departureDate:
            departureDate ??
            new Date()
              .toISOString()
              .split("T")[0],
          travellers: 1,
        });

        setFlightList(results);
      } catch (err) {
        console.error(err);
      }
    }, [from, to, departureDate]);
useEffect(() => {
  refreshFlightSeats();
}, [refreshFlightSeats]);

/* ---------------------------------------------
   NORMALIZED DATA
--------------------------------------------- */

  const normalizedFlights =
    useMemo(() => {
      return flightList.map((flight, index) =>
        normalizeFlight(flight, index)
      );
    }, [flightList]);

  const airlines = useMemo(() => {
    return Array.from(
      new Set(
        normalizedFlights.map(
          (f) => f.airline
        )
      )
    ).sort();
  }, [normalizedFlights]);


/* ---------------------------------------------
   FILTERS
--------------------------------------------- */

  const filteredFlights =
    useMemo(() => {
      let list = [...normalizedFlights];

      if (filters.nonStop) {
        list = list.filter((f) =>
          f.stops.includes("Non")
        );
      }

      if (filters.oneStop) {
        list = list.filter((f) =>
          f.stops.includes("1")
        );
      }

      if (selectedAirlines.length) {
        list = list.filter((f) =>
          selectedAirlines.includes(
            f.airline
          )
        );
      }

      if (filters.earlyMorning) {
        list = list.filter((f) => {
          const hr =
            Number(f.dep.split(":")[0]) || 0;
          return hr < 6;
        });
      }

      if (filters.morning) {
        list = list.filter((f) => {
          const hr =
            Number(f.dep.split(":")[0]) || 0;
          return hr >= 6 && hr < 12;
        });
      }

      if (filters.afternoon) {
        list = list.filter((f) => {
          const hr =
            Number(f.dep.split(":")[0]) || 0;
          return hr >= 12 && hr < 18;
        });
      }

      if (filters.evening) {
        list = list.filter((f) => {
          const hr =
            Number(f.dep.split(":")[0]) || 0;
          return hr >= 18;
        });
      }

      list = list.filter(
        (f) =>
          f.priceNumber <= priceLimit
      );

      return list;
    }, [
      normalizedFlights,
      filters,
      selectedAirlines,
      priceLimit,
    ]);

/* ---------------------------------------------
   SORTING
--------------------------------------------- */

  const sortedFlights =
    useMemo(() => {
      const list = [...filteredFlights];

      switch (sortBy) {
        case "Cheapest":
          list.sort(
            (a, b) =>
              a.priceNumber -
              b.priceNumber
          );
          break;

        case "Fastest":
          list.sort(
            (a, b) =>
              parseDuration(a.duration) -
              parseDuration(b.duration)
          );
          break;

        case "Departure Time":
          list.sort((a, b) =>
            a.dep.localeCompare(
              b.dep
            )
          );
          break;

        case "Airline":
          list.sort((a, b) =>
            a.airline.localeCompare(
              b.airline
            )
          );
          break;
      }

      return list;
    }, [filteredFlights, sortBy]);

  if (!sortedFlights.length) {
    return (
      <div className="glass-card p-10 text-center text-white">
        No flights found.
      </div>
    );
  }
  return (
    <div
      id="results"
      className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6"
    >
      {/* ===========================================
          LEFT SIDEBAR
      =========================================== */}

      <aside className="glass-card p-5 rounded-2xl h-fit lg:sticky lg:top-24">

        {/* Header */}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Filters
            </h3>

            <p className="text-xs text-white/60">
              Refine your flight search
            </p>
          </div>

          <button
            onClick={() => {
              setFilters({
                nonStop: false,
                oneStop: false,

                earlyMorning: false,
                morning: false,
                afternoon: false,
                evening: false,
              });

              setSelectedAirlines([]);

              setPriceLimit(sliderMax);
            }}
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Clear
          </button>
        </div>

        {/* PRICE */}

        <div className="mb-8">

          <h4 className="font-semibold text-white mb-4">
            Price Range
          </h4>

          <input
            type="range"
            min={0}
            max={sliderMax}
            value={priceLimit}
            step={100}
            onChange={(e) =>
              setPriceLimit(Number(e.target.value))
            }
            className="w-full accent-cyan-500"
          />

          <div className="flex justify-between mt-3 text-sm text-white/60">

            <span>₹0</span>

            <span>
              ₹{priceLimit.toLocaleString("en-IN")}
            </span>

          </div>

        </div>

        {/* STOPS */}

        <div className="mb-8">

          <h4 className="font-semibold text-white mb-4">
            Stops
          </h4>

          <div className="space-y-3">

            <label className="flex items-center gap-3 cursor-pointer text-white">

              <input
                type="checkbox"
                checked={filters.nonStop}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    nonStop: !prev.nonStop,
                  }))
                }
              />

              Non Stop

            </label>

            <label className="flex items-center gap-3 cursor-pointer text-white">

              <input
                type="checkbox"
                checked={filters.oneStop}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    oneStop: !prev.oneStop,
                  }))
                }
              />

              1 Stop

            </label>

          </div>

        </div>

        {/* DEPARTURE */}

        <div className="mb-8">

          <h4 className="font-semibold text-white mb-4">
            Departure Time
          </h4>

          <div className="space-y-3">

            {[
              {
                key: "earlyMorning",
                label: "Early Morning (00-06)",
              },
              {
                key: "morning",
                label: "Morning (06-12)",
              },
              {
                key: "afternoon",
                label: "Afternoon (12-18)",
              },
              {
                key: "evening",
                label: "Evening (18-24)",
              },
            ].map((item) => (

              <label
                key={item.key}
                className="flex items-center gap-3 cursor-pointer text-white"
              >

                <input
                  type="checkbox"
                  checked={
                    filters[
                      item.key as keyof typeof filters
                    ]
                  }
                  onChange={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [item.key]:
                        !prev[
                          item.key as keyof typeof prev
                        ],
                    }))
                  }
                />

                {item.label}

              </label>

            ))}

          </div>

        </div>

        {/* AIRLINES */}

        <div>

          <h4 className="font-semibold text-white mb-4">
            Airlines
          </h4>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">

            {airlines.map((airline) => (

              <label
                key={airline}
                className="flex items-center gap-3 cursor-pointer text-white"
              >

                <input
                  type="checkbox"
                  checked={selectedAirlines.includes(
                    airline
                  )}
                  onChange={() =>
                    setSelectedAirlines((prev) =>
                      prev.includes(airline)
                        ? prev.filter(
                            (a) => a !== airline
                          )
                        : [...prev, airline]
                    )
                  }
                />

                {airline}

              </label>

            ))}

          </div>

        </div>

      </aside>

      {/* ===========================================
          RIGHT SIDE
      =========================================== */}

      <section>

        {/* SORT BAR */}

        <div className="glass-card p-3 mb-6 flex gap-2 overflow-x-auto">

          {SORT_OPTIONS.map((option) => (

            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
                sortBy === option
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {option}
            </button>

          ))}

        </div>

                <div className="space-y-4">
          {sortedFlights.map((flight, i) => (
            <motion.div
              key={flight.id}
              className="
                glass-card
                p-6
                rounded-2xl
                border
                border-white/10
                hover:border-cyan-500/30
                transition-all
                duration-300
                flex
                flex-col
                lg:flex-row
                justify-between
                items-start
                lg:items-center
                gap-6
              "
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: i * 0.05,
              }}
            >
              {/* LEFT SIDE */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    <Image
                      src={
                        airlineLogos[flight.airline] ??
                        "/airlines/default.png"
                      }
                      alt={flight.airline}
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-lg text-white">
                      {flight.airline}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs">
                        {flight.cabin}
                      </span>

                      <span className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                        {flight.fareType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {flight.badge && (
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                      {flight.badge}
                    </span>
                  )}

                  {sortBy === "Cheapest" && (
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                      Cheapest
                    </span>
                  )}

                  {sortBy === "Fastest" && (
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                      Fastest
                    </span>
                  )}
                </div>

                {/* ROUTE */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span className="font-semibold text-white">
                    {from}
                  </span>

                  <div className="flex-1 min-w-[40px] border-t border-dashed border-cyan-500/40" />

                  <span className="text-cyan-300 text-lg">
                    ✈
                  </span>

                  <div className="flex-1 min-w-[40px] border-t border-dashed border-cyan-500/40" />

                  <span className="font-semibold text-white">
                    {to}
                  </span>
                </div>

                {/* TIME + DURATION */}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xl font-semibold text-white">
                    {flight.dep}
                  </span>

                  <div className="flex-1 h-px bg-white/20" />

                  <span className="text-sm text-white/60">
                    {flight.duration}
                  </span>
                </div>

                <p className="text-sm text-white/70 mt-1">
                  {flight.duration} • {flight.stops}
                </p>

                {/* SEATS */}
                <p
                  className={`text-sm mt-2 font-medium ${
                    flight.seats === 0
                      ? "text-red-400"
                      : (flight.seats ?? 99) <= 4
                      ? "text-red-300"
                      : (flight.seats ?? 99) <= 9
                      ? "text-yellow-300"
                      : "text-green-400"
                  }`}
                >
                  {flight.seats === 0
                    ? "Sold Out"
                    : (flight.seats ?? 99) <= 4
                    ? `Hurry! Only ${flight.seats} seats left`
                    : (flight.seats ?? 99) <= 9
                    ? `Only ${flight.seats} seats left`
                    : flight.seats != null
                    ? `${flight.seats} Seats Available`
                    : "Seats Available"}
                </p>
              </div>

              {/* RIGHT SIDE — PRICE */}
              <div className="flex flex-col sm:items-end items-start w-full sm:w-auto gap-3">
                <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-1">
                  <p className="text-xs text-white/40">
                    Per Traveller
                  </p>

                  <p className="text-3xl font-bold text-white">
                    {flight.priceDisplay}
                  </p>

                  <p className="text-xs text-green-300">
                    Taxes Included
                  </p>
                </div>

                <BookNowButton
                  priceNumber={flight.priceNumber}
                  airline={flight.airline}
                  duration={flight.duration}
                  flightId={flight.id}
                  searchId={flight.searchId}
                  tId={flight.tId}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}