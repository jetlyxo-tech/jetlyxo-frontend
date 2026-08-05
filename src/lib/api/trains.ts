import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import { Train } from "@/types";

export interface TrainSearchParams {
  from: string;
  to: string;
}

export async function searchTrains(
  params: TrainSearchParams
): Promise<Train[]> {
  try {
    const response = await apiClient.get("/trains/search", {
      params: {
        from: params.from,
        to: params.to,
      },
    });

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Train[];
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Train Search Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Train search failed"
    );
  }
}

export async function fetchTrains(): Promise<Train[]> {
  try {
    const response = await apiClient.get("/trains");

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Train[];
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Fetch Trains Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to fetch trains"
    );
  }
}