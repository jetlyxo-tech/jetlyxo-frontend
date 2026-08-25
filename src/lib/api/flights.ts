import { AxiosError } from "axios";
import { API_URL } from "@/config/env";
import { getToken } from "@/lib/auth";


import apiClient from "@/lib/apiClient";
import {
  Flight,
  FlightSearchParams,
} from "@/types";

async function fetchFlightApi<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData?.message ??
        `Request failed (${response.status})`
    );
  }

  return responseData;
}

async function fetchFlightSearchApi(
  endpoint: string,
  params: Record<string, string | number | undefined>
) {
  const token = getToken();

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  const response = await fetch(
    `${API_URL}${endpoint}?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/x-ndjson",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = `Search failed (${response.status})`;

    try {
      const errorText = await response.text();

      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);

          message =
            errorData?.message ||
            message;
        } catch {
          message = errorText;
        }
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error(
      "Search response stream is not available"
    );
  }

  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  const chunks: any[] = [];

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const lines = buffer.split(/\r?\n/);

    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      let chunk: any;

      try {
        chunk = JSON.parse(trimmed);
      } catch (error) {
        console.warn(
          "[Flight Search] Failed to parse NDJSON chunk:",
          trimmed.substring(0, 500)
        );

        continue;
      }

      if (chunk?.type === "error") {
        throw new Error(
          chunk.message ||
            "Flight search failed"
        );
      }

      chunks.push(chunk);
    }
  }

  buffer += decoder.decode();

  const finalLine = buffer.trim();

  if (finalLine) {
    try {
      const chunk = JSON.parse(finalLine);

      if (chunk?.type === "error") {
        throw new Error(
          chunk.message ||
            "Flight search failed"
        );
      }

      chunks.push(chunk);
    } catch (error) {
      console.warn(
        "[Flight Search] Failed to parse final NDJSON chunk:",
        finalLine.substring(0, 500)
      );
    }
  }

 
  const flightChunks = chunks.filter(
  (chunk) =>
    chunk?.type === "flight_chunk"
);

const completionChunk =
  chunks.find(
    (chunk) =>
      chunk?.type === "search_complete"
  ) || null;

/*
 * BONTON NDJSON STREAMING
 *
 * Keep flight_chunk data exactly as received.
 * We use it as the fallback streaming dataset.
 */
const streamedFlights = flightChunks.flatMap(
  (chunk) => {
    if (Array.isArray(chunk?.data)) {
      return chunk.data;
    }

    if (
      Array.isArray(chunk?.data?.flights)
    ) {
      return chunk.data.flights;
    }

    return [];
  }
);


let completedFlights: any[] = [];

if (Array.isArray(completionChunk?.data)) {
  completedFlights = completionChunk.data;
} else if (
  Array.isArray(completionChunk?.data?.flights)
) {
  completedFlights =
    completionChunk.data.flights;
}

/*
 * Final flight dataset:
 *
 * 1. Use normalized search_complete flights
 *    when available.
 *
 * 2. Otherwise fall back to the NDJSON
 *    flight_chunk flights.
 *
 * NDJSON streaming is NOT removed.
 */
const flights =
  completedFlights.length > 0
    ? completedFlights
    : streamedFlights;

  return {
    success: true,

    provider:
      completionChunk?.provider ||
      flightChunks[0]?.provider ||
      "BONTON",

    searchId:
      completionChunk?.searchId ||
      flightChunks.find(
        (chunk) => chunk?.searchId
      )?.searchId ||
      "",

    stid:
      completionChunk?.stid ||
      flightChunks.find(
        (chunk) => chunk?.stid
      )?.stid ||
      "",

    count: flights.length,

    data: flights,

    complete:
      completionChunk?.complete === true,
  };
}

export async function searchFlights(
  params: FlightSearchParams
): Promise<Flight[]> {
  try {
    const response = await fetchFlightSearchApi(
      "/flights/search",
      {
        origin: params.from,
        destination: params.to,
        departureDate: params.departureDate,
        returnDate: params.returnDate,

        adults: params.travellers ?? 1,
        children: params.children ?? 0,
        infants: params.infants ?? 0,

        cabin: params.cabin,
        fareType: params.fareType,
        tripType: params.tripType,
      }
    );

    const flights: Flight[] =
      response?.data ?? [];

    // Bonton search ID used by Fare Quote
    const searchId =
      response?.searchId ?? "";

    // Bonton trace ID required by /flightapi/next
    const stid =
      response?.stid ??
      "";

    const responseTId = "";

    return flights.map((flight: any) => ({
      ...flight,

      searchId:
        flight.searchId ||
        searchId,

      // IMPORTANT:
      // Preserve Bonton STID for Next API filtering/pagination.
      stid:
        flight.stid ||
        stid,

      tId:
        flight.tId ||
        responseTId,

      // Also preserve search context on nested return flight.
      returnFlight: flight.returnFlight
        ? {
            ...flight.returnFlight,

            searchId:
              flight.returnFlight.searchId ||
              flight.searchId ||
              searchId,

            stid:
              flight.returnFlight.stid ||
              flight.stid ||
              stid,
          }
        : flight.returnFlight,
    }));
  } catch (error) {
    console.error(
      "Flight Search Error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Flight search failed"
    );
  }
}

/* =========================================================
   NEXT FLIGHTS — BONTON PAGINATION / FILTERING
========================================================= */

export interface NextFlightFilters {
  minp?: number;
  maxp?: number;

  ischp?: boolean;
  isqck?: boolean;
  isqckdep?: boolean;
  isqckarr?: boolean;

  isrf?: boolean;
  isnrf?: boolean;
  ishld?: boolean;

  air?: {
    airline_code: string;
    airline_name: string;
  }[];

  stp?: number[];
  rstp?: number[];

  depairlst?: {
    code: string;
    name: string;
  }[];

  arrairlst?: {
    code: string;
    name: string;
  }[];

  rdepairlst?: {
    code: string;
    name: string;
  }[];

  rarrairlst?: {
    code: string;
    name: string;
  }[];

  deptm?: string[];
  rdeptm?: string[];

  arrtm?: string[];
  rarrtm?: string[];

  laydur?: string[];

  airstr?: string[];

  laycty?: string;

  depair?: string;
  arrair?: string;

  rdepair?: string;
  rarrair?: string;
}

export interface NextFlightPayload {
  stid: string;
  filters?: NextFlightFilters;
  skip: number;
  take: number;
  isdom: boolean;
  isret: boolean;
}

export interface NextFlightResponse {
  provider?: string;
  searchId?: string;
  stid?: string;
  count?: number;
  isComplete?: boolean;
  flights?: Flight[];
  raw?: unknown;
}

export async function nextFlights(
  payload: NextFlightPayload
): Promise<NextFlightResponse> {
  try {
    const response =
      await fetchFlightApi<{
        success?: boolean;
        data?: NextFlightResponse;
        message?: string;
      }>(
        "/flights/next",
        payload
      );

    return response.data ?? {
      provider: "BONTON",
      searchId: "",
      stid: payload.stid,
      count: 0,
      flights: [],
    };
  } catch (error) {
    console.error(
      "Next Flights Error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to load more flights"
    );
  }
}
/* =========================================================
   SEAT MAP
========================================================= */

export async function seatMap(data: {
  dId: string;
  pax: any[];
}) {
  try {
    const response = await fetchFlightApi<{
      success?: boolean;
      data?: unknown;
      message?: string;
    }>("/flights/seat-map", data);

    return response.data ?? null;
  } catch (error) {
    console.error("Seat Map Error:", error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to load seat map"
    );
  }
}

/* =========================================================
   MEAL / BAGGAGE / SSR
========================================================= */

export async function meal(data: {
  dId: string;
}) {
  try {
    const response = await fetchFlightApi<{
      success?: boolean;
      data?: {
        success?: boolean;
        message?: string;
        errorCode?: string | null;
        data?: unknown;
      };
      message?: string;
    }>("/flights/meal", data);

    /*
      Backend response:

      {
        success: true,
        data: {
          success: true,
          message: "Success",
          errorCode: null,
          data: {
            mealId: "...",
            isssr: true,
            dtl: [...]
          }
        }
      }
    */

    const bontonResponse = response.data;

    const ssrData =
      bontonResponse?.data ?? null;

    console.log(
      "========== FLIGHT SSR API =========="
    );

    console.log(
      "Bonton SSR Response:",
      bontonResponse
    );

    console.log(
      "Parsed SSR Data:",
      ssrData
    );

    console.log(
      "SSR Detail Sections:",
      (ssrData as any)?.dtl ?? []
    );

    console.log(
      "===================================="
    );

    return {
      ...bontonResponse,
      data: ssrData,
    };
  } catch (error) {
    console.error(
      "Meal / SSR Error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to load meal and baggage options"
    );
  }
}          
  
    
/* =========================================================
   RETRIEVE BOOKING
========================================================= */

export async function retrieveBooking(
  bookingCode: string
) {
  try {
    const response = await apiClient.get(
      `/flights/retrieve/${encodeURIComponent(
        bookingCode
      )}`
    );

    return response.data?.data ?? null;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Retrieve Booking Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Unable to retrieve booking"
    );
  }
}

/* =========================================================
   BOOK FLIGHT
========================================================= */

export async function bookFlight(
  data: any
) {
  try {
    const response = await apiClient.post(
      "/flights/book",
      data
    );

    return response.data?.data ?? null;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Book Flight Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Flight booking failed"
    );
  }
}

/* =========================================================
   FARE QUOTE
========================================================= */

export interface FareQuoteResponse {
  dId?: string;

  data?: {
    dId?: string;

    data?: {
      dId?: string;
      [key: string]: unknown;
    };

    [key: string]: unknown;
  };

  [key: string]: unknown;
}

export async function fareQuote(
  data: {
    id: string | number;
    searchId: string;
    tId: string;
    returnId?: string | number;
    returnTId?: string;
  }
): Promise<any> {
  try {
    console.log(
      "========== FARE QUOTE REQUEST =========="
    );
    console.log(
      JSON.stringify(data, null, 2)
    );
    console.log(
      "========================================"
    );

    const response = await fetchFlightApi<any>(
      "/flights/fare-quote",
      data
    );

    console.log(
      "========== FARE QUOTE API RESPONSE =========="
    );
    console.log(
      JSON.stringify(response, null, 2)
    );
    console.log(
      "============================================="
    );

    return response?.data ?? null;

  } catch (error) {
    console.error(
      "Fare Quote Error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Fare quote failed"
    );
  }
}


/* =========================================================
   AMENDMENT (re-exported — see amendments.ts)
========================================================= */

export {
  initiateAmendment,
  createAmendment,
  amendmentRecord,
  acceptAmendment,
  cancelAmendment,
} from "./amendments";