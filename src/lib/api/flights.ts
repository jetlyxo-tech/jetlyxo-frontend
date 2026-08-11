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

/* =========================================================
   SEARCH FLIGHTS
========================================================= */
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
        Accept: "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      cache: "no-store",
    }
  );

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData?.message ??
        `Search failed (${response.status})`
    );
  }

  return responseData;
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

    return (
      response?.data ??
      response?.flights ??
      []
    );
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
  }
): Promise<FareQuoteResponse | null> {
  try {
    const response =
      await fetchFlightApi<{
        success?: boolean;
        data?: FareQuoteResponse;
        message?: string;
      }>("/flights/fare-quote", data);

    return response.data ?? null;

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