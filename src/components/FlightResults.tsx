"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { searchFlights } from "@/lib/api";
import { Flight } from "@/types";
import { useCallback } from "react";
import { toast } from "sonner";
import Image from "next/image";

const airlineLogos: Record<string, string> = {
  "IndiGo": "/airlines/indigo.png",

  "Air India": "/airlines/airindia.png",

  "Air India Express": "/airlines/aix.png",

  "Akasa Air": "/airlines/akasa.png",

  "SpiceJet": "/airlines/spicejet.png",
};


/* ---------------- SORT OPTIONS ---------------- */

const SORT_OPTIONS = [
  "Cheapest",
  "Fastest",
  "Departure Time",
  "Airline",
] as const;

/* ---------------- TYPES ---------------- */
type NormalizedFlight = {
  id: string | number;

  airline: string;

  priceNumber: number;
  priceDisplay: string;

  duration: string;

  stops: string;

  dep: string;

  seats: number | null;

  cabin: string;
  fareType: string;

  badge?: string;

  searchId?: string;
  tId?: string;
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
  f: Flight,
  index: number
): NormalizedFlight {
  const price = f.price ?? 0;

  const seats = f.seats ?? null;

  return {
    id: f.id ?? index + 1,
  
    airline: f.airline || "Unknown Airline",
  
    priceNumber: price,
  
    priceDisplay:
      price > 0
        ? `₹${price.toLocaleString("en-IN")}`
        : "—",
  
    duration: f.duration || "N/A",
  
    stops:
      typeof f.stops === "number"
        ? f.stops === 0
          ? "Non-stop"
          : `${f.stops} Stop`
        : "Non-stop",
  
    dep: f.departure ?? "--:--",
  
    seats,
  
    cabin: "Economy",
  
    fareType: "Regular Fare",
  
    badge:
      index === 0
        ? "Best Value"
        : undefined,
  
    searchId: f.searchId,
  
    tId: f.tId,
  };
}

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

   
const token = getToken();

if (!token) {

  router.push(
    `/login?redirect=${encodeURIComponent(
      `/flight-passenger?flightId=${encodeURIComponent(String(flightId))}` +
        `&searchId=${encodeURIComponent(searchId ?? "")}` +
        `&tId=${encodeURIComponent(tId ?? "")}` +
        `&price=${encodeURIComponent(String(priceNumber))}` +
        `&airline=${encodeURIComponent(airline)}` +
        `&duration=${encodeURIComponent(duration)}`  
    )}`
  );

  return;
}


const url =
`/flight-passenger?flightId=${encodeURIComponent(String(flightId))}` +
`&searchId=${encodeURIComponent(searchId ?? "")}` +
`&tId=${encodeURIComponent(tId ?? "")}` +
`&price=${encodeURIComponent(String(priceNumber))}` +
`&airline=${encodeURIComponent(airline)}` +
`&duration=${encodeURIComponent(duration)}`;

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
      Book Flight →
    </button>
  );
}



type FlightResultsProps = {
  flights: Flight[];
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



  const [sortBy, setSortBy] =
    useState<
      (typeof SORT_OPTIONS)[number]
    >("Cheapest");

  const [flightList, setFlightList] =
      useState<Flight[]>(flights);

    

      const [filters, setFilters] = useState({
        nonStop: false,
        oneStop: false,
      
        earlyMorning: false,
        morning: false,
        afternoon: false,
        evening: false,
      });
      
      const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
      
      const [maxPrice, setMaxPrice] = useState(0);

useEffect(() => {
  if (flightList.length > 0) {
    const highest = Math.max(
      ...flightList.map(f => Number(f.price ?? 0))
    );

    setMaxPrice(highest);
  }
}, [flightList]);
  /* ---------------- SYNC PROPS ---------------- */

  useEffect(() => {
    setFlightList(flights);
  }, [flights]);

  /* ---------------- REFRESH FLIGHTS ---------------- */

  const refreshFlightSeats = useCallback(async () => {
    try {
      const results = await searchFlights({
        from,
        to,
        departureDate:
          departureDate ??
          new Date().toISOString().split("T")[0],
        travellers: 1,
      });
  
      setFlightList(results);
    } catch (error) {
      console.error("Seat refresh failed:", error);
    }
  }, [from, to, departureDate]);

  const normalizedFlights =
    useMemo(() => {

      return flightList.map((f, i) =>
        normalizeFlight(f, i)
      );

    }, [flightList]);

    const airlines = useMemo(
      () =>
        Array.from(new Set(normalizedFlights.map((f) => f.airline)))
          .filter(Boolean)
          .sort(),
      [normalizedFlights]
    );

    const filteredFlights = useMemo(() => {
      let list = [...normalizedFlights];
    
      if (filters.nonStop) {
        list = list.filter(f =>
          f.stops.toLowerCase().includes("non")
        );
      }
    
      if (filters.oneStop) {
        list = list.filter(f =>
          f.stops.toLowerCase().includes("1")
        );
      }
    
      if (filters.earlyMorning) {
        list = list.filter(f => {
          const hour = parseInt(f.dep.split(":")[0]) || 0;
          return hour >= 0 && hour < 6;
        });
      }
    
      if (filters.morning) {
        list = list.filter(f => {
          const hour = parseInt(f.dep.split(":")[0]) || 0;
          return hour >= 6 && hour < 12;
        });
      }
    
      if (filters.afternoon) {
        list = list.filter(f => {
          const hour = parseInt(f.dep.split(":")[0]) || 0;
          return hour >= 12 && hour < 18;
        });
      }
    
      if (filters.evening) {
        list = list.filter(f => {
          const hour = parseInt(f.dep.split(":")[0]) || 0;
          return hour >= 18;
        });
      }
    
      if (selectedAirlines.length > 0) {
        list = list.filter(f =>
          selectedAirlines.includes(f.airline)
        );
      }
    
      if (maxPrice > 0) {
        list = list.filter(f => f.priceNumber <= maxPrice);
      }
    
      return list;
    
    }, [
      normalizedFlights,
      filters,
      selectedAirlines,
      maxPrice,
    ]);

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
        

          default:
            break;
      }

      return list;

    }, [filteredFlights, sortBy]);
    console.log({
      flightList,
      normalizedFlights,
      filteredFlights,
      sortedFlights,
      maxPrice,
    });
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

<div className="glass-card p-5 h-fit sticky top-24 rounded-2xl">

<div className="flex items-center justify-between mb-6">

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
        oneStop: false,

        earlyMorning: false,
        morning: false,
        afternoon: false,
        evening: false,
      });

      setSelectedAirlines([]);

      setMaxPrice(
        Math.max(...flightList.map(f => Number(f.price ?? 0)))
      );

    }}
    className="text-cyan-400 text-sm hover:text-cyan-300"
  >
    Clear
  </button>

</div>

{/* PRICE */}

<div className="mb-8">

  <h4 className="text-white font-semibold mb-4">
    Price Range
  </h4>

  <input
  type="range"
  min={0}
  max={Math.max(maxPrice, 1000)}
  step={500}
  value={maxPrice}
  onChange={(e) => setMaxPrice(Number(e.target.value))}
    className="w-full accent-cyan-500"
  />

  <div className="flex justify-between mt-3 text-sm text-white/60">

    <span>₹0</span>

    <span>
      ₹{maxPrice.toLocaleString("en-IN")}
    </span>

  </div>

</div>

{/* STOPS */}

<div className="mb-8">

  <h4 className="text-white font-semibold mb-4">
    Stops
  </h4>

  <div className="space-y-3">

    <label className="flex items-center gap-3 text-white cursor-pointer">

      <input
        type="checkbox"
        checked={filters.nonStop}
        onChange={() =>
          setFilters(prev => ({
            ...prev,
            nonStop: !prev.nonStop,
          }))
        }
      />

      Non Stop

    </label>

    <label className="flex items-center gap-3 text-white cursor-pointer">

      <input
        type="checkbox"
        checked={filters.oneStop}
        onChange={() =>
          setFilters(prev => ({
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

  <h4 className="text-white font-semibold mb-4">
    Departure Time
  </h4>

  <div className="space-y-2">

    {[
      {
        key: "earlyMorning",
        label: "Early Morning (00-06)"
      },
      {
        key: "morning",
        label: "Morning (06-12)"
      },
      {
        key: "afternoon",
        label: "Afternoon (12-18)"
      },
      {
        key: "evening",
        label: "Evening (18-24)"
      },
    ].map((item) => (

      <label
        key={item.key}
        className="flex items-center gap-3 text-white cursor-pointer"
      >

        <input
          type="checkbox"
          checked={filters[item.key as keyof typeof filters]}
          onChange={() =>
            setFilters(prev => ({
              ...prev,
              [item.key]:
                !prev[item.key as keyof typeof prev],
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

  <h4 className="text-white font-semibold mb-4">
    Airlines
  </h4>

  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">

    {airlines.map((airline) => (

      <label
        key={airline}
        className="flex items-center gap-3 text-white cursor-pointer"
      >

        <input
          type="checkbox"
          checked={selectedAirlines.includes(airline)}
          onChange={() => {

            setSelectedAirlines(prev =>

              prev.includes(airline)

                ? prev.filter(a => a !== airline)

                : [...prev, airline]

            );

          }}
        />

        {airline}

      </label>

    ))}

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
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">

<Image
  src={airlineLogos[flight.airline] ?? "/airlines/default.png"}
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


<div className="flex items-center gap-3 mt-4">

  <span className="font-semibold text-white">
    {from}
  </span>

  <div className="flex-1 border-t border-dashed border-cyan-500/40" />

  <span className="text-cyan-300 text-lg">✈</span>

  <div className="flex-1 border-t border-dashed border-cyan-500/40" />

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
  
              <div className="flex flex-col items-end gap-3">

<div className="text-right">

<p className="text-xs text-white/40">
  Per Traveller
</p>

<p className="text-3xl font-bold text-white">
  {flight.priceDisplay}
</p>

<p className="text-xs text-green-300 mt-1">
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
  
      </div>
    </div>
  );
}