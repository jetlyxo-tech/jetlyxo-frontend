/** Bonton traveler segment used during amendment initiation */
export interface AmendmentTraveler {
  id: string;
  pfx?: string;
  fnm?: string;
  lnm?: string;
  name?: string;
}

/** Bonton flight segment used during amendment initiation */
export interface AmendmentSegment {
  id: string;
  airnm?: string;
  aircd?: string;
  fltno?: string;
  orgcty?: string;
  dstcty?: string;
  depdt?: string;
}

/** Response payload from GET /flights/initiate-amendment/:bookingCode */
export interface InitiateAmendmentData {
  amtyps?: string[];
  segs?: AmendmentSegment[];
  trv?: AmendmentTraveler[];
}

/** Nested wrapper returned by initiate / create amendment endpoints */
export interface InitiateAmendmentResponse {
  data?: InitiateAmendmentData;
  success?: boolean;
  message?: string;
}

export interface CreateAmendmentPassengerPayload {
  id: string;
  onm: string;
  ttl: string;
  fnm: string;
  lnm: string;
  doc: Record<string, unknown>;
  iswhl: boolean;
  isml: boolean;
  exbg: string;
}

export interface CreateAmendmentSegmentPayload {
  seg: string;
  oddt: string;
  nwdt: string;
  pax: CreateAmendmentPassengerPayload;
}

/** Request body for POST /flights/create-amendment */
export interface CreateAmendmentRequest {
  bid: string;
  amtyp: string;
  agrmk: string;
  ismen: boolean;
  trseg: CreateAmendmentSegmentPayload[];
}

/** Response payload from POST /flights/create-amendment */
export interface CreateAmendmentResponse {
  data?: {
    code?: string;
    [key: string]: unknown;
  };
  success?: boolean;
  message?: string;
}

export type AmendmentStatus =
  | string;

/** Response from GET /flights/amendment-record/:amendmentId */
export interface AmendmentRecord {
  code?: string;
  status?: AmendmentStatus;
  amount?: number;
  message?: string;
  requestId?: string;
  amtyp?: string;
  [key: string]: unknown;
}

/** Booking fields returned by GET /flights/retrieve/:bookingCode */
export interface RetrievedBookingTraveler {
  id?: string;
  name?: string;
  pfx?: string;
  fnm?: string;
  lnm?: string;
}

export interface RetrievedBookingSegment {
  id?: string;
  airnm?: string;
  aircd?: string;
  fltno?: string;
  orgcty?: string;
  dstcty?: string;
  depdt?: string;
}

export interface RetrievedBooking {
  brn?: string;
  invno?: string;
  pnr?: string;
  gdsPnr?: string;
  status?: string;
  org?: string;
  dst?: string;
  trv?: RetrievedBookingTraveler[];
  segs?: RetrievedBookingSegment[];
  [key: string]: unknown;
}

export type RetrieveBookingResponse =
  | RetrievedBooking
  | RetrievedBooking[]
  | { data?: RetrievedBooking | RetrievedBooking[] };

export interface CancelAmendmentRequest {
  reason?: string;
}

/** Lifecycle stages shown in the UI timeline */
export type AmendmentLifecycleStage =
  | "idle"
  | "booking_retrieved"
  | "amendment_initiated"
  | "amendment_created"
  | "request_sent"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface ApiOperationLog {
  id: string;
  operation: string;
  timestamp: string;
  httpStatus?: number;
  success: boolean;
  response?: unknown;
  error?: string;
}
