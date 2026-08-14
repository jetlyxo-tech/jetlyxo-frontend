"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from "lucide-react";

import { API_URL } from "@/config/env";
import { getBookingById } from "@/lib/api";

import {
  acceptAmendment,
  amendmentRecord,
  buildCreateAmendmentPayload,
  cancelAmendment,
  createAmendment,
  getAmendmentErrorMessage,
  getHttpStatus,
  initiateAmendment,
  retrieveAmendmentBooking,
} from "@/lib/api/amendments";

import type {
  AmendmentLifecycleStage,
  AmendmentRecordData,
  ApiOperationLog,
  InitiateAmendmentResponse,
  RetrievedBooking,
} from "@/types/amendment";

/* =========================================================
   TYPES
========================================================= */

interface BontonInitiateSegment {
  id: string;
  org?: string;
  dst?: string;
  trind?: number;
  isret?: boolean;
}

interface BontonInitiateTraveler {
  id: string;
  fnm?: string;
  lnm?: string;
  pfx?: string;
  cnldt?: unknown;
}

interface BontonInitiateInnerData {
  segs?: BontonInitiateSegment[];
  trv?: BontonInitiateTraveler[];
  bdt?: string;
  edt?: string;
  rbdt?: string | null;
  amtyps?: string[];
}

interface BontonInitiateEnvelope {
  isscc?: boolean;
  err?: string;
  data?: BontonInitiateInnerData;
}

interface BontonPaxInfo {
  paxnm?: string;
  npaxnm?: string;
  trvdtl?: string;
  obdt?: string | null;
  nbdt?: string | null;
  exbg?: string;
  ml?: string;
  prf?: string;
}

interface BontonCharges {
  chg?: number;
  rfd?: number;
  cnchg?: number;
  svchg?: number;
}

interface BontonAmendmentRecord {
  amtyp?: string;
  amsts?: string;
  rjrsn?: string;
  paxi?: BontonPaxInfo[];
  rmk?: string;
  cormk?: string;
  cur?: string;
  invno?: string;
  ispay?: boolean;
  isrf?: boolean;
  chg?: BontonCharges;
}

interface BontonAcceptResponse {
  status?: boolean;
}

interface BontonCancelResponse {
  status?: boolean;
}

/* =========================================================
   CONSTANTS
========================================================= */

const isLiveApi =
  Boolean(process.env.NEXT_PUBLIC_API_URL) &&
  !API_URL.includes("localhost");

const AMENDMENT_TYPES = [
  "Cancellation Quotation",
  "Instant Cancellation",
  "Full Refund",
  "Reissue Quotation",
  "No Show",
  "Void",
  "Correction Quotation",
  "Wheel Chair Request",
  "Meal Quotation(SSR)",
  "Baggage Quotation(SSR)",
  "Miscellaneous Quotation - SSR",
  "Miscellaneous Quotation - Refund",
];

/* =========================================================
   HELPERS
========================================================= */

function maskApiHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "configured backend";
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function formatCurrency(
  amount?: number,
  currency = "INR"
): string {
  if (amount === undefined || amount === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPassengerName(
  booking: RetrievedBooking | null
): string {
  const traveler = booking?.trv?.[0];

  if (!traveler) {
    return "-";
  }

  const fullName = [
    traveler.pfx,
    traveler.fnm,
    traveler.lnm,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return traveler.name?.trim() || fullName || "-";
}

function getFlightNumber(
  booking: RetrievedBooking | null
): string {
  const segment = booking?.segs?.[0];

  if (!segment) return "-";

  const code = segment.aircd ?? "";
  const number = segment.fltno ?? "";

  return [code, number].filter(Boolean).join("-") || "-";
}

function getSegmentDeparture(
  booking: RetrievedBooking | null
): string {
  const segment = booking?.segs?.[0] as
    | {
        dptm?: string;
        depdt?: string;
      }
    | undefined;

  return (
    segment?.dptm ??
    segment?.depdt ??
    booking?.ddt ??
    "-"
  );
}

function sanitizeForDisplay(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForDisplay);
  }

  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(object)) {
      const lower = key.toLowerCase();

      if (
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("password") ||
        lower.includes("apikey") ||
        lower.includes("api_key")
      ) {
        continue;
      }

      cleaned[key] = sanitizeForDisplay(val);
    }

    return cleaned;
  }

  return value;
}

/* =========================================================
   INITIATE RESPONSE NORMALIZATION
========================================================= */

function getInitiateEnvelope(
  value: InitiateAmendmentResponse | null
): BontonInitiateEnvelope | null {
  if (!value) return null;

  const raw = value as unknown as Record<string, unknown>;

  /*
   * Actual Bonton response:
   *
   * {
   *   success: true,
   *   data: {
   *     isscc: true,
   *     err: "",
   *     data: {
   *       segs: [],
   *       trv: [],
   *       amtyps: []
   *     }
   *   }
   * }
   */

  if (
    raw.data &&
    typeof raw.data === "object" &&
    !Array.isArray(raw.data)
  ) {
    const outerData = raw.data as Record<string, unknown>;

     if (
      outerData.data &&
      typeof outerData.data === "object" &&
      !Array.isArray(outerData.data)
     ) {
      return outerData.data as BontonInitiateEnvelope;
}
    /*
     * Also support an already-normalized response:
     *
     * {
     *   data: {
     *     segs: [],
     *     trv: [],
     *     amtyps: []
     *   }
     * }
     */
    if (
      "segs" in outerData ||
      "trv" in outerData ||
      "amtyps" in outerData
    ) {
      return {
        isscc: true,
        err: "",
        data: outerData as BontonInitiateInnerData,
      };
    }
  }

   return null;
}

function getInitiateData(
  value: InitiateAmendmentResponse | null
): BontonInitiateInnerData | null {
  const envelope = getInitiateEnvelope(value);

  return envelope?.data ?? null;
}

function getInitiateError(
  value: InitiateAmendmentResponse | null
): string {
  const envelope = getInitiateEnvelope(value);

  return envelope?.err ?? "";
}

/* =========================================================
   RECORD NORMALIZATION
========================================================= */

function normalizeAmendmentRecord(
  value: AmendmentRecordData | null
): BontonAmendmentRecord | null {
  if (!value) return null;

  const raw = value as unknown as Record<string, unknown>;

  /*
   * Expected from our frontend API layer:
   *
   * {
   *   amtyp,
   *   amsts,
   *   paxi,
   *   chg
   * }
   */

  if (
    "amsts" in raw ||
    "amtyp" in raw ||
    "paxi" in raw ||
    "chg" in raw
  ) {
    return raw as BontonAmendmentRecord;
  }

  /*
   * Fallback for wrapped response.
   */

  if (
    raw.data &&
    typeof raw.data === "object" &&
    !Array.isArray(raw.data)
  ) {
    return raw.data as BontonAmendmentRecord;
  }

  return raw as BontonAmendmentRecord;
}

/* =========================================================
   LIFECYCLE
========================================================= */

function deriveLifecycleStage(
  hasBooking: boolean,
  hasInitiate: boolean,
  hasAmendmentId: boolean,
  status?: string
): AmendmentLifecycleStage {
  const normalized = (status ?? "").toLowerCase();

  if (
    normalized.includes("cancel") ||
    normalized.includes("reject")
  ) {
    return normalized.includes("cancel")
      ? "cancelled"
      : "rejected";
  }

  if (
    normalized.includes("accept") ||
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized.includes("confirmed")
  ) {
    return "accepted";
  }

  if (
    normalized.includes("quotation") ||
    normalized.includes("pending") ||
    normalized.includes("process") ||
    normalized.includes("sent") ||
    normalized.includes("received")
  ) {
    return "request_sent";
  }

  if (hasAmendmentId) {
    return "amendment_created";
  }

  if (hasInitiate) {
    return "amendment_initiated";
  }

  if (hasBooking) {
    return "booking_retrieved";
  }

  return "idle";
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
        {label}
      </p>

      <p className="text-sm sm:text-base font-semibold text-white break-words">
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-white/60 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

const LIFECYCLE_STEPS: {
  key: AmendmentLifecycleStage;
  label: string;
}[] = [
  {
    key: "booking_retrieved",
    label: "Booking Retrieved",
  },
  {
    key: "amendment_initiated",
    label: "Amendment Initiated",
  },
  {
    key: "amendment_created",
    label: "Amendment Created",
  },
  {
    key: "request_sent",
    label: "Quotation / Request Received",
  },
  {
    key: "accepted",
    label: "Accepted",
  },
];

function AmendmentTimeline({
  currentStage,
  recordStatus,
}: {
  currentStage: AmendmentLifecycleStage;
  recordStatus?: string;
}) {
  const terminal =
    currentStage === "cancelled" ||
    currentStage === "rejected";

  const stageOrder: AmendmentLifecycleStage[] = [
    "booking_retrieved",
    "amendment_initiated",
    "amendment_created",
    "request_sent",
    "accepted",
  ];

  let currentIndex = stageOrder.indexOf(currentStage);

  if (currentStage === "cancelled") {
    currentIndex = 2;
  }

  if (currentStage === "rejected") {
    currentIndex = 3;
  }

  return (
    <div className="space-y-4">
      {LIFECYCLE_STEPS.map((step, index) => {
        const isComplete =
          currentIndex >= index &&
          currentStage !== "idle";

        const isCurrent =
          stageOrder[index] === currentStage &&
          !terminal;

        return (
          <div
            key={step.key}
            className="flex items-center gap-3"
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : isCurrent ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-white/25 shrink-0" />
            )}

            <span
              className={
                isComplete || isCurrent
                  ? "text-white font-medium"
                  : "text-white/40"
              }
            >
              {step.label}
            </span>
          </div>
        );
      })}

      {terminal && (
        <div className="flex items-center gap-3 pt-3 border-t border-white/10">
          {currentStage === "cancelled" ? (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}

          <span className="text-white font-medium">
            {currentStage === "cancelled"
              ? "Cancelled"
              : "Rejected"}

            {recordStatus
              ? ` — ${recordStatus}`
              : ""}
          </span>
        </div>
      )}

      {!terminal && recordStatus && (
        <p className="text-sm text-blue-300 pt-2">
          Current Bonton status:{" "}
          <strong>{recordStatus}</strong>
        </p>
      )}
    </div>
  );
}

/* =========================================================
   API LOG PANEL
========================================================= */

function ApiDetailsPanel({
  logs,
}: {
  logs: ApiOperationLog[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">
            API Details
          </h2>

          <p className="text-sm text-white/60 mt-1">
            Safe request/response log for JetlyXo → EC2 → Bonton
          </p>
        </div>

        {open ? (
          <ChevronUp className="w-5 h-5 text-white/60" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/60" />
        )}
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-white/10">
          <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 text-sm text-white/70 space-y-1">
            <p>JetlyXo Frontend</p>
            <p className="pl-4">↓</p>
            <p>EC2 Backend ({maskApiHost(API_URL)})</p>
            <p className="pl-4">↓</p>
            <p>Bonton API</p>
            <p className="pl-4">↓</p>
            <p>Response</p>
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-white/50">
              No API operations yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[32rem] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl bg-slate-950/60 border border-white/10 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-white">
                      {log.operation}
                    </span>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        log.success
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {log.success
                        ? "Success"
                        : "Failed"}
                    </span>

                    {log.httpStatus !== undefined && (
                      <span className="text-xs text-white/50">
                        HTTP {log.httpStatus}
                      </span>
                    )}

                    <span className="text-xs text-white/40 ml-auto">
                      {log.timestamp}
                    </span>
                  </div>

                  {log.error && (
                    <p className="text-sm text-red-300 mb-2">
                      {log.error}
                    </p>
                  )}

                  {log.response !== undefined && (
                    <pre className="text-xs text-white/70 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(
                        sanitizeForDisplay(log.response),
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function AmendmentPageContent() {
  const searchParams = useSearchParams();

  const initialBookingCode =
  searchParams.get("bookingCode") ?? "";

  const initialBookingId =
  searchParams.get("bookingId") ?? "";

  /* -------------------------------------------------------
     BOOKING
  ------------------------------------------------------- */

  const [bookingCodeInput, setBookingCodeInput] =
    useState(initialBookingCode);
  
  const [loadingJetlyBooking, setLoadingJetlyBooking] =
    useState(false);
  const [activeBookingCode, setActiveBookingCode] =
    useState("");

  const [booking, setBooking] =
    useState<RetrievedBooking | null>(null);

  /* -------------------------------------------------------
     INITIATE
  ------------------------------------------------------- */

  const [initiateData, setInitiateData] =
    useState<InitiateAmendmentResponse | null>(null);

  const [selectedType, setSelectedType] =
    useState("");

  /* -------------------------------------------------------
     CREATE
  ------------------------------------------------------- */

  const [amendmentId, setAmendmentId] =
    useState("");

  /* -------------------------------------------------------
     RECORD
  ------------------------------------------------------- */

  const [record, setRecord] =
    useState<AmendmentRecordData | null>(null);

  /* -------------------------------------------------------
     OPTIONAL CREATE FIELDS
  ------------------------------------------------------- */

  const [oldTravelDate, setOldTravelDate] =
    useState("");

  const [newTravelDate, setNewTravelDate] =
    useState("");

  const [newFirstName, setNewFirstName] =
    useState("");

  const [newLastName, setNewLastName] =
    useState("");

  const [extraBaggage, setExtraBaggage] =
    useState("");

  const [mealRequest, setMealRequest] =
    useState("");

  const [remark, setRemark] =
    useState("");

  const [wheelchair, setWheelchair] =
    useState(false);

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  const [loadingRetrieve, setLoadingRetrieve] =
    useState(false);

  const [loadingInitiate, setLoadingInitiate] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [accepting, setAccepting] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  /* -------------------------------------------------------
     BACKEND STATUS
  ------------------------------------------------------- */

  const [backendConnected, setBackendConnected] =
    useState<
      "unknown" | "connected" | "disconnected"
    >("unknown");

  const [apiLogs, setApiLogs] =
    useState<ApiOperationLog[]>([]);

  /* -------------------------------------------------------
     NORMALIZED INITIATE DATA
  ------------------------------------------------------- */

  const normalizedInitiate = useMemo(
    () => getInitiateData(initiateData),
    [initiateData]
  );

  const availableAmendmentTypes = useMemo(() => {
    const apiTypes =
      normalizedInitiate?.amtyps ?? [];

    if (apiTypes.length > 0) {
      return apiTypes;
    }

    return [];
  }, [normalizedInitiate]);

  const initiateSegments =
    normalizedInitiate?.segs ?? [];

  const initiateTravelers =
    normalizedInitiate?.trv ?? [];

  /* -------------------------------------------------------
     SELECTED SEGMENT / PASSENGER
  ------------------------------------------------------- */

  const selectedSegment =
    initiateSegments[0];

  const selectedTraveler =
    initiateTravelers[0];

  /* -------------------------------------------------------
     RECORD
  ------------------------------------------------------- */

  const normalizedRecord = useMemo(
    () => normalizeAmendmentRecord(record),
    [record]
  );

  const recordStatus =
    normalizedRecord?.amsts ?? "";

  const currency =
    normalizedRecord?.cur ?? "INR";

  /* -------------------------------------------------------
     LIFECYCLE
  ------------------------------------------------------- */

  const lifecycleStage = useMemo(
    () =>
      deriveLifecycleStage(
        Boolean(booking),
        Boolean(initiateData),
        Boolean(amendmentId),
        recordStatus
      ),
    [
      booking,
      initiateData,
      amendmentId,
      recordStatus,
    ]
  );

  /* -------------------------------------------------------
     BUSY
  ------------------------------------------------------- */

  const isBusy =
    loadingJetlyBooking ||
    loadingRetrieve ||
    loadingInitiate ||
    creating ||
    refreshing ||
    accepting ||
    cancelling;

  /* =======================================================
     API LOGGING
  ======================================================= */

  const appendLog = useCallback(
    (
      entry: Omit<
        ApiOperationLog,
        "id" | "timestamp"
      >
    ) => {
      setApiLogs((prev) => [
        {
          ...entry,
          id: `${Date.now()}-${prev.length}`,
          timestamp:
            new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    },
    []
  );

  const runOperation = useCallback(
    async <T,>(
      operation: string,
      fn: () => Promise<T>
    ): Promise<T | null> => {
      try {
        const result = await fn();

        setBackendConnected("connected");

        appendLog({
          operation,
          success: true,
          httpStatus: 200,
          response: result,
        });

        return result;
      } catch (error) {
        const httpStatus =
          getHttpStatus(error);

        setBackendConnected(
          httpStatus
            ? "connected"
            : "disconnected"
        );

        const message =
          getAmendmentErrorMessage(error);

        appendLog({
          operation,
          success: false,
          httpStatus,
          error: message,
        });

        toast.error(message);

        return null;
      }
    },
    [appendLog]
  );

  /* =======================================================
     RETRIEVE BOOKING
  ======================================================= */

 const handleRetrieveBooking = useCallback(
  async (codeOverride?: string) => {
    const code =
      codeOverride?.trim() ||
      bookingCodeInput.trim();

      if (!code) {
        toast.warning(
          "Please enter the encrypted booking code."
        );
        return;
      }

      setLoadingRetrieve(true);

      setBooking(null);
      setInitiateData(null);
      setSelectedType("");
      setAmendmentId("");
      setRecord(null);
      setActiveBookingCode("");

      const result = await runOperation(
        "Retrieve Booking",
        () => retrieveAmendmentBooking(code)
      );

      setLoadingRetrieve(false);

      if (!result) {
        return;
      }

      if (
        !result.brn &&
        !result.invno &&
        !result.pnr &&
        !result.gdsPnr
      ) {
        toast.error(
          "Booking response did not contain recognizable booking information."
        );

        return;
      }

      setBooking(result);
      setActiveBookingCode(code);

      toast.success(
        "Booking retrieved successfully."
      );
    },
    [
      bookingCodeInput,
      runOperation,
    ]
  );

  /* =======================================================
     INITIATE AMENDMENT
  ======================================================= */

  const handleInitiateAmendment = async () => {
  if (!activeBookingCode) {
    toast.warning("Retrieve a booking first.");
    return;
  }

  setLoadingInitiate(true);
  setInitiateData(null);
  setSelectedType("");
  setAmendmentId("");
  setRecord(null);

  const result = await runOperation(
    "Initiate Amendment",
    () => initiateAmendment(activeBookingCode)
  );

  setLoadingInitiate(false);

  if (!result) {
    return;
  }

  const inner = getInitiateData(result);
  console.log("========== AMENDMENT DEBUG ==========");
console.log("RAW INITIATE RESULT:", result);
console.log("NORMALIZED INNER:", inner);
console.log("AMENDMENT TYPES:", inner?.amtyps);
console.log("=====================================");

  if (!inner) {
    toast.error(
      "Bonton returned an invalid initiate response."
    );
    return;
  }

  // Check the NEW response directly
  if (!inner.amtyps?.length) {
    toast.warning(
      "Bonton did not return any amendment types for this booking."
    );
  } else {
    toast.success(
      `${inner.amtyps.length} amendment options loaded.`
    );
  }

  const traveler = inner.trv?.[0];
  const segment = inner.segs?.[0];

  if (segment) {
    const retrievedDate = getSegmentDeparture(booking);

    if (retrievedDate !== "-") {
      setOldTravelDate(formatDate(retrievedDate));
    }
  }

  if (traveler) {
    setNewFirstName(traveler.fnm ?? "");
    setNewLastName(traveler.lnm ?? "");
  }

  setInitiateData(result);
};

  /* =======================================================
     CREATE AMENDMENT
  ======================================================= */

  const handleCreateAmendment =
    async () => {
      if (!selectedType) {
        toast.warning(
          "Please select an amendment type."
        );
        return;
      }

      if (!initiateData) {
        toast.error(
          "Initiate amendment data is missing."
        );
        return;
      }

      if (!activeBookingCode) {
        toast.error(
          "Booking code is missing."
        );
        return;
      }

      /*
       * Build the standard Bonton payload.
       *
       * This uses the segment and passenger IDs
       * returned by Initiate.
       */

      const payload =
        buildCreateAmendmentPayload(
          activeBookingCode,
          selectedType,
          initiateData
        );

      if (!payload) {
        toast.error(
          "Unable to build amendment payload. Bonton did not return a segment or passenger ID."
        );
        return;
      }

      /*
       * Apply optional amendment fields.
       *
       * Bonton accepts these fields inside trseg[0].
       */

      const segmentPayload =
        payload.trseg[0];

      if (segmentPayload) {
        segmentPayload.oddt =
          oldTravelDate || "";

        segmentPayload.nwdt =
          newTravelDate || "";

        segmentPayload.pax.fnm =
          newFirstName;

        segmentPayload.pax.lnm =
          newLastName;

        segmentPayload.pax.iswhl =
          wheelchair;

        segmentPayload.pax.isml =
          Boolean(mealRequest);

        segmentPayload.pax.exbg =
          extraBaggage;
      }

      payload.agrmk = remark;

 console.log("========== CREATE AMENDMENT PAYLOAD ==========");
console.log(JSON.stringify(payload, null, 2));
console.log("==============================================");

      setCreating(true);
  

      const result =
        await runOperation(
          "Create Amendment",
          () =>
            createAmendment(payload)
        );

      setCreating(false);

      if (!result) {
        return;
      }

      /*
       * API layer should return:
       *
       * {
       *   status: true,
       *   msg: "",
       *   code: "..."
       * }
       */

      const raw =
  result as unknown as Record<string, any>;

const level1 =
  raw.data &&
  typeof raw.data === "object"
    ? raw.data
    : null;

const level2 =
  level1?.data &&
  typeof level1.data === "object"
    ? level1.data
    : null;

const amendmentId =
  (typeof raw.code === "string"
    ? raw.code
    : undefined) ??
  (typeof level1?.code === "string"
    ? level1.code
    : undefined) ??
  (typeof level2?.code === "string"
    ? level2.code
    : undefined);

const amendmentStatus =
  raw.status === true ||
  level1?.status === true ||
  level2?.status === true;

console.log("========== CREATE AMENDMENT RESPONSE ==========");
console.log("RAW:", raw);
console.log("LEVEL 1:", level1);
console.log("LEVEL 2:", level2);
console.log("AMENDMENT ID:", amendmentId);
console.log("STATUS:", amendmentStatus);
console.log("================================================"); 

if (!amendmentStatus) {
  const errorMessage =
    typeof level2?.msg === "string"
      ? level2.msg
      : typeof level1?.msg === "string"
        ? level1.msg
        : typeof raw.msg === "string"
          ? raw.msg
          : "Bonton rejected the amendment creation request.";

  toast.error(errorMessage);
  return;
}

if (!amendmentId) {
  toast.error(
    "Bonton accepted the amendment but did not return an amendment ID."
  );
  return;
}
    

      setAmendmentId(amendmentId);

toast.success(
  "Amendment request created successfully."
);

await handleRefreshRecord(amendmentId);
    };

  /* =======================================================
     RECORD
  ======================================================= */

  const handleRefreshRecord = async (
  idOverride?: string
) => {
  const id = idOverride ?? amendmentId;

  if (!id) {
    toast.warning("No amendment ID available.");
    return;
  }

  setRefreshing(true);

  const result = await runOperation(
    "Amendment Record",
    () => amendmentRecord(id)
  );

  setRefreshing(false);

  if (!result) {
    return;
  }

  /*
   * Bonton response:
   *
   * {
   *   success: true,
   *   message: "Success",
   *   errorCode: null,
   *   data: {
   *     amtyp: "...",
   *     amsts: "...",
   *     paxi: [],
   *     chg: {}
   *   }
   * }
   *
   * Depending on the API-layer type, `result` may already
   * be the data object or it may still contain `data`.
   */

  const raw = result as unknown as Record<string, unknown>;

  const recordData =
    raw.data &&
    typeof raw.data === "object" &&
    !Array.isArray(raw.data)
      ? (raw.data as AmendmentRecordData)
      : (result as unknown as AmendmentRecordData);

  setRecord(recordData);
};

  /* =======================================================
     ACCEPT
  ======================================================= */

  const handleAcceptAmendment =
    async () => {
      if (!amendmentId) {
        toast.warning(
          "No amendment ID available."
        );
        return;
      }

      const status =
        (
          normalizedRecord?.amsts ?? ""
        ).toLowerCase();

      /*
       * Bonton documentation says Accept is
       * intended for an approved amendment.
       *
       * We allow known quotation/approved states.
       * Unknown statuses are also allowed because
       * Bonton may introduce additional status text.
       */

      const acceptedStatuses = [
        "quotation received",
        "approved",
        "approval received",
        "ready for acceptance",
      ];

      const isKnownNonAcceptable =
        status &&
        (
          status.includes("pending") ||
          status.includes("rejected") ||
          status.includes("cancelled") ||
          status.includes("canceled")
        ) &&
        !acceptedStatuses.some(
          (allowed) =>
            status.includes(allowed)
        );

      if (isKnownNonAcceptable) {
        toast.warning(
          `Bonton currently reports "${normalizedRecord?.amsts}". Refresh the amendment before accepting it.`
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to accept this amendment? Bonton may apply additional charges or refunds."
        );

      if (!confirmed) {
        return;
      }

      setAccepting(true);

      const result =
        await runOperation(
          "Accept Amendment",
          () =>
            acceptAmendment(
              amendmentId
            )
        );

      setAccepting(false);

      if (!result) {
        return;
      }

      const acceptResult =
        result as unknown as BontonAcceptResponse;

      if (
        acceptResult.status === false
      ) {
        toast.error(
          "Bonton did not accept the amendment."
        );
        return;
      }

      toast.success(
        "Amendment accepted successfully."
      );

      await handleRefreshRecord();
    };

  /* =======================================================
     CANCEL
  ======================================================= */

  const handleCancelAmendment =
    async () => {
      if (!amendmentId) {
        toast.warning(
          "No amendment ID available."
        );
        return;
      }

      const status =
        (
          normalizedRecord?.amsts ?? ""
        ).toLowerCase();

      if (
        status &&
        !status.includes("pending") &&
        !status.includes("created")
      ) {
        toast.warning(
          `Bonton reports "${normalizedRecord?.amsts}". Only pending amendment requests should be cancelled.`
        );
        return;
      }

      const reason =
        window.prompt(
          "Enter cancellation / rejection reason:",
          "reject"
        );

      if (reason === null) {
        return;
      }

      const finalReason =
        reason.trim() || "reject";

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this amendment request?"
        );

      if (!confirmed) {
        return;
      }

      setCancelling(true);

      const result =
        await runOperation(
          "Cancel Amendment",
          () =>
            cancelAmendment(
              amendmentId,
              finalReason
            )
        );

      setCancelling(false);

      if (!result) {
        return;
      }

      const cancelResult =
        result as unknown as BontonCancelResponse;

      if (
        cancelResult.status === false
      ) {
        toast.error(
          "Bonton did not cancel the amendment."
        );
        return;
      }

      toast.success(
        "Amendment cancelled successfully."
      );

      await handleRefreshRecord();
    };

  /* =======================================================
     AUTO RETRIEVE
  ======================================================= */

  useEffect(() => {
  const loadBookingCode = async () => {
    // -------------------------------------------------
    // Case 1: Booking Success already supplied Bonton code
    // -------------------------------------------------
    if (initialBookingCode) {
  setBookingCodeInput(initialBookingCode);

  setTimeout(() => {
    void handleRetrieveBooking(initialBookingCode);
  }, 0);

  return;
}

    // -------------------------------------------------
    // Case 2: Booking Success supplied Jetly booking ID
    // -------------------------------------------------
    if (initialBookingId) {
      const id = Number(initialBookingId);

      if (!Number.isInteger(id) || id <= 0) {
        toast.error("Invalid booking ID.");
        return;
      }

      try {
        setLoadingJetlyBooking(true);

        console.log(
          "========== LOADING JETLY BOOKING =========="
        );
        console.log("Jetly Booking ID:", id);

        const jetlyBooking =
          await getBookingById(id);

        console.log(
          "JETLY BOOKING:",
          jetlyBooking
        );

        const bookingWithFlightData = jetlyBooking as typeof jetlyBooking & {
  flightData?: Array<{
    id?: string;
    brn?: string;
  }>;
};

const flightData = Array.isArray(bookingWithFlightData.flightData)
  ? bookingWithFlightData.flightData[0]
  : null;

const bontonBookingCode =
  flightData?.id ??
  "";

        if (!bontonBookingCode) {
  toast.error(
    "Encrypted Bonton booking code was not found in this booking."
  );
  return;
}

    
console.log(
  "BONTON ENCRYPTED BOOKING CODE:",
  bontonBookingCode
);

        setBookingCodeInput(
          bontonBookingCode
        );

        // Automatically retrieve from Bonton
        setTimeout(() => {
          void handleRetrieveBooking(
            bontonBookingCode
          );
        }, 0);

      } catch (error) {
        console.error(
          "FAILED TO LOAD JETLY BOOKING:",
          error
        );

        toast.error(
          "Unable to load booking details."
        );
      } finally {
        setLoadingJetlyBooking(false);
      }
    }
  };

  void loadBookingCode();

  // Initial query parameters only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  /* =======================================================
     DISPLAY VALUES
  ======================================================= */

  const bookingCodeDisplay =
    booking?.brn ??
    booking?.invno ??
    activeBookingCode ??
    "-";

  const pnrDisplay =
    booking?.pnr ??
    booking?.gdsPnr ??
    "-";

  const flightNumber =
    getFlightNumber(booking);

  const origin =
    booking?.segs?.[0]?.orgcty ??
    booking?.org ??
    "-";

  const destination =
    booking?.segs?.[0]?.dstcty ??
    booking?.dst ??
    "-";

  const departure =
    getSegmentDeparture(booking);

  const passengerName =
    getPassengerName(booking);

  const recordCharge =
    normalizedRecord?.chg?.chg ?? 0;

  const refundAmount =
    normalizedRecord?.chg?.rfd ?? 0;

  const cancellationCharge =
    normalizedRecord?.chg?.cnchg ?? 0;

  const serviceCharge =
    normalizedRecord?.chg?.svchg ?? 0;

  const terminalStatus =
    recordStatus.toLowerCase();

  const canCancel =
    Boolean(amendmentId) &&
    !terminalStatus.includes(
      "cancel"
    ) &&
    !terminalStatus.includes(
      "reject"
    ) &&
    !terminalStatus.includes(
      "accepted"
    ) &&
    !terminalStatus.includes(
      "confirmed"
    );

  const canAccept =
    Boolean(amendmentId) &&
    !terminalStatus.includes(
      "cancel"
    ) &&
    !terminalStatus.includes(
      "reject"
    ) &&
    !terminalStatus.includes(
      "accepted"
    ) &&
    !terminalStatus.includes(
      "confirmed"
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <p className="text-blue-400 text-sm font-medium">
              JetlyXO · Bonton Integration
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Amendment Management
            </h1>

            <p className="text-white/60 text-sm mt-2 max-w-2xl">
              Manage the complete Bonton amendment lifecycle:
              Retrieve → Initiate → Create → Record →
              Accept / Cancel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLiveApi && (
              <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Live API
              </span>
            )}

            <div className="flex items-center gap-2 text-sm bg-slate-900 border border-white/10 rounded-full px-3 py-1.5">
              <Server className="w-4 h-4 text-white/60" />

              <span className="text-white/70">
                Backend:
              </span>

              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  backendConnected ===
                  "connected"
                    ? "text-emerald-400"
                    : backendConnected ===
                        "disconnected"
                      ? "text-red-400"
                      : "text-white/50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendConnected ===
                    "connected"
                      ? "bg-emerald-400"
                      : backendConnected ===
                          "disconnected"
                        ? "bg-red-400"
                        : "bg-white/30"
                  }`}
                />

                {backendConnected ===
                "connected"
                  ? "Connected"
                  : backendConnected ===
                      "disconnected"
                    ? "Disconnected"
                    : "Awaiting request"}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            STEP 1 — RETRIEVE
        ================================================= */}

        <SectionCard
          title="1. Retrieve Booking"
          subtitle="Use the encrypted Bonton booking code returned during booking."
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Encrypted Booking Code"
              value={bookingCodeInput}
              onChange={(event) =>
                setBookingCodeInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !isBusy
                ) {
                  void handleRetrieveBooking();
                }
              }}
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 placeholder:text-white/40"
            />

            <button
              type="button"
              onClick={() =>
                void handleRetrieveBooking()
              }
              disabled={
                loadingRetrieve ||
                isBusy
              }
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {loadingRetrieve ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}

              {loadingRetrieve
                ? "Retrieving..."
                : "Retrieve Booking"}
            </button>
          </div>

          <p className="text-xs text-white/40">
            This calls your Jetly backend retrieve route,
            which calls Bonton:
            <span className="text-white/60">
              {" "}
              GET /flightapi/retrieve/:booking_code
            </span>
          </p>
        </SectionCard>

        {/* =================================================
            BOOKING DETAILS
        ================================================= */}

        {booking && (
          <SectionCard
            title="Booking Details"
            subtitle="Booking information returned by Bonton Retrieve."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DetailCard
                label="Booking Reference"
                value={bookingCodeDisplay}
              />

              <DetailCard
                label="PNR"
                value={pnrDisplay}
              />

              <DetailCard
                label="Passenger"
                value={passengerName}
              />

              <DetailCard
                label="Flight"
                value={flightNumber}
              />

              <DetailCard
                label="Origin"
                value={origin}
              />

              <DetailCard
                label="Destination"
                value={destination}
              />

              <DetailCard
                label="Departure"
                value={formatDateTime(
                  departure
                )}
              />

              <DetailCard
                label="Booking Status"
                value={
                  booking.status ?? "-"
                }
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                Trip:{" "}
                {String(
                  booking.trpt ??
                    "Unknown"
                )}
              </span>

              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                Cabin:{" "}
                {String(
                  booking.cbcls ??
                    "Unknown"
                )}
              </span>

              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">
                Fare:{" "}
                {String(
                  booking.fartyp ??
                    "Unknown"
                )}
              </span>
            </div>
          </SectionCard>
        )}

        {/* =================================================
            STEP 2 — INITIATE
        ================================================= */}

        {booking && !initiateData && (
          <SectionCard
            title="2. Initiate Amendment"
            subtitle="Ask Bonton which amendment actions are currently allowed for this booking."
          >
            <button
              type="button"
              onClick={() =>
                void handleInitiateAmendment()
              }
              disabled={
                loadingInitiate ||
                isBusy
              }
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {loadingInitiate && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {loadingInitiate
                ? "Loading Options..."
                : "Initiate Amendment"}
            </button>
          </SectionCard>
        )}

        {/* =================================================
            INITIATE RESULT
        ================================================= */}

        {initiateData && (
          <SectionCard
            title="Available Amendment Actions"
            subtitle="These options come directly from Bonton's Initiate Amendment response."
          >
            {getInitiateError(initiateData) && (
  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
    {getInitiateError(initiateData)}
  </div>
)}

            {/* Segment */}
            {selectedSegment && (
              <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Amendment Segment
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <DetailCard
                    label="Origin"
                    value={
                      selectedSegment.org ??
                      "-"
                    }
                  />

                  <DetailCard
                    label="Destination"
                    value={
                      selectedSegment.dst ??
                      "-"
                    }
                  />

                  <DetailCard
                    label="Segment ID"
                    value={
                      selectedSegment.id
                    }
                  />

                  <DetailCard
                    label="Return"
                    value={
                      selectedSegment.isret
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>
              </div>
            )}

            {/* Passenger */}
            {selectedTraveler && (
              <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Amendment Passenger
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <DetailCard
                    label="Name"
                    value={[
                      selectedTraveler.pfx,
                      selectedTraveler.fnm,
                      selectedTraveler.lnm,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                      "-"
                    }
                  />

                  <DetailCard
                    label="Passenger ID"
                    value={
                      selectedTraveler.id
                    }
                  />

                  <DetailCard
                    label="Prefix"
                    value={
                      selectedTraveler.pfx ??
                      "-"
                    }
                  />
                </div>
              </div>
            )}

            {/* Amendment types */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Allowed Amendment Types
              </h3>

              {availableAmendmentTypes.length >
              0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableAmendmentTypes.map(
                    (type) => (
                      <label
                        key={type}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                          selectedType ===
                          type
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-slate-800/50 hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="amendmentType"
                          value={type}
                          checked={
                            selectedType ===
                            type
                          }
                          onChange={() =>
                            setSelectedType(
                              type
                            )
                          }
                          className="accent-blue-500"
                        />

                        <span className="text-white font-medium text-sm">
                          {type}
                        </span>
                      </label>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
                  Bonton did not return any
                  amendment types for this
                  booking.
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* =================================================
            STEP 3 — CREATE
        ================================================= */}

        {initiateData &&
          selectedType && (
            <SectionCard
              title="3. Create Amendment"
              subtitle={`Prepare the request for "${selectedType}".`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old date */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Original Travel Date
                  </label>

                  <input
                    type="date"
                    value={oldTravelDate}
                    onChange={(event) =>
                      setOldTravelDate(
                        event.target.value
                      )
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* New date */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    New Travel Date
                  </label>

                  <input
                    type="date"
                    value={newTravelDate}
                    onChange={(event) =>
                      setNewTravelDate(
                        event.target.value
                      )
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* First name */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Updated First Name
                  </label>

                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(event) =>
                      setNewFirstName(
                        event.target.value
                      )
                    }
                    placeholder={
                      selectedTraveler?.fnm ??
                      "First name"
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Last name */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Updated Last Name
                  </label>

                  <input
                    type="text"
                    value={newLastName}
                    onChange={(event) =>
                      setNewLastName(
                        event.target.value
                      )
                    }
                    placeholder={
                      selectedTraveler?.lnm ??
                      "Last name"
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Baggage */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Extra Baggage
                  </label>

                  <input
                    type="text"
                    value={extraBaggage}
                    onChange={(event) =>
                      setExtraBaggage(
                        event.target.value
                      )
                    }
                    placeholder="Example: 5KG"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Meal */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Meal Request
                  </label>

                  <input
                    type="text"
                    value={mealRequest}
                    onChange={(event) =>
                      setMealRequest(
                        event.target.value
                      )
                    }
                    placeholder="Example: Vegetarian Meal"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Wheelchair */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wheelchair}
                  onChange={(event) =>
                    setWheelchair(
                      event.target.checked
                    )
                  }
                  className="w-4 h-4 accent-blue-500"
                />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Wheelchair Request
                  </p>

                  <p className="text-xs text-white/50">
                    Sets Bonton pax.iswhl to true.
                  </p>
                </div>
              </label>

              {/* Remark */}
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Agent Remark
                </label>

                <textarea
                  value={remark}
                  onChange={(event) =>
                    setRemark(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Optional remark"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Payload preview */}
              <div className="rounded-xl bg-slate-950/70 border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-400" />

                  <h3 className="text-sm font-semibold text-white">
                    Bonton Request Summary
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <DetailCard
                    label="Booking ID"
                    value={
                      activeBookingCode
                    }
                  />

                  <DetailCard
                    label="Amendment Type"
                    value={
                      selectedType
                    }
                  />

                  <DetailCard
                    label="Segment ID"
                    value={
                      selectedSegment?.id ??
                      "-"
                    }
                  />

                  <DetailCard
                    label="Passenger ID"
                    value={
                      selectedTraveler?.id ??
                      "-"
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleCreateAmendment()
                }
                disabled={
                  creating ||
                  isBusy ||
                  !selectedType
                }
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                {creating && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {creating
                  ? "Creating Amendment..."
                  : "Create Amendment"}
              </button>
            </SectionCard>
          )}

        {/* =================================================
            STEP 4 — RECORD
        ================================================= */}

        {(amendmentId ||
          normalizedRecord) && (
          <SectionCard
            title="4. Amendment Record"
            subtitle="Current amendment quotation/status returned by Bonton."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailCard
                    label="Amendment ID"
                    value={
                      amendmentId || "-"
                    }
                  />

                  <DetailCard
                    label="Amendment Type"
                    value={
                      normalizedRecord
                        ?.amtyp ??
                      selectedType ??
                      "-"
                    }
                  />

                  <DetailCard
                    label="Bonton Status"
                    value={
                      normalizedRecord
                        ?.amsts ??
                      "-"
                    }
                  />

                  <DetailCard
                    label="Currency"
                    value={
                      normalizedRecord
                        ?.cur ??
                      "INR"
                    }
                  />

                  <DetailCard
                    label="Invoice"
                    value={
                      normalizedRecord
                        ?.invno ||
                      "-"
                    }
                  />

                  <DetailCard
                    label="Payment Required"
                    value={
                      normalizedRecord
                        ?.ispay
                        ? "Yes"
                        : "No"
                    }
                  />

                  <DetailCard
                    label="Refund Applicable"
                    value={
                      normalizedRecord
                        ?.isrf
                        ? "Yes"
                        : "No"
                    }
                  />

                  <DetailCard
                    label="Reject Reason"
                    value={
                      normalizedRecord
                        ?.rjrsn ||
                      "-"
                    }
                  />
                </div>

                {/* Charges */}
                <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Financial Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailCard
                      label="Amendment Charge"
                      value={formatCurrency(
                        recordCharge,
                        currency
                      )}
                    />

                    <DetailCard
                      label="Refund"
                      value={formatCurrency(
                        refundAmount,
                        currency
                      )}
                    />

                    <DetailCard
                      label="Cancellation Charge"
                      value={formatCurrency(
                        cancellationCharge,
                        currency
                      )}
                    />

                    <DetailCard
                      label="Service Charge"
                      value={formatCurrency(
                        serviceCharge,
                        currency
                      )}
                    />
                  </div>
                </div>

                {/* Remarks */}
                {(normalizedRecord?.rmk ||
                  normalizedRecord?.cormk) && (
                  <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4 space-y-3">
                    {normalizedRecord.rmk && (
                      <div>
                        <p className="text-xs uppercase text-white/40 mb-1">
                          Remark
                        </p>

                        <p className="text-sm text-white/80">
                          {
                            normalizedRecord.rmk
                          }
                        </p>
                      </div>
                    )}

                    {normalizedRecord.cormk && (
                      <div>
                        <p className="text-xs uppercase text-white/40 mb-1">
                          Corporate Remark
                        </p>

                        <p className="text-sm text-white/80">
                          {
                            normalizedRecord.cormk
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void handleRefreshRecord()
                    }
                    disabled={
                      refreshing ||
                      isBusy ||
                      !amendmentId
                    }
                    className="inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}

                    {refreshing
                      ? "Refreshing..."
                      : "Refresh Status"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleAcceptAmendment()
                    }
                    disabled={
                      accepting ||
                      isBusy ||
                      !canAccept
                    }
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-semibold transition-colors"
                  >
                    {accepting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}

                    {accepting
                      ? "Accepting..."
                      : "Accept Amendment"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleCancelAmendment()
                    }
                    disabled={
                      cancelling ||
                      isBusy ||
                      !canCancel
                    }
                    className="inline-flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-semibold transition-colors"
                  >
                    {cancelling && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}

                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Amendment"}
                  </button>
                </div>
              </div>

              {/* RIGHT — TIMELINE */}
              <div className="bg-slate-950/50 border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white/80 mb-5 uppercase tracking-wide">
                  Amendment Lifecycle
                </h3>

                <AmendmentTimeline
                  currentStage={
                    lifecycleStage
                  }
                  recordStatus={
                    recordStatus ||
                    undefined
                  }
                />
              </div>
            </div>

            {/* Passenger amendment details */}
            {normalizedRecord?.paxi &&
              normalizedRecord.paxi.length >
                0 && (
                <div className="pt-5 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Passenger Amendment Details
                  </h3>

                  <div className="space-y-3">
                    {normalizedRecord.paxi.map(
                      (
                        passenger,
                        index
                      ) => (
                        <div
                          key={`${passenger.paxnm}-${index}`}
                          className="rounded-xl bg-slate-800/60 border border-white/10 p-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <DetailCard
                              label="Passenger"
                              value={
                                passenger.paxnm ??
                                "-"
                              }
                            />

                            <DetailCard
                              label="New Name"
                              value={
                                passenger.npaxnm?.trim() ||
                                "-"
                              }
                            />

                            <DetailCard
                              label="Travel"
                              value={
                                passenger.trvdtl ??
                                "-"
                              }
                            />

                            <DetailCard
                              label="New Travel Date"
                              value={
                                passenger.nbdt ??
                                "-"
                              }
                            />

                            <DetailCard
                              label="Extra Baggage"
                              value={
                                passenger.exbg ||
                                "-"
                              }
                            />

                            <DetailCard
                              label="Meal"
                              value={
                                passenger.ml ||
                                "-"
                              }
                            />

                            <DetailCard
                              label="Preference"
                              value={
                                passenger.prf ||
                                "-"
                              }
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </SectionCard>
        )}

        {/* =================================================
            CURRENT FLOW SUMMARY
        ================================================= */}

        <SectionCard
          title="Amendment Flow"
          subtitle="Current integration flow implemented by the UI."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              "1. Retrieve",
              "2. Initiate",
              "3. Create",
              "4. Record",
              "5. Accept / Cancel",
            ].map((step, index) => (
              <div
                key={step}
                className={`rounded-xl p-4 border ${
                  index <
                  (
                    [
                      "booking_retrieved",
                      "amendment_initiated",
                      "amendment_created",
                      "request_sent",
                      "accepted",
                    ] as AmendmentLifecycleStage[]
                  ).indexOf(
                    lifecycleStage
                  ) +
                    1
                    ? "border-blue-500/30 bg-blue-500/10"
                    : "border-white/10 bg-slate-800/40"
                }`}
              >
                <p className="text-sm font-semibold text-white">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* =================================================
            API DETAILS
        ================================================= */}

        <ApiDetailsPanel
          logs={apiLogs}
        />
      </div>
    </div>
  );
}

/* =========================================================
   PAGE WRAPPER
========================================================= */

export default function AmendmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex justify-center items-center bg-slate-950 text-white">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      }
    >
      <AmendmentPageContent />
    </Suspense>
  );
}