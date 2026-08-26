"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  getBookingById,
  downloadBookingTicket,
} from "@/lib/api";

import type { Booking } from "@/types";

import {
  Bus,
  Plane,
  Train,
  Download,
  Ticket,
  CheckCircle2,
  ArrowRight,
  Home,
  CalendarDays,
  Clock3,
  User,
  CreditCard,
  Armchair,
  Utensils,
  BriefcaseBusiness,
} from "lucide-react";


/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: unknown): string {
  if (!value) return "—";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(value: unknown): string {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "₹0.00";
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}


/* =========================================================
   SMALL DETAIL CARD
========================================================= */

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="mt-2 break-words text-base font-bold text-slate-900">
        {value || "—"}
      </div>
    </div>
  );
}


/* =========================================================
   MAIN CONTENT
========================================================= */

function TicketPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const bookingId = params.get("bookingId");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  /* =======================================================
     LOAD BOOKING
  ======================================================= */

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        console.log("========== LOADING TICKET ==========");
        console.log("Booking ID:", bookingId);

        const result = await getBookingById(
          Number(bookingId)
        );

        console.log("========== BOOKING ==========");
        console.log(
          JSON.stringify(result, null, 2)
        );

        setBooking(result);
      } catch (error) {
        console.error(
          "Failed to load booking:",
          error
        );

        router.push("/my-bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, router]);



const ticketData = useMemo(() => {
  if (!booking) {
    return null;
  }

  /*
   * =========================================================
   * NORMALIZE FLIGHT DATA
   *
   * Bonton can return:
   *
   * 1. flightData: {...}
   *
   * OR
   *
   * 2. flightData: [{...}, {...}]
   *
   * For round trips, we MUST preserve every flightData object.
   * Each object can contain multiple segments because of
   * layovers.
   * =========================================================
   */

  const flightJourneys = Array.isArray(booking.flightData)
    ? booking.flightData.filter(Boolean)
    : booking.flightData
      ? [booking.flightData]
      : [];

  /*
   * Build a normalized journey for every flightData object.
   */

  const journeys = flightJourneys
    .map((flightData: any, journeyIndex: number) => {
      const segments = Array.isArray(flightData?.segs)
        ? flightData.segs.filter(Boolean)
        : [];

      /*
       * If Bonton does not provide segs, create a fallback
       * segment from the flightData itself.
       */

      const normalizedSegments =
        segments.length > 0
          ? segments
          : [
              {
                orgcty:
                  flightData?.orgcty ||
                  booking.flight?.from ||
                  "—",

                dstcty:
                  flightData?.dstcty ||
                  booking.flight?.to ||
                  "—",

                orgapc:
                  flightData?.orgapc ||
                  "—",

                dstapc:
                  flightData?.dstapc ||
                  "—",

                airnm:
                  flightData?.airnm ||
                  "—",

                aircd:
                  flightData?.aircd,

                fltno:
                  flightData?.fltno,

                dptm:
                  flightData?.dptm,

                artm:
                  flightData?.artm,

                cbcls:
                  flightData?.cbcls,
              },
            ];

      const firstSegment =
        normalizedSegments[0] ?? null;

      const lastSegment =
        normalizedSegments[
          normalizedSegments.length - 1
        ] ?? null;

      const fromCity =
        firstSegment?.orgcty ||
        flightData?.orgcty ||
        booking.flight?.from ||
        "—";

      const toCity =
        lastSegment?.dstcty ||
        flightData?.dstcty ||
        booking.flight?.to ||
        "—";

      const fromCode =
        firstSegment?.orgapc ||
        flightData?.orgapc ||
        "—";

      const toCode =
        lastSegment?.dstapc ||
        flightData?.dstapc ||
        "—";

      const airline =
        firstSegment?.airnm ||
        flightData?.airnm ||
        "—";

      const flightNumber =
        firstSegment?.aircd &&
        firstSegment?.fltno
          ? `${firstSegment.aircd}-${firstSegment.fltno}`
          : firstSegment?.fltno ||
            flightData?.fltno ||
            "—";

      const departure =
        firstSegment?.dptm ||
        flightData?.dptm ||
        null;

      const arrival =
        lastSegment?.artm ||
        flightData?.artm ||
        null;

      const cabin =
        firstSegment?.cbcls ||
        flightData?.cbcls ||
        "Economy";

      return {
        journeyIndex,
        flightData,

        segments: normalizedSegments,

        firstSegment,
        lastSegment,

        fromCity,
        toCity,

        fromCode,
        toCode,

        airline,
        flightNumber,

        departure,
        arrival,

        cabin,
      };
    })
    .filter(Boolean);

  /*
   * =========================================================
   * PRIMARY FLIGHT
   *
   * Used for passenger / PNR / common booking information.
   * =========================================================
   */

  const primaryJourney =
    journeys[0] ?? null;

  const primaryFlightData =
    primaryJourney?.flightData ?? null;

  /*
   * SEAT
   */

  const seat =
    primaryFlightData?.mbg?.find(
      (item: any) =>
        item?.ssr_type === "SeatDynamic"
    )?.ssr_info ||
    "Not Selected";

  /*
   * MEAL
   */

  const meal =
    primaryFlightData?.mbg?.find(
      (item: any) =>
        item?.ssr_type === "Meal"
    )?.ssr_info ||
    "No Meal";

  /*
   * PASSENGER
   */

  const passenger =
    booking.passengerName ||
    primaryFlightData?.trv?.[0]?.name ||
    "Guest";

  /*
   * PASSENGER TYPE
   */

  const passengerType =
    primaryFlightData?.trv?.[0]?.pxt ||
    "Adult";

  /*
   * BAGGAGE
   */

  const baggage =
    primaryFlightData?.trv?.[0]?.chbg ||
    primaryFlightData?.trv?.[0]?.cbbg ||
    "As per airline policy";

  /*
   * PNR
   */

  const pnr =
    booking.pnr ||
    primaryFlightData?.pnr ||
    primaryFlightData?.gdsPnr ||
    "—";

  return {
    journeys,

    /*
     * Keep these fields for the rest of the existing page.
     */

    flightData: primaryFlightData,

    segments:
      primaryJourney?.segments ?? [],

    firstSegment:
      primaryJourney?.firstSegment ?? null,

    lastSegment:
      primaryJourney?.lastSegment ?? null,

    fromCity:
      primaryJourney?.fromCity ?? "—",

    toCity:
      primaryJourney?.toCity ?? "—",

    fromCode:
      primaryJourney?.fromCode ?? "—",

    toCode:
      primaryJourney?.toCode ?? "—",

    airline:
      primaryJourney?.airline ?? "—",

    flightNumber:
      primaryJourney?.flightNumber ?? "—",

    departure:
      primaryJourney?.departure ?? null,

    arrival:
      primaryJourney?.arrival ?? null,

    seat,
    meal,

    cabin:
      primaryJourney?.cabin ?? "Economy",

    passenger,
    passengerType,
    baggage,

    pnr,
  };
}, [booking]);

  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const downloadTicket = async () => {
    if (!booking || downloading) {
      return;
    }

    try {
      setDownloading(true);

      console.log(
        "========== DOWNLOADING TICKET =========="
      );

      console.log(
        "Booking ID:",
        booking.id
      );

      const blob =
        await downloadBookingTicket(
          booking.id
        );

      if (!blob) {
        throw new Error(
          "Empty ticket response"
        );
      }

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `JetlyXO_Ticket_${
          booking.pnr ||
          booking.id
        }.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      console.log(
        "✅ Ticket downloaded successfully"
      );

    } catch (error) {
      console.error(
        "❌ Ticket download failed:",
        error
      );

      alert(
        "Unable to download ticket. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };


  /* =======================================================
     ICON
  ======================================================= */

  const getTypeIcon = () => {
    if (!booking) {
      return <Ticket size={22} />;
    }

    switch (booking.bookingType) {
      case "BUS":
        return <Bus size={22} />;

      case "TRAIN":
        return <Train size={22} />;

      case "FLIGHT":
        return <Plane size={22} />;

      default:
        return <Ticket size={22} />;
    }
  };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />

          <p className="text-lg">
            Loading your ticket...
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     INVALID BOOKING
  ======================================================= */

  if (
    !booking ||
    booking.status !== "CONFIRMED"
  ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-5 px-4">

        <div className="rounded-full bg-red-500/10 p-5">
          <Ticket
            size={42}
            className="text-red-400"
          />
        </div>

        <h1 className="text-2xl font-bold">
          Booking not confirmed
        </h1>

        <p className="text-center text-slate-400">
          We could not find a confirmed booking
          for this ticket.
        </p>

        <button
          onClick={() =>
            router.push("/my-bookings")
          }
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
        >
          My Bookings
        </button>

      </div>
    );
  }


  if (!ticketData) {
    return null;
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:py-12">

      <div className="mx-auto w-full max-w-4xl">

        {/* =================================================
            TOP NAV
        ================================================= */}

        <div className="mb-6 flex items-center justify-between">

          <button
            onClick={() =>
              router.push("/my-bookings")
            }
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            ← My Bookings
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="text-xl">
              ✈️
            </span>

            JetlyXO
          </div>

        </div>


        {/* =================================================
            TICKET CARD
        ================================================= */}

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">


          {/* ===============================================
              HEADER
          =============================================== */}

          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white md:p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

              <div>

                <div className="flex items-center gap-2 text-sm text-blue-100">

                  {getTypeIcon()}

                  <span>
                    JetlyXO E-Ticket
                  </span>

                </div>

                <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                  Booking Confirmed
                </h1>

                <div className="mt-3 flex items-center gap-2 text-sm text-blue-100">

                  <CheckCircle2 size={18} />

                  Your journey is confirmed

                </div>

              </div>


              {/* PNR */}

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm md:min-w-[180px]">

                <p className="text-xs uppercase tracking-wider text-blue-100">
                  PNR
                </p>

                <p className="mt-1 text-2xl font-bold tracking-wide">
                  {ticketData.pnr}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-400/20 px-2 py-1 text-xs font-semibold text-green-100">

                  <CheckCircle2 size={13} />

                  CONFIRMED

                </div>

              </div>

            </div>

          </div>

<div className="p-6 md:p-8">

<div className="space-y-8">

  {ticketData.journeys.length > 0 ? (
    ticketData.journeys.map(
      (journey: any, journeyIndex: number) => (
        <div key={journeyIndex}>

          {/* =================================================
              JOURNEY HEADER
          ================================================= */}

          <div className="mb-4 flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {ticketData.journeys.length > 1
                  ? journeyIndex === 0
                    ? "Outbound Journey"
                    : "Return Journey"
                  : "Your Journey"}
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {journey.airline}
              </p>
            </div>

            <div className="text-right">

              <p className="text-xs text-slate-500">
                Flight
              </p>

              <p className="font-bold text-slate-900">
                {journey.flightNumber}
              </p>

            </div>

          </div>


          {/* =================================================
              COMPLETE JOURNEY
          ================================================= */}

          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 md:p-7">

            <div className="space-y-4">

              {journey.segments.map(
                (segment: any, segmentIndex: number) => {

                  const segmentFromCode =
                    segment?.orgapc || "—";

                  const segmentToCode =
                    segment?.dstapc || "—";

                  const segmentFromCity =
                    segment?.orgcty || "—";

                  const segmentToCity =
                    segment?.dstcty || "—";

                  const segmentDeparture =
                    segment?.dptm || null;

                  const segmentArrival =
                    segment?.artm || null;

                  const segmentAirline =
                    segment?.airnm ||
                    journey.airline ||
                    "—";

                  const segmentFlightNumber =
                    segment?.aircd &&
                    segment?.fltno
                      ? `${segment.aircd}-${segment.fltno}`
                      : segment?.fltno ||
                        "—";

                  return (
                    <div key={segmentIndex}>

                      {/* =================================================
                          FLIGHT SEGMENT
                      ================================================= */}

                      <div className="rounded-2xl border border-slate-200 bg-white p-5">

                        <div className="mb-4 flex items-center justify-between">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">

                              {journey.segments.length > 1
                                ? segmentIndex === 0
                                  ? "First Flight"
                                  : `Connecting Flight ${segmentIndex + 1}`
                                : journeyIndex === 1
                                  ? "Return Flight"
                                  : "Flight"}

                            </p>

                            <p className="mt-1 font-bold text-slate-900">

                              {segmentAirline}{" "}

                              {segmentFlightNumber}

                            </p>

                          </div>

                          {segment?.cbcls && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {segment.cbcls}
                            </span>
                          )}

                        </div>


                        {/* =================================================
                            ROUTE
                        ================================================= */}

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                          {/* FROM */}

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Departure
                            </p>

                            <p className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
                              {segmentFromCode}
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-600">
                              {segmentFromCity}
                            </p>

                            <p className="mt-3 text-sm font-bold text-slate-900">
                              {formatDate(
                                segmentDeparture
                              )}
                            </p>

                            <p className="text-sm text-slate-500">
                              {formatTime(
                                segmentDeparture
                              )}
                            </p>

                          </div>


                          {/* CENTER */}

                          <div className="flex flex-col items-center">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Plane size={22} />
                            </div>

                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">

                              <span className="h-px w-8 bg-slate-300" />

                              <ArrowRight
                                size={15}
                                className="text-blue-500"
                              />

                              <span className="h-px w-8 bg-slate-300" />

                            </div>

                          </div>


                          {/* TO */}

                          <div className="text-right">

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Arrival
                            </p>

                            <p className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
                              {segmentToCode}
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-600">
                              {segmentToCity}
                            </p>

                            <p className="mt-3 text-sm font-bold text-slate-900">
                              {formatDate(
                                segmentArrival
                              )}
                            </p>

                            <p className="text-sm text-slate-500">
                              {formatTime(
                                segmentArrival
                              )}
                            </p>

                          </div>

                        </div>

                      </div>


                      {/* =================================================
                          LAYOVER
                      ================================================= */}

                      {segmentIndex <
                        journey.segments.length - 1 && (
                        <div className="flex items-center justify-center py-3">

                          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">

                            <span>
                              Layover at{" "}
                              {segmentToCity}{" "}
                              ({segmentToCode})
                            </span>

                          </div>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>


            {/* =================================================
                COMPLETE JOURNEY SUMMARY
            ================================================= */}

{journey.segments.length > 1 && (
  <div className="mt-5 rounded-2xl bg-blue-50 p-4">

    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
      Complete Route
    </p>

    <p className="mt-2 text-base font-bold text-blue-900">
      {[
        journey.segments[0]?.orgapc,
        ...journey.segments.map(
          (segment: any) => segment?.dstapc
        ),
      ]
        .filter(Boolean)
        .filter(
          (code: string, index: number, arr: string[]) =>
            index === 0 || code !== arr[index - 1]
        )
        .join(" → ")}
    </p>

  </div>
)}

          </div>

        </div>
      )
    )
  ) : (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">

      <p className="font-semibold text-slate-700">
        Flight details unavailable
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Please contact support if this booking does not display correctly.
      </p>

    </div>
  )}

</div>


                     {/* =============================================
                PASSENGER
            ============================================= */}

            <div className="mt-6">

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Passenger Information
              </p>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">

                      <User size={22} />

                    </div>

                    <div>

                      <p className="text-xs text-slate-500">
                        Passenger
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {ticketData.passenger}
                      </p>

                      <p className="text-sm text-slate-500">
                        {ticketData.passengerType}
                      </p>

                    </div>

                  </div>

                  <div className="text-left sm:text-right">

                    <p className="text-xs text-slate-500">
                      Booking ID
                    </p>

                    <p className="font-bold text-slate-900">
                      #{booking.id}
                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* =============================================
                FLIGHT DETAILS
            ============================================= */}

            <div className="mt-6">

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Flight Details
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <DetailCard
                  icon={<Plane size={16} />}
                  label="Flight"
                  value={`${ticketData.airline} ${ticketData.flightNumber}`}
                />

                <DetailCard
                  icon={<Armchair size={16} />}
                  label="Seat"
                  value={ticketData.seat}
                />

                <DetailCard
                  icon={<BriefcaseBusiness size={16} />}
                  label="Cabin"
                  value={ticketData.cabin}
                />

                <DetailCard
                  icon={<Utensils size={16} />}
                  label="Meal"
                  value={ticketData.meal}
                />

                <DetailCard
                  icon={<CalendarDays size={16} />}
                  label="Travel Date"
                  value={formatDate(
                    ticketData.departure
                  )}
                />

                <DetailCard
                  icon={<Clock3 size={16} />}
                  label="Departure"
                  value={formatTime(
                    ticketData.departure
                  )}
                />

              </div>

            </div>


            {/* =============================================
                FARE
            ============================================= */}

            <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">

                    <CreditCard size={19} />

                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Total Amount Paid
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {formatCurrency(
                        booking.totalPrice
                      )}
                    </p>

                  </div>

                </div>

                <div className="rounded-full bg-green-500/20 px-3 py-2 text-xs font-bold text-green-400">

                  ✓ PAID

                </div>

              </div>

            </div>


            {/* =============================================
                BAGGAGE NOTE
            ============================================= */}

            <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">

              <div className="flex gap-3">

                <BriefcaseBusiness
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>

                  <p className="font-semibold">
                    Baggage / Check-in
                  </p>

                  <p className="mt-1 text-blue-700">
                    {ticketData.baggage}
                  </p>

                </div>

              </div>

            </div>


            {/* =============================================
                DIVIDER
            ============================================= */}

            <div className="my-7 border-t-2 border-dashed border-slate-200" />


            {/* =============================================
                ACTIONS
            ============================================= */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button
                onClick={downloadTicket}
                disabled={downloading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {downloading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    Preparing Ticket...
                  </>
                ) : (
                  <>
                    <Download size={19} />

                    Download E-Ticket
                  </>
                )}

              </button>


              <button
                onClick={() =>
                  router.push(
                    "/my-bookings"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >

                <Ticket size={19} />

                My Bookings

              </button>

            </div>


            {/* HOME */}

            <button
              onClick={() =>
                router.push("/")
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >

              <Home size={17} />

              Back to Home

            </button>


            {/* FOOTER NOTE */}

            <div className="mt-6 text-center">

              <p className="text-xs text-slate-400">
                Please carry a valid government-issued
                photo ID during your journey.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                This is your electronic ticket.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          Loading ticket...
        </div>
      }
    >
      <TicketPageContent />
    </Suspense>
  );
}