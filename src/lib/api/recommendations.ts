import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import { Booking } from "@/types";

export interface Recommendation {
  id: string;
  type: "flight" | "bus" | "train";
  source: string;
  destination: string;
  price: number;
  departureTime: string;
  score: number;
  reason?: string;
}

export interface AIInputBooking {
  source: string;
  destination: string;
  price: number;
  type: "flight" | "bus" | "train";
}

export async function fetchRecommendations(
  bookings: AIInputBooking[]
): Promise<Recommendation[]> {
  try {
    const response = await apiClient.post("/recommendations", {
      bookings,
    });

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Recommendation[];
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Recommendation Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
      "Failed to fetch recommendations"
    );
  }
}

export function mapBookingsForAI(
  bookings: Booking[]
): AIInputBooking[] {
  return bookings.map((booking) => ({
    source:
  booking.flight?.from ??
  booking.bus?.fromCity ??
  booking.train?.fromCity ??
  "",

  destination:
  booking.flight?.to ??
  booking.bus?.toCity ??
  booking.train?.toCity ??
  "",

    price: booking.totalPrice,

    type: booking.bookingType,
  }));
}