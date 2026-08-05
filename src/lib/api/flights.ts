import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import {
  Flight,
  FlightSearchParams,
} from "@/types";

export async function searchFlights(
  params: FlightSearchParams
): Promise<Flight[]> {
  try {
    const response = await apiClient.get(
      "/flights/search",
      {
        params: {
          origin: params.from,
          destination: params.to,
          departureDate: params.departureDate,
        
          adults: params.travellers ?? 1,
          children: params.children ?? 0,
          infants: params.infants ?? 0,
        
          cabin: params.cabin,
          fareType: params.fareType,
          tripType: params.tripType,
        },
      }
    );

    return (
      response.data?.data ??
      response.data?.flights ??
      []
    );
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Flight Search Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Flight search failed"
    );
  }
}


export async function seatMap(data: {
  dId: string;
  pax: any[];
}) {
  const response = await apiClient.post(
    "/flights/seat-map",
    data
  );

  return response.data.data;
}

export async function meal(data: {
  dId: string;
}) {
  const response = await apiClient.post(
    "/flights/meal",
    data
  );

  return response.data.data;
}

export async function retrieveBooking(
  bookingCode: string
) {
  const response = await apiClient.get(
    `/flights/retrieve/${bookingCode}`
  );

  return response.data.data;
}

export async function bookFlight(data: any) {
  const response = await apiClient.post(
    "/flights/book",
    data
  );

  return response.data.data;
}
export async function fareQuote(data: {
  id: string | number;
  searchId: string;
  tId: string;
}) {
  const response = await apiClient.post(
    "/flights/fare-quote",
    data
  );

  return response.data.data.data;
}


export async function initiateAmendment(
  bookingCode: string
) {
  const response = await apiClient.get(
    `/flights/initiate-amendment/${bookingCode}`
  );

  return response.data.data;
}

export async function createAmendment(
  data: any
) {
  const response = await apiClient.post(
    "/flights/create-amendment",
    data
  );

  return response.data.data;
}

export async function amendmentRecord(
  amendmentId: string
) {
  const response = await apiClient.get(
    `/flights/amendment-record/${amendmentId}`
  );

  return response.data.data;
}

export async function acceptAmendment(
  amendmentId: string
) {
  const response = await apiClient.post(
    `/flights/accept-amendment/${amendmentId}`
  );

  return response.data.data;
}

export async function cancelAmendment(
  amendmentId: string,
  reason = "reject"
) {
  const response = await apiClient.post(
    `/flights/cancel-amendment/${amendmentId}`,
    {
      reason,
    }
  );

  return response.data.data;
}

