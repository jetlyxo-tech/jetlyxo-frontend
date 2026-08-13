export interface RetrievedBookingSegment {
  id: string;

  orgcty: string;
  orgapc: string;
  orgapn: string;

  dstcty: string;
  dstapc: string;
  dstapn: string;

  airnm: string;
  aircd: string;

  eqp: string;
  cbcls: string;

  opcar: string;
  carr: string;
  fltno: string;

  trind: number;
  trvtm: number;
  flttm: number;

  frcls: string;

  orgtrm: string;
  dsttrm: string;

  dur: string;
  lover: string;

  isret: boolean;
  iscnl: boolean;

  rem: unknown;

  dptm: string;
  artm: string;

  canc?: string;
  cndt?: unknown[];
}

export interface RetrievedBookingTraveler {
  id: string;

  name: string;
  fnm: string;
  lnm: string;
  eml: string;
  cnt: string;

  pfx: string;
  gen: string;

  tno: string;

  cbbg: string;
  chbg: string;

  iscnl: boolean;
  remark: unknown;

  dob: string;

  pno: string;
  pexp: string;

  pic: string;
  ntlty: string;

  pxt: string;

  canc?: string;
  cndt?: unknown[];
}

export interface RetrievedBookingSSR {
  passanger_name: string;
  sector: string;
  ssr_type: string;
  ssr_info: string;
  ssr_amount: number;
}

export interface RetrievedBookingPrice {
  crncy: string;

  bfr: number;
  sfr: number;
  mfr: number;
  bgfr: number;

  txf: number;
  np: number;

  com: number;
  tds: number;
}

export interface RetrievedBooking {
  id: string;

  brn: string;
  invno: string;

  pnr: string;
  gdsPnr: string;

  bdt: string;
  ddt: string;

  trpt: string;
  fartyp: string;

  status: string;
  stxt: string;

  afpnr: string;
  afseg: string;

  abid: string;
  afddt: string | null;

  cbcls: string;
  trvtyp: string;

  org: string;
  dst: string;

  adt: number;
  chd: number;
  inf: number;
  pax: number;

  pmt: string;
  fcls: string;

  segs: RetrievedBookingSegment[];

  trv: RetrievedBookingTraveler[];

  mbg: RetrievedBookingSSR[];

  amnd: unknown[];

  ctkd: unknown;

  prcd: RetrievedBookingPrice;

  sref?: string;
  device?: string;
  ipad?: string;

  [key: string]: unknown;
}

/* =========================================================
   RETRIEVE RESPONSE
========================================================= */

export interface RetrieveBookingResponse {
  success: boolean;

  message: string;

  errorCode: string | null;

  data: RetrievedBooking[];
}

/* =========================================================
   AMENDMENT INITIATE
   GET /amendmentapi/amendment-initiate/{booking_code}
========================================================= */

/**
 * Segment returned by Bonton Initiate Amendment.
 */
export interface AmendmentSegment {
  org: string;
  dst: string;

  id: string;

  trind: number;

  isret: boolean;
}

/**
 * Traveller returned by Bonton Initiate Amendment.
 */
export interface AmendmentTraveler {
  fnm: string;
  lnm: string;
  pfx: string;

  id: string;

  cnldt: unknown;
}

/**
 * Actual inner data returned by Bonton.
 */
export interface InitiateAmendmentData {
  segs: AmendmentSegment[];

  trv: AmendmentTraveler[];

  bdt: string;

  edt: string;

  rbdt: string | null;

  /**
   * Allowed amendment actions.
   *
   * Examples:
   * Cancellation Quotation
   * Instant Cancellation
   * Full Refund
   * Reissue Quotation
   * No Show
   * Void
   * Correction Quotation
   * Wheel Chair Request
   * Meal Quotation(SSR)
   * Baggage Quotation(SSR)
   * Miscellaneous Quotation - SSR
   * Miscellaneous Quotation - Refund
   */
  amtyps: string[];
}

/**
 * Bonton nested initiate result.
 */
export interface InitiateAmendmentResult {
  isscc: boolean;

  err: string;

  data: InitiateAmendmentData;
}

/**
 * Complete Bonton initiate response.
 */
export interface InitiateAmendmentResponse {
  success: boolean;

  message: string;

  errorCode: string | null;

  data: InitiateAmendmentResult;
}

/* =========================================================
   CREATE / RAISE AMENDMENT
   POST /amendmentapi/amendment-raise
========================================================= */

export interface CreateAmendmentDocument {
  FileName?: string;
  FileType?: string;
  Base64?: string;
}

export interface CreateAmendmentPassengerPayload {
  /**
   * Encrypted passenger ID from Initiate response.
   */
  id: string;

  /**
   * Existing passenger name.
   */
  onm: string;

  ttl: string;

  fnm: string;

  lnm: string;

  doc: CreateAmendmentDocument | Record<string, unknown>;

  /**
   * Wheelchair request.
   */
  iswhl: boolean;

  /**
   * Meal request.
   */
  isml: boolean;

  /**
   * Extra baggage details.
   */
  exbg: string;
}

export interface CreateAmendmentSegmentPayload {
  /**
   * Encrypted segment ID from Initiate response.
   */
  seg: string;

  /**
   * Old/original travel date.
   */
  oddt: string;

  /**
   * New/requested travel date.
   */
  nwdt: string;

  pax: CreateAmendmentPassengerPayload;
}

/**
 * Request body for:
 *
 * POST /amendmentapi/amendment-raise
 */
export interface CreateAmendmentRequest {
  /**
   * Encrypted booking ID.
   */
  bid: string;

  /**
   * Amendment type returned by Initiate.
   */
  amtyp: string;

  /**
   * Agent remark/comment.
   */
  agrmk: string;

  /**
   * Manual-entry flag.
   */
  ismen: boolean;

  /**
   * Segment/passenger amendment details.
   */
  trseg: CreateAmendmentSegmentPayload[];
}

/**
 * Bonton Create Amendment data.
 */
export interface CreateAmendmentData {
  status: boolean;

  msg: string;

  /**
   * Amendment ID.
   *
   * This ID must be used for Record / Accept / Cancel.
   */
  code: string;
}

/**
 * Complete Create Amendment response.
 */
export interface CreateAmendmentResponse {
  success: boolean;

  message: string;

  errorCode: string | null;

  data: CreateAmendmentData;
}

/* =========================================================
   AMENDMENT RECORD / RETRIEVAL
   GET /amendmentapi/amendment-retrieval/{id}
========================================================= */

export interface AmendmentPassengerInfo {
  /**
   * Existing passenger name.
   */
  paxnm: string;

  /**
   * New passenger name.
   */
  npaxnm: string;

  /**
   * Travel details.
   *
   * Example:
   * BOM - DEL
   */
  trvdtl: string;

  /**
   * Old booking date.
   */
  obdt: string | null;

  /**
   * New booking date.
   */
  nbdt: string | null;

  /**
   * Extra baggage details.
   */
  exbg: string;

  /**
   * Meal details.
   */
  ml: string;

  /**
   * Preference/profile details.
   */
  prf: string;
}

export interface AmendmentCharges {
  /**
   * Amendment charge.
   */
  chg: number;

  /**
   * Refund amount.
   */
  rfd: number;

  /**
   * Cancellation charge.
   */
  cnchg: number;

  /**
   * Service charge.
   */
  svchg: number;
}

/**
 * Actual amendment retrieval data.
 */
export interface AmendmentRecordData {
  /**
   * Amendment type.
   */
  amtyp: string;

  /**
   * Amendment status.
   *
   * Examples:
   * Pending
   * Quotation Received
   * Approved
   * Rejected
   */
  amsts: string;

  /**
   * Rejection reason.
   */
  rjrsn: string;

  /**
   * Passenger amendment information.
   */
  paxi: AmendmentPassengerInfo[];

  /**
   * Main remark.
   */
  rmk: string;

  /**
   * Corporate/admin remark.
   */
  cormk: string;

  /**
   * Currency.
   */
  cur: string;

  /**
   * Invoice number.
   */
  invno: string;

  /**
   * Payment flag.
   */
  ispay: boolean;

  /**
   * Refund flag.
   */
  isrf: boolean;

  /**
   * Charge/refund summary.
   */
  chg: AmendmentCharges;
}

/**
 * Complete Record response.
 */
export interface AmendmentRecordResponse {
  success: boolean;

  message: string;

  errorCode: string | null;

  data: AmendmentRecordData;
}

/* =========================================================
   ACCEPT AMENDMENT
   POST /amendmentapi/accept/{id}
========================================================= */

export interface AcceptAmendmentData {
  status: boolean;
}

export interface AcceptAmendmentResponse {
  success: boolean;

  message: string;

  errorCode: string | null;

  data: AcceptAmendmentData;
}

/* =========================================================
   CANCEL AMENDMENT
   POST /amendmentapi/cancel
========================================================= */

export interface CancelAmendmentRequest {
  /**
   * Amendment ID.
   */
  id: string;

  /**
   * Reject/cancel reason.
   */
  rjrsn: string;
}

export interface CancelAmendmentData {
  status: boolean;
}

export interface CancelAmendmentResponse {
  success: boolean;

  message: string;

  errorCode: string | null;

  data: CancelAmendmentData;
}

/* =========================================================
   AMENDMENT STATUS
========================================================= */

export type AmendmentStatus =
  | "Pending"
  | "Quotation Received"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Accepted"
  | "Completed"
  | string;

/* =========================================================
   AMENDMENT LIFECYCLE
========================================================= */

export type AmendmentLifecycleStage =
  | "idle"
  | "booking_retrieved"
  | "amendment_initiated"
  | "amendment_created"
  | "request_sent"
  | "quotation_received"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

/* =========================================================
   UI STATE
========================================================= */

export interface AmendmentUIState {
  bookingCode: string;

  retrieveLoading: boolean;

  initiateLoading: boolean;

  createLoading: boolean;

  recordLoading: boolean;

  acceptLoading: boolean;

  cancelLoading: boolean;

  error: string | null;

  booking: RetrievedBooking | null;

  initiate: InitiateAmendmentResponse | null;

  amendment: AmendmentRecordResponse | null;

  amendmentId: string | null;

  selectedAmendmentType: string | null;

  lifecycleStage: AmendmentLifecycleStage;
}

/* =========================================================
   API OPERATION LOG
========================================================= */

export interface ApiOperationLog {
  id: string;

  operation: string;

  timestamp: string;

  httpStatus?: number;

  success: boolean;

  response?: unknown;

  error?: string;
}

/* =========================================================
   HELPER TYPES
========================================================= */

/**
 * Convenient type for the allowed amendment actions
 * returned by Bonton Initiate.
 */
export type AmendmentType = string;

/**
 * Convenient type for a selected segment/passenger pair.
 */
export interface SelectedAmendmentSegment {
  segmentId: string;

  passengerId: string;

  passengerName: string;

  origin: string;

  destination: string;

  isReturn: boolean;

  tripIndicator: number;
}

/**
 * Charge summary useful for the UI.
 */
export interface AmendmentChargeSummary {
  currency: string;

  amendmentCharge: number;

  refundAmount: number;

  cancellationCharge: number;

  serviceCharge: number;

  totalPayable: number;
}

/* =========================================================
   PAYLOAD BUILDER INPUT
========================================================= */

export interface BuildCreateAmendmentPayloadOptions {
  bookingCode: string;

  amendmentType: string;

  initiateData: InitiateAmendmentData;

  segmentId?: string;

  passengerId?: string;

  oldDate?: string;

  newDate?: string;

  passengerTitle?: string;

  firstName?: string;

  lastName?: string;

  document?: CreateAmendmentDocument;

  wheelchair?: boolean;

  meal?: boolean;

  extraBaggage?: string;

  remark?: string;

  manualEntry?: boolean;
}