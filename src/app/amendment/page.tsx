"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Loader2,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from "lucide-react";

import { API_URL } from "@/config/env";
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
  AmendmentRecord,
  ApiOperationLog,
  InitiateAmendmentResponse,
  RetrievedBooking,
} from "@/types/amendment";

/* =========================================================
   HELPERS
========================================================= */

const isLiveApi =
  Boolean(process.env.NEXT_PUBLIC_API_URL) &&
  !API_URL.includes("localhost");

function maskApiHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return "configured backend";
  }
}

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
    return normalized.includes("cancel") ? "cancelled" : "rejected";
  }

  if (normalized.includes("accept") || normalized.includes("approved")) {
    return "accepted";
  }

  if (
    normalized.includes("process") ||
    normalized.includes("sent") ||
    normalized.includes("pending") ||
    normalized.includes("quotation")
  ) {
    return "request_sent";
  }

  if (hasAmendmentId) return "amendment_created";
  if (hasInitiate) return "amendment_initiated";
  if (hasBooking) return "booking_retrieved";

  return "idle";
}

function getPassengerName(booking: RetrievedBooking | null): string {
  const traveler = booking?.trv?.[0];
  if (!traveler) return "-";

  return (
    (traveler.name ??
      [traveler.pfx, traveler.fnm, traveler.lnm]
        .filter(Boolean)
        .join(" ")
        .trim()) ||
    "-"
  );
}

function getFlightNumber(booking: RetrievedBooking | null): string {
  const seg = booking?.segs?.[0];
  if (!seg) return "-";

  const code = seg.aircd ?? "";
  const number = seg.fltno ?? "";
  const combined = [code, number].filter(Boolean).join("-");

  return combined || "-";
}

function sanitizeForDisplay(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeForDisplay);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(obj)) {
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
   SUB-COMPONENTS
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
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-white/60 mt-1">{subtitle}</p>
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
  { key: "booking_retrieved", label: "Booking Retrieved" },
  { key: "amendment_initiated", label: "Amendment Initiated" },
  { key: "amendment_created", label: "Amendment Created" },
  { key: "request_sent", label: "Request Sent" },
  { key: "accepted", label: "Accepted" },
];

function AmendmentTimeline({
  currentStage,
  recordStatus,
}: {
  currentStage: AmendmentLifecycleStage;
  recordStatus?: string;
}) {
  const terminal =
    currentStage === "cancelled" || currentStage === "rejected";

  const stageOrder: AmendmentLifecycleStage[] = [
    "booking_retrieved",
    "amendment_initiated",
    "amendment_created",
    "request_sent",
    "accepted",
  ];

  const currentIndex = stageOrder.indexOf(
    terminal
      ? currentStage === "cancelled"
        ? "amendment_created"
        : "request_sent"
      : currentStage
  );

  return (
    <div className="space-y-3">
      {LIFECYCLE_STEPS.map((step, index) => {
        const isComplete = currentIndex >= index && currentStage !== "idle";
        const isCurrent =
          stageOrder[index] === currentStage && !terminal;

        return (
          <div key={step.key} className="flex items-center gap-3">
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
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          {currentStage === "cancelled" ? (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="text-white font-medium capitalize">
            {currentStage === "cancelled" ? "Cancelled" : "Rejected"}
            {recordStatus ? ` — ${recordStatus}` : ""}
          </span>
        </div>
      )}

      {!terminal && recordStatus && (
        <p className="text-sm text-blue-300 mt-2">
          Current status: <strong>{recordStatus}</strong>
        </p>
      )}
    </div>
  );
}

function ApiDetailsPanel({ logs }: { logs: ApiOperationLog[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">API Details</h2>
          <p className="text-sm text-white/60 mt-1">
            Safe request/response log for Bonton integration demo
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-white/60 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/60 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 border-t border-white/10">
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
              No API operations yet. Retrieve a booking to begin.
            </p>
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto">
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
                      {log.success ? "Success" : "Failed"}
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
                    <p className="text-sm text-red-300 mb-2">{log.error}</p>
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
  const initialBookingCode = searchParams.get("bookingCode") ?? "";

  const [bookingCodeInput, setBookingCodeInput] = useState(
    initialBookingCode
  );
  const [activeBookingCode, setActiveBookingCode] = useState("");

  const [booking, setBooking] = useState<RetrievedBooking | null>(
    null
  );
  const [initiateData, setInitiateData] =
    useState<InitiateAmendmentResponse | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [amendmentId, setAmendmentId] = useState("");
  const [record, setRecord] = useState<AmendmentRecord | null>(null);

  const [loadingRetrieve, setLoadingRetrieve] = useState(false);
  const [loadingInitiate, setLoadingInitiate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [backendConnected, setBackendConnected] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");
  const [apiLogs, setApiLogs] = useState<ApiOperationLog[]>([]);

  const isBusy =
    loadingRetrieve ||
    loadingInitiate ||
    creating ||
    refreshing ||
    accepting ||
    cancelling;

  const lifecycleStage = useMemo(
    () =>
      deriveLifecycleStage(
        Boolean(booking),
        Boolean(initiateData),
        Boolean(amendmentId),
        record?.status
      ),
    [booking, initiateData, amendmentId, record?.status]
  );

  const appendLog = useCallback(
    (entry: Omit<ApiOperationLog, "id" | "timestamp">) => {
      setApiLogs((prev) => [
        {
          ...entry,
          id: `${Date.now()}-${prev.length}`,
          timestamp: new Date().toLocaleTimeString(),
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
        if (!(error as { response?: unknown }).response) {
          setBackendConnected("disconnected");
        } else {
          setBackendConnected("connected");
        }

        appendLog({
          operation,
          success: false,
          httpStatus: getHttpStatus(error),
          error: getAmendmentErrorMessage(error),
        });

        toast.error(getAmendmentErrorMessage(error));
        return null;
      }
    },
    [appendLog]
  );

  const handleRetrieveBooking = async () => {
    const code = bookingCodeInput.trim();

    if (!code) {
      toast.warning("Please enter a booking code or PNR.");
      return;
    }

    setLoadingRetrieve(true);
    setBooking(null);
    setInitiateData(null);
    setSelectedType("");
    setAmendmentId("");
    setRecord(null);
    setActiveBookingCode("");

    const result = await runOperation("Retrieve Booking", () =>
      retrieveAmendmentBooking(code)
    );

    setLoadingRetrieve(false);

    if (!result) return;

    if (!result.brn && !result.invno && !result.pnr && !result.gdsPnr) {
      toast.error("Booking retrieved but no recognizable booking data was returned.");
      appendLog({
        operation: "Retrieve Booking",
        success: false,
        error: "Response missing expected booking fields.",
        response: result,
      });
      return;
    }

    setBooking(result);
    setActiveBookingCode(code);
    toast.success("Booking retrieved successfully.");
  };

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

    const result = await runOperation("Initiate Amendment", () =>
      initiateAmendment(activeBookingCode)
    );

    setLoadingInitiate(false);

    if (!result) return;

    setInitiateData(result);
    toast.success("Amendment initiated successfully.");
  };

  const handleCreateAmendment = async () => {
    if (!selectedType) {
      toast.warning("Please select an amendment type.");
      return;
    }

    if (!initiateData) {
      toast.error("Initiate amendment data not found.");
      return;
    }

    const payload = buildCreateAmendmentPayload(
      activeBookingCode,
      selectedType,
      initiateData
    );

    if (!payload) {
      toast.error(
        "Unable to build amendment payload. Segment or passenger data is missing."
      );
      return;
    }

    setCreating(true);

    const result = await runOperation("Create Amendment", () =>
      createAmendment(payload)
    );

    setCreating(false);

    if (!result) return;

    const id = result.data?.code;

    if (!id) {
      toast.error("Amendment ID not received from the server.");
      return;
    }

    setAmendmentId(id);
    toast.success("Amendment created successfully.");

    await handleRefreshRecord(id);
  };

  const handleRefreshRecord = async (idOverride?: string) => {
    const id = idOverride ?? amendmentId;

    if (!id) {
      toast.warning("No amendment ID available to refresh.");
      return;
    }

    setRefreshing(true);

    const result = await runOperation("Amendment Record", () =>
      amendmentRecord(id)
    );

    setRefreshing(false);

    if (result) {
      setRecord(result);
    }
  };

  const handleAcceptAmendment = async () => {
    if (!amendmentId) {
      toast.warning("No amendment ID available.");
      return;
    }

    setAccepting(true);

    const result = await runOperation("Accept Amendment", () =>
      acceptAmendment(amendmentId)
    );

    setAccepting(false);

    if (!result) return;

    toast.success(
      result.status
        ? `Amendment request submitted. Status: ${result.status}`
        : "Accept amendment request sent successfully."
    );

    await handleRefreshRecord();
  };

  const handleCancelAmendment = async () => {
    if (!amendmentId) {
      toast.warning("No amendment ID available.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this amendment?"
    );

    if (!confirmed) return;

    setCancelling(true);

    const result = await runOperation("Cancel Amendment", () =>
      cancelAmendment(amendmentId, "User Cancelled")
    );

    setCancelling(false);

    if (!result) return;

    toast.success("Amendment cancellation request submitted.");
    await handleRefreshRecord();
  };

  useEffect(() => {
    if (initialBookingCode) {
      handleRetrieveBooking();
    }
    // Only auto-retrieve when arriving with a bookingCode query param
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookingCodeDisplay =
    booking?.brn ?? booking?.invno ?? activeBookingCode ?? "-";

  const pnrDisplay = booking?.pnr ?? booking?.gdsPnr ?? "-";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-blue-400 text-sm font-medium">
              JetlyXO · Bonton Integration
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Amendment Management
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Retrieve a booking, initiate an amendment, and manage the full
              lifecycle through the deployed EC2 backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isLiveApi && (
              <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Live API
              </span>
            )}

            <div className="flex items-center gap-2 text-sm bg-slate-900/80 border border-white/10 rounded-full px-3 py-1.5">
              <Server className="w-4 h-4 text-white/60" />
              <span className="text-white/70">Backend:</span>
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  backendConnected === "connected"
                    ? "text-emerald-400"
                    : backendConnected === "disconnected"
                      ? "text-red-400"
                      : "text-white/50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendConnected === "connected"
                      ? "bg-emerald-400"
                      : backendConnected === "disconnected"
                        ? "bg-red-400"
                        : "bg-white/30"
                  }`}
                />
                {backendConnected === "connected"
                  ? "Connected"
                  : backendConnected === "disconnected"
                    ? "Disconnected"
                    : "Awaiting request"}
              </span>
            </div>
          </div>
        </div>

        {/* Booking search */}
        <SectionCard
          title="Booking Search"
          subtitle="Enter the booking code or PNR to retrieve booking details"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Booking Code / PNR"
              value={bookingCodeInput}
              onChange={(e) => setBookingCodeInput(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isBusy) {
                  handleRetrieveBooking();
                }
              }}
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={handleRetrieveBooking}
              disabled={loadingRetrieve || isBusy}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {loadingRetrieve ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loadingRetrieve ? "Retrieving..." : "Retrieve Booking"}
            </button>
          </div>
        </SectionCard>

        {/* Booking details */}
        {booking && (
          <SectionCard title="Booking Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <DetailCard label="Booking Code" value={bookingCodeDisplay} />
              <DetailCard label="PNR" value={pnrDisplay} />
              <DetailCard
                label="Passenger Name"
                value={getPassengerName(booking)}
              />
              <DetailCard
                label="Origin"
                value={
                  booking.segs?.[0]?.orgcty ?? booking.org ?? "-"
                }
              />
              <DetailCard
                label="Destination"
                value={
                  booking.segs?.[0]?.dstcty ?? booking.dst ?? "-"
                }
              />
              <DetailCard
                label="Flight Number"
                value={getFlightNumber(booking)}
              />
              <DetailCard
                label="Travel Date"
                value={booking.segs?.[0]?.depdt ?? "-"}
              />
              {booking.status !== undefined && (
                <DetailCard label="Booking Status" value={booking.status} />
              )}
            </div>
          </SectionCard>
        )}

        {/* Initiate amendment */}
        {booking && !initiateData && (
          <SectionCard
            title="Amendment"
            subtitle="Initiate an amendment request for this booking"
          >
            <button
              type="button"
              onClick={handleInitiateAmendment}
              disabled={loadingInitiate || isBusy}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {loadingInitiate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {loadingInitiate
                ? "Initiating..."
                : "Initiate Amendment"}
            </button>
          </SectionCard>
        )}

        {/* Create amendment */}
        {initiateData && (
          <SectionCard
            title="Create Amendment"
            subtitle="Select an amendment type supported by the backend"
          >
            {initiateData.data?.amtyps &&
            initiateData.data.amtyps.length > 0 ? (
              <div className="space-y-2">
                {initiateData.data.amtyps.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedType === type
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 bg-slate-800/50 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="amendmentType"
                      value={type}
                      checked={selectedType === type}
                      onChange={() => setSelectedType(type)}
                      className="accent-blue-500"
                    />
                    <span className="text-white font-medium">{type}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-300">
                No amendment types were returned by the backend for this
                booking.
              </p>
            )}

            <button
              type="button"
              onClick={handleCreateAmendment}
              disabled={
                creating ||
                isBusy ||
                !selectedType ||
                !initiateData.data?.amtyps?.length
              }
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {creating ? "Creating..." : "Create Amendment"}
            </button>
          </SectionCard>
        )}

        {/* Amendment status & actions */}
        {(amendmentId || record) && (
          <SectionCard title="Amendment Status">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailCard
                    label="Amendment ID"
                    value={amendmentId || record?.code || "-"}
                  />
                  <DetailCard
                    label="Amendment Type"
                    value={
                      selectedType ||
                      (typeof record?.amtyp === "string"
                        ? record.amtyp
                        : "-")
                    }
                  />
                  <DetailCard
                    label="Status"
                    value={
                      typeof record?.status === "string"
                        ? record.status
                        : "-"
                    }
                  />
                  {record?.amount !== undefined && (
                    <DetailCard
                      label="Quotation Amount"
                      value={`₹${record.amount}`}
                    />
                  )}
                  {record?.message !== undefined && (
                    <DetailCard
                      label="Message"
                      value={String(record.message)}
                    />
                  )}
                  {record?.requestId !== undefined && (
                    <DetailCard
                      label="Request ID"
                      value={String(record.requestId)}
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleRefreshRecord()}
                    disabled={refreshing || isBusy}
                    className="inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {refreshing ? "Refreshing..." : "Refresh Status"}
                  </button>

                  <button
                    type="button"
                    onClick={handleAcceptAmendment}
                    disabled={accepting || isBusy || !amendmentId}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-semibold transition-colors"
                  >
                    {accepting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {accepting ? "Accepting..." : "Accept Amendment"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelAmendment}
                    disabled={cancelling || isBusy || !amendmentId}
                    className="inline-flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-semibold transition-colors"
                  >
                    {cancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {cancelling ? "Cancelling..." : "Cancel Amendment"}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wide">
                  Lifecycle
                </h3>
                <AmendmentTimeline
                  currentStage={lifecycleStage}
                  recordStatus={
                    typeof record?.status === "string"
                      ? record.status
                      : undefined
                  }
                />
              </div>
            </div>
          </SectionCard>
        )}

        <ApiDetailsPanel logs={apiLogs} />
      </div>
    </div>
  );
}

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
