import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import { Booking } from "@/types";

export interface CreateBookingResponse {
  success: boolean;
  bookingId: number | null;
  raw: unknown;
}

export async function createBooking(
  data: Record<string, unknown>
): Promise<CreateBookingResponse> {
  try {
    const response = await apiClient.post("/bookings", data);

    const bookingId =
      response.data?.booking?.id ??
      response.data?.bookingId ??
      response.data?.data?.booking?.id ??
      response.data?.data?.id ??
      response.data?.id ??
      null;

    return {
      success: true,
      bookingId,
      raw: response.data,
    };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;

    console.error(
      "Create Booking Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to create booking"
    );
  }
}

export async function fetchBookings(): Promise<Booking[]> {
  try {
    const response = await apiClient.get("/bookings/history");

    return (
      response.data?.data ??
      response.data ??
      []
    ) as Booking[];
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;

    console.error(
      "Fetch Bookings Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to fetch bookings"
    );
  }
}

export async function getBookingById(
  id: number
): Promise<Booking> {
  try {
    const response = await apiClient.get(`/bookings/${id}`);

    return response.data?.data ?? response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;

    console.error(
      "Get Booking Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to fetch booking"
    );
  }
}

export async function verifyTicket(
  pnr: string
) {
  try {
    const response = await apiClient.get(
      `/verify/${pnr}`
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;

    console.error(
      "Verify Ticket Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Ticket verification failed"
    );
  }
}

export async function cancelBooking(
  id: string
) {
  try {
    const response = await apiClient.post(
      `/bookings/cancel/${id}`
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;

    console.error(
      "Cancel Booking Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to cancel booking"
    );
  }
}