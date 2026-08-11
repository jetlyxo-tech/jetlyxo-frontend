import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";
import {
  AmendmentRecord,
  CancelAmendmentRequest,
  CreateAmendmentRequest,
  CreateAmendmentResponse,
  InitiateAmendmentResponse,
  RetrieveBookingResponse,
  RetrievedBooking,
} from "@/types/amendment";

/* =========================================================
   ERROR HELPERS
========================================================= */

export function getAmendmentErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;

  if (err.response) {
    const serverMessage = err.response.data?.message;

    switch (err.response.status) {
      case 400:
        return serverMessage ?? "Invalid request. Please check your input.";
      case 401:
        return "Your session has expired. Please log in again.";
      case 403:
        return serverMessage ?? "You do not have permission to perform this action.";
      case 404:
        return serverMessage ?? "Booking or amendment not found.";
      case 409:
        return (
          serverMessage ??
          "Amendment cannot be processed in the current state."
        );
      case 422:
        return serverMessage ?? "The request could not be processed.";
      case 500:
        return "Something went wrong on the server. Please try again.";
      default:
        return serverMessage ?? `Request failed (${err.response.status}).`;
    }
  }

  if (err.request) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export function getHttpStatus(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}

/* =========================================================
   RESPONSE NORMALIZATION
========================================================= */

/** Normalize retrieve-booking payloads that may be nested or array-wrapped */
export function normalizeRetrievedBooking(
  payload: RetrieveBookingResponse | null
): RetrievedBooking | null {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }

  if ("data" in payload && payload.data) {
    if (Array.isArray(payload.data)) {
      return payload.data[0] ?? null;
    }
    return payload.data as RetrievedBooking;
  }

  return payload as RetrievedBooking;
}

/* =========================================================
   RETRIEVE BOOKING
========================================================= */

export async function retrieveAmendmentBooking(
  bookingCode: string
): Promise<RetrievedBooking | null> {
  try {
    const response = await apiClient.get(
      `/flights/retrieve/${encodeURIComponent(bookingCode)}`
    );

    return normalizeRetrievedBooking(
      (response.data?.data ?? response.data ?? null) as RetrieveBookingResponse
    );
  } catch (error) {
    console.error(
      "Retrieve Booking Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(getAmendmentErrorMessage(error));
  }
}

/* =========================================================
   INITIATE AMENDMENT
========================================================= */

export async function initiateAmendment(
  bookingCode: string
): Promise<InitiateAmendmentResponse | null> {
  try {
    const response = await apiClient.get(
      `/flights/initiate-amendment/${encodeURIComponent(bookingCode)}`
    );

    return (response.data?.data ??
      response.data ??
      null) as InitiateAmendmentResponse | null;
  } catch (error) {
    console.error(
      "Initiate Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(getAmendmentErrorMessage(error));
  }
}

/* =========================================================
   CREATE AMENDMENT
========================================================= */

export async function createAmendment(
  data: CreateAmendmentRequest
): Promise<CreateAmendmentResponse | null> {
  try {
    const response = await apiClient.post(
      "/flights/create-amendment",
      data
    );

    return (response.data?.data ??
      response.data ??
      null) as CreateAmendmentResponse | null;
  } catch (error) {
    console.error(
      "Create Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(getAmendmentErrorMessage(error));
  }
}

/* =========================================================
   AMENDMENT RECORD
========================================================= */

export async function amendmentRecord(
  amendmentId: string
): Promise<AmendmentRecord | null> {
  try {
    const response = await apiClient.get(
      `/flights/amendment-record/${encodeURIComponent(amendmentId)}`
    );

    return (response.data?.data ??
      response.data ??
      null) as AmendmentRecord | null;
  } catch (error) {
    console.error(
      "Amendment Record Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(getAmendmentErrorMessage(error));
  }
}

/* =========================================================
   ACCEPT AMENDMENT
========================================================= */

export async function acceptAmendment(
  amendmentId: string
): Promise<AmendmentRecord | null> {
  try {
    const response = await apiClient.post(
      `/flights/accept-amendment/${encodeURIComponent(amendmentId)}`
    );

    return (response.data?.data ??
      response.data ??
      null) as AmendmentRecord | null;
  } catch (error) {
    console.error(
      "Accept Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(getAmendmentErrorMessage(error));
  }
}

/* =========================================================
   CANCEL AMENDMENT
========================================================= */

export async function cancelAmendment(
  amendmentId: string,
  reason = "reject"
): Promise<AmendmentRecord | null> {
  try {
    const body: CancelAmendmentRequest = { reason };

    const response = await apiClient.post(
      `/flights/cancel-amendment/${encodeURIComponent(amendmentId)}`,
      body
    );

    return (response.data?.data ??
      response.data ??
      null) as AmendmentRecord | null;
  } catch (error) {
    console.error(
      "Cancel Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(getAmendmentErrorMessage(error));
  }
}

/* =========================================================
   BUILD CREATE PAYLOAD (from initiate response)
========================================================= */

export function buildCreateAmendmentPayload(
  bookingCode: string,
  amendmentType: string,
  initiateData: InitiateAmendmentResponse
): CreateAmendmentRequest | null {
  const inner = initiateData.data;
  const seg = inner?.segs?.[0];
  const pax = inner?.trv?.[0];

  if (!seg?.id || !pax?.id) {
    return null;
  }

  const passengerName =
    pax.name ??
    [pax.pfx, pax.fnm, pax.lnm].filter(Boolean).join(" ").trim();

  return {
    bid: bookingCode,
    amtyp: amendmentType,
    agrmk: "",
    ismen: false,
    trseg: [
      {
        seg: seg.id,
        oddt: "",
        nwdt: "",
        pax: {
          id: pax.id,
          onm: passengerName,
          ttl: "",
          fnm: "",
          lnm: "",
          doc: {},
          iswhl: false,
          isml: false,
          exbg: "",
        },
      },
    ],
  };
}
