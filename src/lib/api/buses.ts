import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import { Bus } from "@/types";

/* =========================================================
   EXISTING LOCAL BUS APIs
   ========================================================= */

export interface BusSearchParams {
  from: string;
  to: string;
}

export async function searchBuses(
  params: BusSearchParams
): Promise<Bus[]> {
  try {
    const response = await apiClient.get("/buses/search", {
      params: {
        from: params.from,
        to: params.to,
      },
    });

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Bus[];
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Bus Search Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Bus search failed"
    );
  }
}

export async function fetchBuses(): Promise<Bus[]> {
  try {
    const response = await apiClient.get("/buses");

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Bus[];
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Fetch Buses Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to fetch buses"
    );
  }
}


/* =========================================================
   I2SPACE BUS APIs
   ========================================================= */

export interface I2SpaceBusSearchParams {
  from: string;
  to: string;
  date: string;
}

/**
 * Search live I2Space buses through our backend.
 *
 * Backend:
 * GET /search?type=bus&from=...&to=...&date=...
 */
export async function searchI2SpaceBuses(
  params: I2SpaceBusSearchParams
): Promise<Bus[]> {
  try {
    const response = await apiClient.get("/search", {
      params: {
        type: "bus",
        from: params.from,
        to: params.to,
        date: params.date,
      },
    });

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Bus[];
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "I2Space Bus Search Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "I2Space bus search failed"
    );
  }
}


/* =========================================================
   I2SPACE SELECT
   ========================================================= */

export interface I2SpaceSelectBusParams {
  traceId: string;
  busId: string;
  bpid: string | number;
  dpid: string | number;
  layout?: "Horizontal" | "Vertical";
}

export async function selectI2SpaceBus(
  params: I2SpaceSelectBusParams
) {
  try {
    const response = await apiClient.post(
      "/buses/select",
      {
        traceId: params.traceId,
        busId: params.busId,
        bpid: params.bpid,
        dpid: params.dpid,
        layout: params.layout ?? "Horizontal",
      }
    );

    return response.data?.data ?? response.data;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "I2Space Bus Select Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to select bus"
    );
  }
}


/* =========================================================
   I2SPACE BLOCK
   ========================================================= */

export interface I2SpacePassenger {
  name: string;
  gender: string;
  age: number;
  seatIds: string[];
}

export interface I2SpaceBlockBusParams {
  traceId: string;
  tripKey: string;
  bpid: string | number;
  dpid: string | number;
  email: string;
  phone: string;
  pax: I2SpacePassenger[];
}

export async function blockI2SpaceBus(
  params: I2SpaceBlockBusParams
) {
  try {
    const response = await apiClient.post(
      "/buses/block",
      {
        traceId: params.traceId,
        tripKey: params.tripKey,
        bpid: params.bpid,
        dpid: params.dpid,
        email: params.email,
        phone: params.phone,
        pax: params.pax,
      }
    );

    return response.data?.data ?? response.data;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "I2Space Bus Block Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to block bus"
    );
  }
}