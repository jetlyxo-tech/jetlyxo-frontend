"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

/* ---------------- SORT OPTIONS ---------------- */

const SORT_OPTIONS = [
  "Cheapest",
  "Fastest",
  "Best",
  "Departure Time",
  "Airline",
] as const;

/* ---------------- TYPES ---------------- */

type RawFlight = {
  id?: number | string;
  airline?: string;
  price?: number | string;
  duration?: string;
  stops?: string;
  dep?: string;
  departure?: string;
  departureTime?: string;
  seats?: number | string;
};

type NormalizedFlight = {
  id: number;
  airline: string;
  priceNumber: number;
  priceDisplay: string;
  duration: string;
  stops: string;
  dep: string;
  seats: number | null;
};

/* ---------------- HELPERS ---------------- */

function parseDuration(duration: string) {
  if (!duration) return 999999;

  const hoursMatch = duration.match(/(\d+)h/);
  const minsMatch = duration.match(/(\d+)m/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1]) : 0;

  return hours * 60 + mins;
}

/* ---------------- NORMALIZE FLIGHT ---------------- */

function normalizeFlight(
  f: RawFlight,
  index: number
): NormalizedFlight {

  const price =
    typeof f?.price === "number"
      ? f.price
      : typeof f?.price === "string"
      ? Number(
          f.price.replace(/[₹,$,]/g, "")
        )
      : 0;

  const seats =
    typeof f?.seats === "number"
      ? f.seats
      : typeof f?.seats === "string"
      ? parseInt(f.seats)
      : null;

  return {
    id:
      typeof f?.id === "number"
        ? f.id
        : index + 1,

    airline:
      f?.airline || "Unknown Airline",

    priceNumber: price,

    priceDisplay:
      price > 0
        ? `₹${price.toLocaleString("en-IN")}`
        : "—",

    duration:
      f?.duration || "N/A",

      stops:
      typeof f?.stops === "number"
        ? f.stops === 0
          ? "Non-stop"
          : `${f.stops} Stop`
        : f?.stops || "Non-stop",
    dep:
      f?.dep ||
      f?.departure ||
      f?.departureTime ||
      "--:--",

    seats,
  };
}


function BookNowButton({
  priceNumber,
  airline,
  duration,
  flightId,
}: {
  priceNumber: number;
  airline: string;
  duration: string;
  flightId: number;
}) {

  const router = useRouter();

  const handleClick = () => {

    if (!flightId) {
      alert("Flight ID missing");
      return;
    }

   
const token = getToken();

if (!token) {

  router.push(
    `/login?redirect=${encodeURIComponent(
      `/flight-passenger?flightId=${flightId}` +
        `&price=${priceNumber}` +
        `&airline=${encodeURIComponent(
          airline
        )}` +
        `&duration=${encodeURIComponent(
          duration
        )}`
    )}`
  );

  return;
}


    const url =
      `/flight-passenger?flightId=${flightId}` +
      `&price=${priceNumber}` +
      `&airline=${encodeURIComponent(
        airline
      )}` +
      `&duration=${encodeURIComponent(
        duration
      )}`;

    router.push(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
bg-gradient-to-r
from-blue-600
to-cyan-500
hover:scale-105
transition-all
duration-300
px-5
py-2.5
rounded-xl
text-white
font-semibold
shadow-lg
"
    >
      Book Now
    </button>
  );
}



type FlightResultsProps = {
  flights: RawFlight[];
  from?: string;
  to?: string;
  departureDate?: string;
};

export default function FlightResults({
  flights,
  from = "BLR",
  to = "DEL",
  departureDate,
}: FlightResultsProps)  {

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  const [sortBy, setSortBy] =
    useState<
      (typeof SORT_OPTIONS)[number]
    >("Cheapest");

  const [flightList, setFlightList] =
    useState<RawFlight[]>(flights);

    

    const [filters, setFilters] = useState({
      nonStop: false,
      morning: false,
      evening: false,
    
      refundable: false,
      studentFare: false,
    
      airIndia: false,
      indigo: false,
    
      oneStop: false,
    });
    
    const [maxPrice, setMaxPrice] = useState(25000);

  /* ---------------- SYNC PROPS ---------------- */

  useEffect(() => {
    setFlightList(flights);
  }, [flights]);

  /* ---------------- REFRESH FLIGHTS ---------------- */

  async function refreshFlightSeats() {

    try {

      const res = await fetch(
        `${API_BASE}/api/flights/search` +
          `?origin=${encodeURIComponent(from)}` +
          `&destination=${encodeURIComponent(to)}` +
          `&departureDate=${encodeURIComponent(
            departureDate || new Date().toISOString().split("T")[0]
          )}`
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch flights"
        );
      }

      const data = await res.json();

      if (Array.isArray(data?.data)) {
        setFlightList(data.data);
      }

    } catch (err) {

      console.error(
        "Seat refresh failed:",
        err
      );
    }
    
  }

  useEffect(() => {
    refreshFlightSeats();
  
    const interval = setInterval(
      refreshFlightSeats,
      10000
    );
  
    return () => clearInterval(interval);
  
  }, [from, to, departureDate]);

  

  const normalizedFlights =
    useMemo(() => {

      return flightList.map((f, i) =>
        normalizeFlight(f, i)
      );

    }, [flightList]);


    const filteredFlights = useMemo(() => {
      let list = [...normalizedFlights];
    
      if (filters.nonStop) {
        list = list.filter((f) =>
          f.stops.toLowerCase().includes("non")
        );
      }
    
      if (filters.morning) {
        list = list.filter((f) => {
          const hour =
  parseInt(
    f.dep?.split(":")[0]
  ) || 0;
          return hour < 12;
        });
      }
    
      if (filters.evening) {
        list = list.filter((f) => {
          const hour =
  parseInt(
    f.dep?.split(":")[0]
  ) || 0;
          return hour >= 18;
        });
      }
    
      if (filters.indigo || filters.airIndia) {
        list = list.filter((f) => {
      
          const airline =
            f.airline.toLowerCase();
      
          return (
            (filters.indigo &&
              airline.includes("indigo")) ||
      
            (filters.airIndia &&
              airline.includes("air india"))
          );
        });
      }

      if (maxPrice > 0) {
        list = list.filter((f) =>
          f.priceNumber <= maxPrice
        );
      }

      if (filters.oneStop) {
        list = list.filter(
          (f) =>
            f.stops.toLowerCase() ===
            "1 stop"
        );
      }
      return list;
    }, [normalizedFlights, filters, maxPrice]);
  const sortedFlights =
    useMemo(() => {

      const list = [
        ...filteredFlights
      ];

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
              parseDuration(
                a.duration
              ) -
              parseDuration(
                b.duration
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

        case "Departure Time":
          list.sort((a, b) =>
            a.dep.localeCompare(
              b.dep
            )
          );
          break;

        case "Best":
        default:
          break;
      }

      return list;

    }, [filteredFlights, sortBy]);

    if (!sortedFlights.length) {
  return (
    <div className="glass-card p-8 text-center">
      <h3 className="text-white text-xl">
        No flights found
      </h3>

      <p className="text-white/60 mt-2">
        Try another date or destination.
      </p>
    </div>
  );
}

return (
  <div
    id="results"
      className="grid lg:grid-cols-[280px_1fr] gap-6"
    >
      
  
      {/* LEFT SIDEBAR */}

<div className="glass-card p-5 h-fit sticky top-24">

<div className="flex items-center justify-between mb-4">
  <div>
    <h3 className="text-white font-semibold text-lg">
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
        morning: false,
        evening: false,
        refundable: false,
        studentFare: false,
        airIndia: false,
        indigo: false,
        oneStop: false,
      });

      setMaxPrice(25000);
    }}
    className="text-blue-400 text-sm hover:text-blue-300"
  >
    Clear
  </button>
</div>

{/* PRICE */}

<div className="mb-6">
  <h4 className="text-white font-medium mb-3">
    Price Range
  </h4>

  <input
    type="range"
    min="2000"
    max="25000"
    step="500"
    value={maxPrice}
    onChange={(e) =>
      setMaxPrice(Number(e.target.value))
    }
    className="w-full"
  />

  <div className="flex justify-between mt-2 text-sm text-white/70">
    <span>₹2,000</span>
    <span>₹{maxPrice.toLocaleString()}</span>
  </div>
</div>

{/* STOPS */}

<div className="mb-6">
  <h4 className="text-white font-medium mb-3">
    Stops
  </h4>

  <div className="space-y-3">

    <label className="flex items-center gap-2 text-white">
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

    <label className="flex items-center gap-2 text-white">
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

<div className="mb-6">
  <h4 className="text-white font-medium mb-3">
    Departure Time
  </h4>

  <div className="grid grid-cols-2 gap-2">

    <button
      onClick={() =>
        setFilters((prev) => ({
          ...prev,
          morning: !prev.morning,
        }))
      }
      className={`rounded-xl py-2 text-sm transition ${
        filters.morning
          ? "bg-blue-600 text-white"
          : "bg-white/10 text-white"
      }`}
    >
      Morning
    </button>

    <button
      onClick={() =>
        setFilters((prev) => ({
          ...prev,
          evening: !prev.evening,
        }))
      }
      className={`rounded-xl py-2 text-sm transition ${
        filters.evening
          ? "bg-blue-600 text-white"
          : "bg-white/10 text-white"
      }`}
    >
      Evening
    </button>

  </div>
</div>

{/* AIRLINES */}

<div>
  <h4 className="text-white font-medium mb-3">
    Airlines
  </h4>

  <div className="space-y-3">

    <label className="flex items-center gap-2 text-white">
      <input
        type="checkbox"
        checked={filters.indigo}
        onChange={() =>
          setFilters((prev) => ({
            ...prev,
            indigo: !prev.indigo,
          }))
        }
      />
      IndiGo
    </label>

    <label className="flex items-center gap-2 text-white">
      <input
        type="checkbox"
        checked={filters.airIndia}
        onChange={() =>
          setFilters((prev) => ({
            ...prev,
            airIndia: !prev.airIndia,
          }))
        }
      />
      Air India
    </label>

  </div>
</div>


</div>


  
  
      
  
      {/* RIGHT SECTION */}

<div>

<div className="glass-card p-3 mb-6 flex flex-wrap gap-2">

  {SORT_OPTIONS.map((opt) => (
    <button
      key={opt}
      onClick={() => setSortBy(opt)}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
        sortBy === opt
          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {opt}
    </button>
  ))}

</div>

<div className="space-y-4">
          {sortedFlights.map((flight, i) => (
            <motion.div
              key={flight.id}
              className="glass-card p-6 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
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
              <div>


              <div className="flex items-center gap-3">
  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
    ✈️
  </div>

  <div>
    <p className="font-semibold text-lg text-white">
      {flight.airline}
    </p>

    <p className="text-xs text-white/50">
      Economy
    </p>
  </div>
</div>
<div className="flex gap-2 mt-2">

  {i === 0 && (
    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
      Best Value
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

<div className="flex items-center gap-3 mt-2">
  <span className="font-semibold text-white">
    {from}
  </span>

  <div className="flex-1 border-t border-dashed border-white/20" />

  ✈️

  <div className="flex-1 border-t border-dashed border-white/20" />

  <span className="font-semibold text-white">
    {to}
  </span>
</div>

<div className="flex items-center gap-4 mt-2">

  <span className="text-xl font-semibold text-white">
    {flight.dep}
  </span>

  <div className="flex-1 h-px bg-white/20" />

  <span className="text-sm text-white/60">
    {flight.duration}
  </span>

</div>

<p className="text-sm text-white/70">
  {flight.duration} • {flight.stops}
</p>
  
<p
  className={`text-sm mt-1 ${
    flight.seats === 0
      ? "text-red-400"
      : (flight.seats ?? 99) < 5
      ? "text-yellow-400"
      : "text-green-400"
  }`}
>
  {flight.seats === 0
    ? "Sold Out ❌"
    : `${flight.seats ?? "N/A"} seats left`}
</p>
              </div>
  
              <div className="flex items-center gap-4">

  <div className="text-right">
    <p className="text-xs text-white/50">
      Starting from
    </p>

    <p className="text-3xl font-bold text-white">
      {flight.priceDisplay}
    </p>
  </div>

  <BookNowButton
    priceNumber={flight.priceNumber}
    airline={flight.airline}
    duration={flight.duration}
    flightId={flight.id}
  />

</div>
            </motion.div>
          ))}
        </div>
  
      </div>
    </div>
  );
}