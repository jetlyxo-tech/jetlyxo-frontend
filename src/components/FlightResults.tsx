"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { nextFlights } from "@/lib/api";
import { Flight } from "@/types";

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
  airlineCode?: string;

  from: string;
  to: string;

  priceNumber: number;
  priceDisplay: string;

  duration: string;
  dep: string;
  stops: string;
  seats: number | null;

  // LAYOVER DATA
  segments?: {
    from: string;
    to: string;
    departure?: string;
    arrival?: string;
    duration?: string;
    flightNumber?: string;
    airline?: string;
    airlineCode?: string;
    layoverMinutes?: number;
    layoverAirport?: string;
    layoverLocation?: string;
  }[];

  layoverMinutes?: number;
  layoverAirport?: string;
  layoverLocation?: string;

  cabin: string;
  fareType: string;
  badge?: string;
  searchId?: string;
  tId?: string;

  // ROUND TRIP
  tripType?: string;
  totalPrice?: number;

  returnFlight?: {
    id?: string | number;
    tId?: string;
    airline?: string;
    airlineCode?: string;
    from?: string;
    to?: string;
    departure?: string;
    arrival?: string;
    duration?: string;
    stops?: number;
    price?: number;
    seats?: number;
    cabin?: string;
    flightNumber?: string;
    totalPrice?: number;

    segments?: {
      from: string;
      to: string;
      departure?: string;
      arrival?: string;
      duration?: string;
      flightNumber?: string;
      airline?: string;
      airlineCode?: string;
      layoverMinutes?: number;
      layoverAirport?: string;
      layoverLocation?: string;
    }[];
  };
};

type FlightSegment = NonNullable<
  NormalizedFlight["segments"]
>[number];

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

function formatLayover(minutes?: number) {
  if (!minutes || minutes <= 0) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${mins}m`;
}


function formatFlightTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  const raw = String(value);

  // Already a simple HH:mm / HH:mm:ss value.
  const timeMatch = raw.match(/(?:T|\s)?(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  // Full date/time from Bonton.
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime()) && /[-/T]/.test(raw)) {
    return date.getTime();
  }

  return null;
}

function calculateLayoverMinutes(
  currentArrival?: string,
  nextDeparture?: string
) {
  if (!currentArrival || !nextDeparture) {
    return 0;
  }

  const arrivalTimestamp = getTimestamp(currentArrival);
  const departureTimestamp = getTimestamp(nextDeparture);

  if (
    arrivalTimestamp !== null &&
    departureTimestamp !== null
  ) {
    const minutes = Math.round(
      (departureTimestamp - arrivalTimestamp) / 60000
    );

    return minutes > 0 ? minutes : 0;
  }

  // Fallback when the provider gives only HH:mm values.
  const extractMinutes = (value: string) => {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match) {
      return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
  };

  const arrival = extractMinutes(String(currentArrival));
  const departure = extractMinutes(String(nextDeparture));

  if (arrival === null || departure === null) {
    return 0;
  }

  let difference = departure - arrival;

  // The next flight may depart after midnight.
  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

function getSegmentLayover(
  segment: FlightSegment,
  nextSegment?: FlightSegment
) {
  const providerMinutes = Number(
    nextSegment?.layoverMinutes ??
      segment.layoverMinutes ??
      0
  );

  if (providerMinutes > 0) {
    return providerMinutes;
  }

  return calculateLayoverMinutes(
    segment.arrival,
    nextSegment?.departure
  );
}

function getSegmentAirlineName(
  segment: FlightSegment,
  fallback: string
) {
  return (
    segment.airline ||
    fallback ||
    "Unknown Airline"
  );
}

function normalizeFlight(
  flight: Flight,
  index: number
): NormalizedFlight {
  const rawFlight = flight as any;

  const price = Number(flight.price ?? 0);

  /* ---------------------------------------------
     SEGMENTS
  --------------------------------------------- */

  const rawSegments =
    rawFlight.disseg ??
    rawFlight.fltseg ??
    rawFlight.segments ??
    [];

  const normalizeSegments = (segments: any[]) => {
    if (!Array.isArray(segments)) {
      return [];
    }

    return segments.map((segment: any) => ({
      from:
        segment.orgctco ??
        segment.orgapco ??
        segment.org ??
        segment.from ??
        "",

      to:
        segment.desctco ??
        segment.desapco ??
        segment.des ??
        segment.to ??
        "",

      departure:
        segment.deptm ??
        segment.departure ??
        undefined,

      arrival:
        segment.arrtm ??
        segment.arrival ??
        undefined,

      duration:
        segment.dur ??
        segment.duration ??
        undefined,

      flightNumber:
        segment.fltno ??
        segment.flightNumber ??
        undefined,

      airline:
        segment.airna ??
        segment.airline ??
        undefined,

      airlineCode:
        segment.airco ??
        segment.airlineCode ??
        undefined,

      layoverMinutes:
        Number(segment.laymin ?? 0) || 0,

      layoverAirport:
        segment.lay ??
        undefined,

      layoverLocation:
        segment.layat ??
        undefined,
    }));
  };

  const segments = normalizeSegments(rawSegments);

  /* ---------------------------------------------
     ONWARD ORIGIN / DESTINATION

     Priority:
     1. Bonton top-level org/des
     2. First/last segment
     3. Existing frontend values
  --------------------------------------------- */

  const journeyFrom =
    rawFlight.org ??
    rawFlight.orgctco ??
    rawFlight.orgapco ??
    segments[0]?.from ??
    flight.from ??
    "";

  const journeyTo =
    rawFlight.des ??
    rawFlight.desctco ??
    rawFlight.desapco ??
    segments[segments.length - 1]?.to ??
    flight.to ??
    "";

  /* ---------------------------------------------
     TOTAL PRICE
  --------------------------------------------- */

  const totalPrice =
    rawFlight.tripType === "ROUND_TRIP"
      ? Number(
          rawFlight.totalPrice ??
          price +
            Number(rawFlight.returnFlight?.price ?? 0)
        )
      : price;

  /* ---------------------------------------------
     STOPS
  --------------------------------------------- */

 const stopCount =
    typeof flight.stops === "number"
      ? flight.stops
      : Math.max(segments.length - 1, 0);

  /* ---------------------------------------------
     LAYOVER DATA
  --------------------------------------------- */

  const layoverMinutes =
    segments.length > 1
      ? segments
          .slice(0, -1)
          .reduce(
            (total: number, segment: any) =>
              total +
              Number(segment.layoverMinutes ?? 0),
            0
          )
      : 0;

  const layoverSegment =
    segments.find(
      (segment: any) =>
        Number(segment.layoverMinutes ?? 0) > 0
    ) ??
    (segments.length > 1
      ? segments[1]
      : undefined);

  /* ---------------------------------------------
     RETURN FLIGHT
  --------------------------------------------- */

  let normalizedReturnFlight:
    | NormalizedFlight["returnFlight"]
    | undefined;

  if (
    rawFlight.tripType === "ROUND_TRIP" &&
    rawFlight.returnFlight
  ) {
    const rawReturn = rawFlight.returnFlight;

    const rawReturnSegments =
      rawReturn.disseg ??
      rawReturn.fltseg ??
      rawReturn.segments ??
      [];

    const returnSegments =
      normalizeSegments(rawReturnSegments);

    const returnFrom =
      rawReturn.org ??
      rawReturn.orgctco ??
      rawReturn.orgapco ??
      returnSegments[0]?.from ??
      rawReturn.from ??
      "";

    const returnTo =
      rawReturn.des ??
      rawReturn.desctco ??
      rawReturn.desapco ??
      returnSegments[
        returnSegments.length - 1
      ]?.to ??
      rawReturn.to ??
      "";

    normalizedReturnFlight = {
      id: rawReturn.id,

      tId: rawReturn.tId,

      airline:
        rawReturn.airline ||
        rawReturn.airna ||
        returnSegments[0]?.airline ||
        "",

      airlineCode:
        rawReturn.airlineCode ||
        rawReturn.airco ||
        returnSegments[0]?.airlineCode ||
        "",

      from: returnFrom,

      to: returnTo,

      departure:
        rawReturn.departure,

      arrival:
        rawReturn.arrival,

      duration:
        rawReturn.duration,

      stops:
        typeof rawReturn.stops === "number"
          ? rawReturn.stops
          : Math.max(
              returnSegments.length - 1,
              0
            ),

      price:
        Number(rawReturn.price ?? 0),

      seats:
        rawReturn.seats,

      cabin:
        rawReturn.cabin ??
        "Economy",

      flightNumber:
        rawReturn.flightNumber,

      segments:
        returnSegments,

      totalPrice:
        Number(
          rawReturn.totalPrice ??
          rawReturn.price ??
          0
        ),
    };
  }

  /* ---------------------------------------------
     DEBUG
  --------------------------------------------- */

  console.log(
    "========== NORMALIZED FLIGHT ==========",
    {
      id: flight.id,
      tripType: rawFlight.tripType,

      onward: {
        from: journeyFrom,
        to: journeyTo,
        stops: stopCount,
        segments,
      },

      returnFlight:
        normalizedReturnFlight
          ? {
              from:
                normalizedReturnFlight.from,
              to:
                normalizedReturnFlight.to,
              stops:
                normalizedReturnFlight.stops,
              segments:
                normalizedReturnFlight.segments,
            }
          : null,
    }
  );

  /* ---------------------------------------------
     FINAL NORMALIZED FLIGHT
  --------------------------------------------- */

 return {
  id: flight.id ?? index,

  airline:
    rawFlight.airline ||
    rawFlight.airna ||
    rawFlight.airlineName ||
    segments[0]?.airline ||
    "Unknown Airline",

  airlineCode:
    rawFlight.airlineCode ||
    rawFlight.airco ||
    segments[0]?.airlineCode ||
    "",

    /*
      IMPORTANT:
      Use the complete itinerary endpoints,
      not an intermediate stop.
    */
    from: journeyFrom,

    to: journeyTo,

    priceNumber:
      totalPrice,

    priceDisplay:
      price > 0
        ? `₹${price.toLocaleString("en-IN")}`
        : "—",

    duration:
      flight.duration ||
      "N/A",

    dep:
      flight.departure ||
      "--:--",

    stops:
      stopCount === 0
        ? "Non-stop"
        : `${stopCount} ${
             stopCount === 1 ? "Stop" : "Stops"
      }`,

    segments,

    layoverMinutes,

    layoverAirport:
      layoverSegment?.layoverAirport ??
      layoverSegment?.from,

    layoverLocation:
      layoverSegment?.layoverLocation,

    seats:
      flight.seats ?? null,

    cabin:
      "Economy",

    fareType:
      "Regular Fare",

    badge:
      index === 0
        ? "Best Value"
        : undefined,

    searchId:
      flight.searchId,

    tId:
      flight.tId,

    /* ROUND TRIP */
    tripType:
      rawFlight.tripType,

    returnFlight:
      normalizedReturnFlight,

    totalPrice,
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
  tripType,
  returnFlightId,
  returnTId,
}: {
  priceNumber: number;
  airline: string;
  duration: string;
  flightId: Flight["id"];
  searchId?: string;
  tId?: string;
  tripType?: string;
  returnFlightId?: string | number;
  returnTId?: string;
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
       `&tripType=${encodeURIComponent(tripType ?? "ONEWAY")}` +
      `&returnFlightId=${encodeURIComponent(
        String(returnFlightId ?? "")
      )}` +
      `&returnTId=${encodeURIComponent(
        returnTId ?? ""
      )}` +
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
{tripType === "ROUND_TRIP"
  ? "Book Round Trip →"
  : "Book Flight →"}
    </button>
  );
}

/* ---------------------------------------------
   COMPONENT
--------------------------------------------- */

export default function FlightResults({
  flights,
  from,
  to,
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
  

  const [searchStid, setSearchStid] =
  useState<string>(
    (flights[0] as any)?.stid ?? ""
  );

  const [nextSkip, setNextSkip] =
  useState(flights.length);

  const [loadingMore, setLoadingMore] =
  useState(false);

  const [hasMoreFlights, setHasMoreFlights] =
  useState(true);

  const nextRequestInProgress = useRef(false);
  const priceInitialized = useRef(false);

  useEffect(() => {
  priceInitialized.current = false;
  setFlightList(flights);

  const firstFlight = flights[0] as any;

  setSearchStid(firstFlight?.stid ?? "");

  setNextSkip(flights.length);

  setHasMoreFlights(true);
}, [flights]);

 useEffect(() => {
  if (!flightList.length) return;

  const highest = Math.max(
    ...flightList.map((f: any) => {
      if (f.tripType === "ROUND_TRIP") {
        return Number(
          f.totalPrice ??
          Number(f.price ?? 0) +
            Number(f.returnFlight?.price ?? 0)
        );
      }

      return Number(f.price ?? 0);
    })
  );

  setSliderMax(highest);

  // Initialize price only once for the original search results.
  // Do NOT reset it after NEXT/filter responses.
  if (!priceInitialized.current) {
    setPriceLimit(highest);
    priceInitialized.current = true;
  }
}, [flightList]);

/* ---------------------------------------------
   BONTON NEXT FILTER BUILDER
--------------------------------------------- */

const buildNextFilters = ({
  nextSelectedAirlines = selectedAirlines,
  nextNonStop = filters.nonStop,
  nextOneStop = filters.oneStop,
  nextPriceLimit = priceLimit,
}: {
  nextSelectedAirlines?: string[];
  nextNonStop?: boolean;
  nextOneStop?: boolean;
  nextPriceLimit?: number;
} = {}) => {
  const nextFilters: {
    minp?: number;
    maxp?: number;
    air?: {
      airline_code: string;
      airline_name: string;
    }[];
    stp?: number[];
  } = {
    minp: 0,
    maxp: nextPriceLimit,
  };

  // Airline
  if (nextSelectedAirlines.length > 0) {
    const airlineMap = new Map<
      string,
      {
        airline_code: string;
        airline_name: string;
      }
    >();

    normalizedFlights.forEach((flight) => {
      if (
        nextSelectedAirlines.includes(flight.airline) &&
        flight.airlineCode
      ) {
        airlineMap.set(flight.airlineCode, {
          airline_code: flight.airlineCode,
          airline_name: flight.airline,
        });
      }
    });

    if (airlineMap.size > 0) {
      nextFilters.air = Array.from(airlineMap.values());
    }
  }

  // Stops
  if (nextNonStop || nextOneStop) {
    const stops: number[] = [];

    if (nextNonStop) {
      stops.push(0);
    }

    if (nextOneStop) {
      stops.push(1);
    }

    nextFilters.stp = stops;
  }

  return nextFilters;
};


/* ---------------------------------------------
   LOAD MORE FLIGHTS — BONTON NEXT
--------------------------------------------- */

const loadNextFlights = useCallback(async () => {
  if (!searchStid) {
    toast.error("Flight search session is missing");
    return;
  }

 if (loadingMore || !hasMoreFlights) {
  return;
}

if (nextRequestInProgress.current) {
  console.log(
    "Next request already in progress — skipping duplicate call"
  );
  return;
}

nextRequestInProgress.current = true;

try {
  setLoadingMore(true);

    const nextFilters = buildNextFilters();

    console.log(
      "========== LOADING NEXT FLIGHTS =========="
    );

    console.log({
      stid: searchStid,
      filters: nextFilters,
      skip: nextSkip,
      take: 20,
      isdom: true,
      isret: false,
    });

    const response = await nextFlights({
      stid: searchStid,
      filters: nextFilters,
      skip: nextSkip,
      take: 20,
      isdom: true,
      isret: false,
    });

    const newFlights = response.flights ?? [];

    if (response.stid) {
      setSearchStid(response.stid);
    }

    setHasMoreFlights(
      response.isComplete !== true
);

    console.log(
      "========== NEXT FLIGHTS RECEIVED =========="
    );

    console.log("Received:", newFlights.length);

    if (!newFlights.length) {
      setHasMoreFlights(false);

      toast.info("No more flights available");

      return;
    }

    setFlightList((prev) => {
      const originalSearchId =
        prev[0]?.searchId ?? "";

      const enrichedFlights = newFlights.map(
        (flight) => ({
          ...flight,

          searchId:
            flight.searchId ||
            originalSearchId,

          stid:
            (flight as any).stid ||
            response.stid ||
            searchStid,
        })
      );

      return [
        ...prev,
        ...enrichedFlights,
      ];
    });

    setNextSkip(
      (prev) => prev + newFlights.length
    );
  } catch (error) {
    console.error(
      "Load More Flights Error:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Unable to load more flights"
    );
  } finally {
  setLoadingMore(false);
  nextRequestInProgress.current = false;
}
}, [
  searchStid,
  nextSkip,
  loadingMore,
  hasMoreFlights,
  selectedAirlines,
  filters.nonStop,
  filters.oneStop,
  priceLimit,
]);

 

/* ---------------------------------------------
   NORMALIZED DATA
--------------------------------------------- */
console.log(
  "========== FRONTEND ROUND TRIP DETAILS ==========",
  flightList
    .filter((f: any) => f.tripType === "ROUND_TRIP")
    .slice(0, 3)
    .map((f: any) => ({
      id: f.id,
      tripType: f.tripType,

      onward: {
        from: f.from,
        to: f.to,
        departure: f.departure,
        price: f.price,
      },

      returnFlight: f.returnFlight
        ? {
            id: f.returnFlight.id,
            from: f.returnFlight.from,
            to: f.returnFlight.to,
            departure: f.returnFlight.departure,
            arrival: f.returnFlight.arrival,
            duration: f.returnFlight.duration,
            stops: f.returnFlight.stops,
            price: f.returnFlight.price,
            tId: f.returnFlight.tId,
        }
        : null,

      totalPrice: f.totalPrice,
    }))
);
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




const applyProviderFilters = useCallback(
  async ({
    nextSelectedAirlines = selectedAirlines,
    nextNonStop = filters.nonStop,
    nextOneStop = filters.oneStop,
    nextPriceLimit = priceLimit,
  }: {
    nextSelectedAirlines?: string[];
    nextNonStop?: boolean;
    nextOneStop?: boolean;
    nextPriceLimit?: number;
  } = {}) => {
    if (!searchStid) {
      toast.error("Flight search session is missing");
       return;
}

    if (nextRequestInProgress.current) {
      console.log(
       "Next request already in progress — skipping duplicate call"
  );
       return;
}

nextRequestInProgress.current = true;

try {
  setLoadingMore(true);

      const nextFilters = buildNextFilters({
        nextSelectedAirlines,
        nextNonStop,
        nextOneStop,
        nextPriceLimit,
      });

      console.log("========== APPLY BONTON FILTERS ==========");
      console.log({
        stid: searchStid,
        filters: nextFilters,
        skip: 0,
        take: 20,
        isdom: true,
        isret: false,
      });

      const response = await nextFlights({
        stid: searchStid,
        filters: nextFilters,
        skip: 0,
        take: 20,
        isdom: true,
        isret: false,
      });

      const newFlights = response.flights ?? [];
     
      const enrichedFlights = newFlights.map((flight) => ({
  ...flight,
  stid:
    (flight as any).stid ||
    response.stid ||
    searchStid,
}));

/*
 * Bonton should apply the stop filter server-side,
 * but we enforce it locally as well so the UI never
 * displays flights that do not match the selected filter.
 */
const filteredProviderFlights = enrichedFlights.filter(
  (flight: any) => {
    const segments =
      flight.segments ??
      flight.disseg ??
      flight.fltseg ??
      [];

const stopCount =
      typeof flight.stops === "number"
        ? flight.stops
        : Math.max(segments.length - 1, 0);

    if (nextNonStop && !nextOneStop) {
      return stopCount === 0;
    }

    if (nextOneStop && !nextNonStop) {
      return stopCount === 1;
    }

    if (nextNonStop && nextOneStop) {
      return stopCount === 0 || stopCount === 1;
    }

    return true;
  }
);


setFlightList(filteredProviderFlights);

console.log(
  "========== FILTERED FLIGHTS RECEIVED ==========",
  {
    received: enrichedFlights.length,
    afterStopFilter: filteredProviderFlights.length,
    nonStop: nextNonStop,
    oneStop: nextOneStop,
  }
);
     

    console.log(
  "========== FILTERED FLIGHTS RECEIVED ==========",
  {
    received: enrichedFlights.length,
    afterStopFilter: filteredProviderFlights.length,
    nonStop: nextNonStop,
    oneStop: nextOneStop,
  }
);
    } catch (error) {
      console.error(
        "Apply Provider Filters Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to apply flight filters"
      );
    } finally {
  setLoadingMore(false);
  nextRequestInProgress.current = false;
}
  },
  [
    searchStid,
    selectedAirlines,
    filters.nonStop,
    filters.oneStop,
    priceLimit,
    normalizedFlights,
  ]
);



/* ---------------------------------------------
   FILTERS
--------------------------------------------- */

  const filteredFlights =
    useMemo(() => {
      let list = [...normalizedFlights];

      
     if (filters.nonStop || filters.oneStop) {
       list = list.filter((f) => {
         const isNonStop = f.stops === "Non-stop";
         const isOneStop = f.stops === "1 Stop";

         return (
          (filters.nonStop && isNonStop) ||
          (filters.oneStop && isOneStop)
    );
  });
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
  const resetFilters = {
    nonStop: false,
    oneStop: false,
    earlyMorning: false,
    morning: false,
    afternoon: false,
    evening: false,
  };

  setFilters(resetFilters);
  setSelectedAirlines([]);
  setPriceLimit(sliderMax);

  applyProviderFilters({
    nextSelectedAirlines: [],
    nextNonStop: false,
    nextOneStop: false,
    nextPriceLimit: sliderMax,
  });
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
  onChange={(e) => {
    setPriceLimit(Number(e.target.value));
  }}
  onMouseUp={(e) => {
    const value = Number(e.currentTarget.value);

    console.log("PRICE FILTER → NEXT:", value);

    applyProviderFilters({
      nextPriceLimit: value,
    });
  }}
  onTouchEnd={(e) => {
    const value = Number(e.currentTarget.value);

    console.log("PRICE FILTER → NEXT:", value);

    applyProviderFilters({
      nextPriceLimit: value,
    });
  }}
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
                 onChange={() => {
  const nextValue = !filters.nonStop;

  setFilters((prev) => ({
    ...prev,
    nonStop: nextValue,
  }));

  applyProviderFilters({
    nextNonStop: nextValue,
    nextOneStop: filters.oneStop,
  });
}}
              />

              Non Stop

            </label>

            <label className="flex items-center gap-3 cursor-pointer text-white">

              <input
                type="checkbox"
                checked={filters.oneStop}
                
              onChange={() => {
  const nextValue = !filters.nonStop;

  console.log("🔥 NON STOP CLICKED", {
    nextValue,
    currentNonStop: filters.nonStop,
    currentOneStop: filters.oneStop,
  });

  setFilters((prev) => ({
    ...prev,
    nonStop: nextValue,
  }));

  applyProviderFilters({
    nextNonStop: nextValue,
    nextOneStop: filters.oneStop,
  });
}}
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
                 onChange={() => {
  const nextSelectedAirlines =
    selectedAirlines.includes(airline)
      ? selectedAirlines.filter(
          (a) => a !== airline
        )
      : [...selectedAirlines, airline];

  setSelectedAirlines(nextSelectedAirlines);

  applyProviderFilters({
    nextSelectedAirlines,
  });
}}
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

  <div className="flex gap-2 mt-2 flex-wrap">
    {/* Trip Type */}
    {flight.tripType === "ROUND_TRIP" ? (
      <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
        Round Trip
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">
        One Way
      </span>
    )}

    {/* Cabin */}
    <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs">
      {flight.cabin}
    </span>

    {/* Fare Type */}
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

{/* =========================================
    SEGMENT TIMELINE
========================================= */}

{(() => {
  const renderSegmentTimeline = (
    segments: NormalizedFlight["segments"],
    fallbackFrom: string,
    fallbackTo: string,
    fallbackAirline: string,
    theme: "onward" | "return"
  ) => {
    const safeSegments = Array.isArray(segments)
      ? segments.filter(
          (segment) => segment && (segment.from || segment.to)
        )
      : [];

    /*
     * Fallback for a flight where the provider did not expose
     * segment details. This preserves the existing nonstop UI.
     */
    if (!safeSegments.length) {
      return (
        <div className="mt-4">
          <p
            className={`text-xs font-semibold mb-2 ${
              theme === "return"
                ? "text-purple-400"
                : "text-cyan-400"
            }`}
          >
            {theme === "return" ? "RETURN" : "DEPARTURE"}
          </p>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white">
                {fallbackFrom || "--"}
              </span>

              <div className="flex-1 border-t border-dashed border-white/20" />

              <span
                className={
                  theme === "return"
                    ? "text-purple-300 text-lg"
                    : "text-cyan-300 text-lg"
                }
              >
                ✈
              </span>

              <div className="flex-1 border-t border-dashed border-white/20" />

              <span className="font-semibold text-white">
                {fallbackTo || "--"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <p
          className={`text-xs font-semibold mb-3 ${
            theme === "return"
              ? "text-purple-400"
              : "text-cyan-400"
          }`}
        >
          {theme === "return" ? "RETURN" : "DEPARTURE"}
        </p>

        <div className="space-y-0">
          {safeSegments.map((segment, index) => {
            const nextSegment = safeSegments[index + 1];

            const layoverMinutes = nextSegment
              ? getSegmentLayover(segment, nextSegment)
              : 0;

            const layoverAirport =
              nextSegment?.from ||
              segment.layoverAirport ||
              "";

            const layoverLocation =
              segment.layoverLocation ||
              nextSegment?.layoverLocation ||
              "";

            const airlineName = getSegmentAirlineName(
              segment,
              fallbackAirline
            );

            return (
              <div key={`${segment.from}-${segment.to}-${index}`}>
                {/* FLIGHT SEGMENT */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-4">
                    {/* Departure */}
                    <div>
                      <p className="text-xl font-bold text-white">
                        {formatFlightTime(segment.departure)}
                      </p>
                      <p className="text-sm font-semibold text-cyan-200 mt-1">
                        {segment.from || "--"}
                      </p>
                    </div>

                    {/* Segment details */}
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          <Image
                            src={
                              airlineLogos[airlineName] ??
                              "/airlines/default.png"
                            }
                            alt={airlineName}
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {airlineName}
                          </p>

                          <p className="text-xs text-white/50 mt-0.5">
                            {segment.flightNumber
                              ? `${segment.airlineCode || ""}${
                                  segment.airlineCode
                                    ? "-"
                                    : ""
                                }${segment.flightNumber}`
                              : "Flight number unavailable"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            theme === "return"
                              ? "bg-purple-400"
                              : "bg-cyan-400"
                          }`}
                        />

                        <div className="flex-1 border-t border-dashed border-white/20" />

                        <span
                          className={
                            theme === "return"
                              ? "text-purple-300"
                              : "text-cyan-300"
                          }
                        >
                          ✈
                        </span>

                        <div className="flex-1 border-t border-dashed border-white/20" />

                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            theme === "return"
                              ? "bg-purple-400"
                              : "bg-cyan-400"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-white/50">
                          {segment.duration || "Duration unavailable"}
                        </p>

                        <p className="text-xs text-white/50">
                          Arrives{" "}
                          <span className="text-white/80 font-medium">
                            {formatFlightTime(segment.arrival)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LAYOVER / CHANGE OF PLANES */}
                {nextSegment && (
                  <div className="relative py-3">
                    <div className="absolute left-[38px] sm:left-[43px] top-0 bottom-0 border-l border-dashed border-yellow-500/40" />

                    <div className="relative ml-16 sm:ml-[68px] rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">
                          ⏱
                        </span>

                        <span className="text-sm font-semibold text-white">
                          Change of planes
                        </span>
                      </div>

                      <p className="text-sm text-cyan-300 font-medium mt-1">
                        {layoverMinutes > 0
                          ? `${formatLayover(
                              layoverMinutes
                            )} layover`
                          : "Layover"}
                      </p>

                      <p className="text-xs text-white/60 mt-1">
                        {layoverLocation
                          ? `Layover in ${layoverLocation}`
                          : layoverAirport
                          ? `Layover at ${layoverAirport}`
                          : "Connecting flight"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* OUTBOUND */}
      {renderSegmentTimeline(
        flight.segments ?? [],
        flight.from || from || "",
        flight.to || to || "",
        flight.airline,
        "onward"
      )}

      {/* ROUND-TRIP RETURN */}
      {flight.returnFlight && (
        <div className="mt-6 pt-5 border-t border-white/10">
          {renderSegmentTimeline(
            flight.returnFlight.segments ?? [],
            flight.returnFlight.from || "",
            flight.returnFlight.to || "",
            flight.returnFlight.airline || flight.airline,
            "return"
          )}
        </div>
      )}
    </>
  );
})()}

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
                    {flight.tripType === "ROUND_TRIP"
  ? "Total Round Trip"
  : "Per Traveller"}
                  </p>

                  <p className="text-3xl font-bold text-white">
                    {flight.tripType === "ROUND_TRIP"
  ? `₹${Number(flight.totalPrice ?? flight.priceNumber).toLocaleString("en-IN")}`
  : flight.priceDisplay}
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
  tripType={flight.tripType}
  returnFlightId={flight.returnFlight?.id}
  returnTId={flight.returnFlight?.tId}
/>
              </div>
            </motion.div>
          ))}
                </div>

        {/* LOAD MORE FLIGHTS */}

        {hasMoreFlights && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={loadNextFlights}
              disabled={loadingMore}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore
                ? "Loading flights..."
                : "Load More Flights"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}