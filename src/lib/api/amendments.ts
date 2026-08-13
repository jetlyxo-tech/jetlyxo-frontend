import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";

import {
  AmendmentRecordResponse,
  AmendmentType,
  CancelAmendmentRequest,
  CancelAmendmentResponse,
  CreateAmendmentRequest,
  CreateAmendmentResponse,
  InitiateAmendmentData,
  InitiateAmendmentResponse,
  RetrieveBookingResponse,
  RetrievedBooking,
} from "@/types/amendment";

/* =========================================================
   CONSTANTS
========================================================= */

const AMENDMENT_TYPES = {
  CANCELLATION_QUOTATION: "Cancellation Quotation",
  INSTANT_CANCELLATION: "Instant Cancellation",
  FULL_REFUND: "Full Refund",
  REISSUE_QUOTATION: "Reissue Quotation",
  NO_SHOW: "No Show",
  VOID: "Void",
  CORRECTION_QUOTATION: "Correction Quotation",
  WHEEL_CHAIR_REQUEST: "Wheel Chair Request",
  MEAL_QUOTATION: "Meal Quotation(SSR)",
  BAGGAGE_QUOTATION: "Baggage Quotation(SSR)",
  MISCELLANEOUS_QUOTATION_SSR:
    "Miscellaneous Quotation - SSR",
  MISCELLANEOUS_QUOTATION_REFUND:
    "Miscellaneous Quotation - Refund",
} as const;

export { AMENDMENT_TYPES };

/* =========================================================
   ERROR HELPERS
========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errorCode?: string | null;
  data?: unknown;
}

export function getAmendmentErrorMessage(
  error: unknown
): string {
  const err = error as AxiosError<ApiErrorResponse>;

  if (err.response) {
    const status = err.response.status;

    const serverMessage =
      err.response.data?.message ||
      (typeof err.response.data?.data === "object" &&
      err.response.data?.data !== null &&
      "msg" in err.response.data.data
        ? String(
            (
              err.response.data.data as {
                msg?: unknown;
              }
            ).msg ?? ""
          )
        : undefined);

    switch (status) {
      case 400:
        return (
          serverMessage ??
          "Invalid amendment request. Please check the submitted data."
        );

      case 401:
        return "Your session has expired. Please log in again.";

      case 403:
        return (
          serverMessage ??
          "You do not have permission to perform this action."
        );

      case 404:
        return (
          serverMessage ??
          "Booking or amendment was not found."
        );

      case 409:
        return (
          serverMessage ??
          "Amendment cannot be processed in the current state."
        );

      case 422:
        return (
          serverMessage ??
          "The amendment request could not be processed."
        );

      case 500:
        return (
          serverMessage ??
          "Something went wrong on the server. Please try again."
        );

      default:
        return (
          serverMessage ??
          `Request failed (${status}).`
        );
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

export function getHttpStatus(
  error: unknown
): number | undefined {
  return (error as AxiosError)?.response?.status;
}

/* =========================================================
   INTERNAL RESPONSE HELPERS
========================================================= */

/**
 * Safely extract the actual Bonton response body.
 *
 * Axios:
 *
 * response.data
 *
 * Bonton:
 *
 * {
 *   success,
 *   message,
 *   errorCode,
 *   data
 * }
 */
function getApiData<T>(
  responseData: unknown
): T | null {
  if (!responseData) {
    return null;
  }

  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "data" in responseData
  ) {
    return (
      (responseData as { data?: T }).data ??
      null
    );
  }

  return responseData as T;
}

/* =========================================================
   RETRIEVE NORMALIZATION
========================================================= */

/**
 * Bonton Retrieve response:
 *
 * {
 *   success: true,
 *   message: "Success",
 *   errorCode: null,
 *   data: [
 *     {
 *       id,
 *       brn,
 *       segs,
 *       trv,
 *       ...
 *     }
 *   ]
 * }
 */
export function normalizeRetrievedBooking(
  payload: RetrieveBookingResponse | null
): RetrievedBooking | null {
  if (!payload) {
    return null;
  }

  // Case 1:
  // Bonton response directly:
  //
  // {
  //   success: true,
  //   data: [
  //     { ...booking }
  //   ]
  // }
  if (Array.isArray(payload.data)) {
    return payload.data[0] ?? null;
  }

  // Case 2:
  // Jetly backend wraps the Bonton response:
  //
  // {
  //   success: true,
  //   data: {
  //     success: true,
  //     message: "Success",
  //     errorCode: null,
  //     data: [
  //       { ...booking }
  //     ]
  //   }
  // }
  const outerData = payload.data;

  if (
    outerData &&
    typeof outerData === "object" &&
    !Array.isArray(outerData) &&
    "data" in outerData
  ) {
    const nestedData = (
      outerData as {
        data?: unknown;
      }
    ).data;

    if (Array.isArray(nestedData)) {
      return (
        (nestedData[0] as RetrievedBooking | undefined) ??
        null
      );
    }
  }

  return null;
}

/* =========================================================
   RETRIEVE BOOKING
========================================================= */

/**
 * GET
 *
 * /flightapi/retrieve/{booking_code}
 *
 * Backend route should proxy this to Bonton.
 */
export async function retrieveAmendmentBooking(
  bookingCode: string
): Promise<RetrievedBooking | null> {
  if (!bookingCode?.trim()) {
    throw new Error("Booking code is required.");
  }

  try {
    const response = await apiClient.get(
      `/flights/retrieve/${encodeURIComponent(
        bookingCode.trim()
      )}`
    );

    const payload =
      response.data as RetrieveBookingResponse;

    const booking =
      normalizeRetrievedBooking(payload);

    if (!booking) {
      throw new Error(
        "Booking details were not returned."
      );
    }

    return booking;
  } catch (error) {
    console.error(
      "Retrieve Booking Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(
      getAmendmentErrorMessage(error)
    );
  }
}

/* =========================================================
   INITIATE AMENDMENT
========================================================= */

/**
 * GET
 *
 * Bonton:
 *
 * /amendmentapi/amendment-initiate/{booking_code}
 *
 * Expected Bonton response:
 *
 * {
 *   success: true,
 *   message: "Success",
 *   errorCode: null,
 *   data: {
 *     isscc: true,
 *     err: "",
 *     data: {
 *       segs: [],
 *       trv: [],
 *       bdt: "",
 *       edt: "",
 *       rbdt: null,
 *       amtyps: []
 *     }
 *   }
 * }
 */
export async function initiateAmendment(
  bookingCode: string
): Promise<InitiateAmendmentResponse | null> {
  if (!bookingCode?.trim()) {
    throw new Error("Booking code is required.");
  }

  try {
    const response = await apiClient.get(
      `/flights/initiate-amendment/${encodeURIComponent(
        bookingCode.trim()
      )}`
    );

    const result =
      response.data as InitiateAmendmentResponse;

    if (!result?.success) {
      throw new Error(
        result?.message ||
          result?.data?.err ||
          "Unable to initiate amendment."
      );
    }

    const initiateData =
      getInitiateAmendmentData(result);

    if (!initiateData) {
      throw new Error(
       "Bonton returned an invalid amendment initiation response."
  );
}

    return result;
  } catch (error) {
    console.error(
      "Initiate Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(
      getAmendmentErrorMessage(error)
    );
  }
}

/* =========================================================
   EXTRACT INITIATE DATA
========================================================= */

export function getInitiateAmendmentData(
  response: InitiateAmendmentResponse | null
): InitiateAmendmentData | null {
  if (!response) {
    return null;
  }

  const raw = response as unknown as {
    data?: {
      success?: boolean;
      message?: string;
      errorCode?: string | null;
      data?: {
        isscc?: boolean;
        err?: string;
        data?: InitiateAmendmentData;
      };
    };
  };

  return raw.data?.data?.data ?? null;
}

export function getAllowedAmendmentTypes(
  response: InitiateAmendmentResponse | null
): string[] {
  return getInitiateAmendmentData(response)?.amtyps ?? [];
}

/* =========================================================
   CHECK AMENDMENT TYPE
========================================================= */

export function isAmendmentTypeAllowed(
  response:
    | InitiateAmendmentResponse
    | null,
  amendmentType: string
): boolean {
  return getAllowedAmendmentTypes(
    response
  ).includes(amendmentType);
}

/* =========================================================
   CREATE / RAISE AMENDMENT
========================================================= */

/**
 * POST
 *
 * Bonton:
 *
 * /amendmentapi/amendment-raise
 *
 * Backend route:
 *
 * /flights/create-amendment
 */
export async function createAmendment(
  data: CreateAmendmentRequest
): Promise<CreateAmendmentResponse | null> {
  if (!data.bid?.trim()) {
    throw new Error(
      "Encrypted booking ID is required."
    );
  }

  if (!data.amtyp?.trim()) {
    throw new Error(
      "Amendment type is required."
    );
  }

  if (!data.trseg?.length) {
    throw new Error(
      "At least one segment is required."
    );
  }

  try {
    const response = await apiClient.post(
      "/flights/create-amendment",
      data
    );

    const result =
      response.data as CreateAmendmentResponse;

    if (!result?.success) {
      throw new Error(
        result?.message ||
          result?.data?.msg ||
          "Unable to create amendment."
      );
    }

    if (result.data?.status === false) {
      throw new Error(
       result.data.msg ||
        "Amendment creation failed."
  );
}

     if (!result.data?.code) {
       throw new Error(
        "Amendment was created but no amendment ID was returned."
  );
}

    return result;
  } catch (error) {
    console.error(
      "Create Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(
      getAmendmentErrorMessage(error)
    );
  }
}

/* =========================================================
   AMENDMENT RECORD
========================================================= */

/**
 * GET
 *
 * Bonton:
 *
 * /amendmentapi/amendment-retrieval/{id}
 *
 * Backend route:
 *
 * /flights/amendment-record/{id}
 */
export async function amendmentRecord(
  amendmentId: string
): Promise<AmendmentRecordResponse | null> {
  if (!amendmentId?.trim()) {
    throw new Error(
      "Amendment ID is required."
    );
  }

  try {
    const response = await apiClient.get(
      `/flights/amendment-record/${encodeURIComponent(
        amendmentId.trim()
      )}`
    );

    const result =
      response.data as AmendmentRecordResponse;

    if (!result?.success) {
      throw new Error(
        result?.message ||
          "Unable to retrieve amendment record."
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Amendment Record Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(
      getAmendmentErrorMessage(error)
    );
  }
}

/* =========================================================
   ACCEPT AMENDMENT
========================================================= */

/**
 * POST
 *
 * Bonton:
 *
 * /amendmentapi/accept/{id}
 *
 * Backend route:
 *
 * /flights/accept-amendment/{id}
 */
export async function acceptAmendment(
  amendmentId: string
): Promise<boolean> {
  if (!amendmentId?.trim()) {
    throw new Error(
      "Amendment ID is required."
    );
  }

  try {
    const response = await apiClient.post(
      `/flights/accept-amendment/${encodeURIComponent(
        amendmentId.trim()
      )}`
    );

    const result =
      response.data as {
        success?: boolean;
        message?: string;
        errorCode?: string | null;
        data?: {
          status?: boolean;
        };
      };

    if (!result?.success) {
      throw new Error(
        result?.message ||
          "Unable to accept amendment."
      );
    }

    if (result.data?.status !== true) {
      throw new Error(
        result?.message ||
          "Amendment acceptance failed."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Accept Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(
      getAmendmentErrorMessage(error)
    );
  }
}

/* =========================================================
   CANCEL AMENDMENT
========================================================= */

/**
 * POST
 *
 * Bonton:
 *
 * /amendmentapi/cancel
 *
 * Payload:
 *
 * {
 *   id: amendmentId,
 *   rjrsn: "reject"
 * }
 *
 * Backend route:
 *
 * /flights/cancel-amendment
 */
export async function cancelAmendment(
  amendmentId: string,
  reason = "reject"
): Promise<boolean> {
  if (!amendmentId?.trim()) {
    throw new Error(
      "Amendment ID is required."
    );
  }

  const body: CancelAmendmentRequest = {
    id: amendmentId.trim(),
    rjrsn: reason,
  };

  try {
    const response = await apiClient.post(
      "/flights/cancel-amendment",
      body
    );

    const result =
      response.data as CancelAmendmentResponse;

    if (!result?.success) {
      throw new Error(
        result?.message ||
          "Unable to cancel amendment."
      );
    }

    if (result.data?.status !== true) {
      throw new Error(
        result?.message ||
          "Amendment cancellation failed."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Cancel Amendment Error:",
      (error as AxiosError).response?.data ||
        (error as AxiosError).message
    );

    throw new Error(
      getAmendmentErrorMessage(error)
    );
  }
}

/* =========================================================
   BUILD CREATE PAYLOAD
========================================================= */

/**
 * Builds the Bonton Create/Raise payload from
 * the Initiate Amendment response.
 *
 * IMPORTANT:
 *
 * Initiate response:
 *
 * response.data.data.segs
 * response.data.data.trv
 *
 * NOT:
 *
 * response.data.segs
 * response.data.trv
 */
export function buildCreateAmendmentPayload(
  bookingCode: string,
  amendmentType: AmendmentType,
  initiateResponse: InitiateAmendmentResponse,
  options?: {
    segmentId?: string;
    passengerId?: string;

    oldDate?: string;
    newDate?: string;

    remark?: string;

    title?: string;
    firstName?: string;
    lastName?: string;

    document?: {
      FileName?: string; 
      FileType?: string;
      Base64?: string;
    };

    wheelchair?: boolean;
    meal?: boolean;
    extraBaggage?: string;

    manualEntry?: boolean;
  }
): CreateAmendmentRequest | null {
  const initiateData =
    getInitiateAmendmentData(initiateResponse);

  if (!initiateData) {
    return null;
  }

  /* -------------------------------------------------------
     SEGMENT
  ------------------------------------------------------- */

  const segment =
    initiateData.segs?.find(
      (item) =>
        item.id === options?.segmentId
    ) ??
    initiateData.segs?.[0];

  /* -------------------------------------------------------
     PASSENGER
  ------------------------------------------------------- */

  const passenger =
    initiateData.trv?.find(
      (item) =>
        item.id === options?.passengerId
    ) ??
    initiateData.trv?.[0];

  if (!segment?.id) {
    return null;
  }

  if (!passenger?.id) {
    return null;
  }

  /* -------------------------------------------------------
     CHECK ALLOWED AMENDMENT
  ------------------------------------------------------- */

  if (
    initiateData.amtyps?.length &&
    !initiateData.amtyps.includes(
      amendmentType
    )
  ) {
    throw new Error(
      `Amendment type "${amendmentType}" is not allowed for this booking.`
    );
  }

  /* -------------------------------------------------------
     PASSENGER NAME
  ------------------------------------------------------- */

  const passengerName =
    [
      passenger.pfx,
      passenger.fnm,
      passenger.lnm,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  /* -------------------------------------------------------
     PASSENGER FIELDS
  ------------------------------------------------------- */

  const title =
    options?.title ??
    passenger.pfx ??
    "";

  const firstName =
    options?.firstName ??
    passenger.fnm ??
    "";

  const lastName =
    options?.lastName ??
    passenger.lnm ??
    "";

  /* -------------------------------------------------------
     DOCUMENT
  ------------------------------------------------------- */

  const document =
    options?.document ?? {};

  /* -------------------------------------------------------
     PAYLOAD
  ------------------------------------------------------- */

  return {
    bid: bookingCode,

    amtyp: amendmentType,

    agrmk:
      options?.remark ?? "",

    ismen:
      options?.manualEntry ?? false,

    trseg: [
      {
        seg: segment.id,

        oddt:
          options?.oldDate ?? "",

        nwdt:
          options?.newDate ?? "",

        pax: {
          id: passenger.id,

          onm:
            passengerName ||
            [
              title,
              firstName,
              lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .trim(),

          ttl: title,

          fnm: firstName,

          lnm: lastName,

          doc: document,

          iswhl:
            options?.wheelchair ?? false,

          isml:
            options?.meal ?? false,

          exbg:
            options?.extraBaggage ?? "",
        },
      },
    ],
  };
}

/* =========================================================
   SIMPLE CREATE PAYLOAD
========================================================= */

/**
 * Useful when the UI only needs the default
 * passenger + first segment.
 */
export function buildDefaultCreateAmendmentPayload(
  bookingCode: string,
  amendmentType: string,
  initiateResponse: InitiateAmendmentResponse
): CreateAmendmentRequest | null {
  return buildCreateAmendmentPayload(
    bookingCode,
    amendmentType,
    initiateResponse
  );
}

/* =========================================================
   EXTRACT AMENDMENT ID
========================================================= */

/**
 * Create response:
 *
 * data.code
 *
 * This code becomes the amendment ID used by
 * Record / Accept / Cancel.
 */
export function getAmendmentId(
  response:
    | CreateAmendmentResponse
    | null
): string | null {
  return response?.data?.code ?? null;
}

/* =========================================================
   EXTRACT RECORD DATA
========================================================= */

export function getAmendmentRecordData(
  response:
    | AmendmentRecordResponse
    | null
) {
  return response?.data ?? null;
}

/* =========================================================
   CHARGE CALCULATIONS
========================================================= */

/**
 * Converts Bonton charge information into values
 * convenient for the UI.
 */
export function getAmendmentCharges(
  response:
    | AmendmentRecordResponse
    | null
) {
  const data = response?.data;

  if (!data?.chg) {
    return {
      currency: data?.cur ?? "INR",
      amendmentCharge: 0,
      refundAmount: 0,
      cancellationCharge: 0,
      serviceCharge: 0,
    };
  }

  return {
    currency: data.cur ?? "INR",

    amendmentCharge:
      data.chg.chg ?? 0,

    refundAmount:
      data.chg.rfd ?? 0,

    cancellationCharge:
      data.chg.cnchg ?? 0,

    serviceCharge:
      data.chg.svchg ?? 0,
  };
}

/* =========================================================
   STATUS HELPERS
========================================================= */

export function getAmendmentStatus(
  response:
    | AmendmentRecordResponse
    | null
): string {
  return (
    response?.data?.amsts ??
    "Unknown"
  );
}

export function isAmendmentPending(
  response:
    | AmendmentRecordResponse
    | null
): boolean {
  return (
    response?.data?.amsts?.toLowerCase() ===
    "pending"
  );
}

export function isQuotationReceived(
  response:
    | AmendmentRecordResponse
    | null
): boolean {
  return (
    response?.data?.amsts?.toLowerCase() ===
    "quotation received"
  );
}

export function isAmendmentRejected(
  response:
    | AmendmentRecordResponse
    | null
): boolean {
  return (
    response?.data?.amsts?.toLowerCase() ===
    "rejected"
  );
}

/* =========================================================
   VALIDATION
========================================================= */

export function validateCreateAmendmentPayload(
  payload: CreateAmendmentRequest
): string[] {
  const errors: string[] = [];

  if (!payload.bid?.trim()) {
    errors.push(
      "Booking ID is required."
    );
  }

  if (!payload.amtyp?.trim()) {
    errors.push(
      "Amendment type is required."
    );
  }

  if (!Array.isArray(payload.trseg)) {
    errors.push(
      "Trip segment data is required."
    );
  }

  if (
    Array.isArray(payload.trseg) &&
    payload.trseg.length === 0
  ) {
    errors.push(
      "At least one trip segment is required."
    );
  }

  payload.trseg?.forEach(
    (segment, index) => {
      if (!segment.seg?.trim()) {
        errors.push(
          `Segment ${index + 1}: segment ID is required.`
        );
      }

      if (!segment.pax?.id?.trim()) {
        errors.push(
          `Segment ${index + 1}: passenger ID is required.`
        );
      }
    }
  );

  return errors;
}

/* =========================================================
   FULL LIFECYCLE HELPER
========================================================= */

/**
 * Creates an amendment using:
 *
 * 1. Initiate response
 * 2. Selected amendment type
 * 3. Optional UI values
 *
 * Returns the Create API response.
 */
export async function raiseAmendmentFromInitiate(
  bookingCode: string,
  amendmentType: string,
  initiateResponse: InitiateAmendmentResponse,
  options?: {
    segmentId?: string;
    passengerId?: string;

    oldDate?: string;
    newDate?: string;

    remark?: string;

    title?: string;
    firstName?: string;
    lastName?: string;

    document?: {
      FileName?: string;
      FileType?: string;
      Base64?: string;
    };

    wheelchair?: boolean;
    meal?: boolean;
    extraBaggage?: string;

    manualEntry?: boolean;
  }
): Promise<CreateAmendmentResponse | null> {
  const payload =
    buildCreateAmendmentPayload(
      bookingCode,
      amendmentType,
      initiateResponse,
      options
    );

  if (!payload) {
    throw new Error(
      "Unable to build amendment payload. Segment or passenger information is missing."
    );
  }

  const validationErrors =
    validateCreateAmendmentPayload(
      payload
    );

  if (validationErrors.length > 0) {
    throw new Error(
      validationErrors.join(" ")
    );
  }

  return createAmendment(payload);
}