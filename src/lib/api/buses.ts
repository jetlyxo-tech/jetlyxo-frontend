import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import { Bus } from "@/types";

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