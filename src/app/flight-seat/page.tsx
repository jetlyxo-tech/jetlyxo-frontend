"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { seatMap } from "@/lib/api";
import { toast } from "sonner";

function FlightSeatPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  /* =========================================================
     BASIC FLIGHT DETAILS
  ========================================================= */

const did = params.get("did") || "";

const tripType =
  params.get("tripType") || "";

const returnFlightId =
  params.get("returnFlightId") || "";

const isgParam =
  params.get("isg");

const isRoundTrip =
  tripType === "ROUND_TRIP" ||
  returnFlightId !== "" ||
  isgParam === "true";

const isg = isRoundTrip;

const flightId =
  params.get("flightId") || "";
  const searchId = params.get("searchId") || "";
  const tId = params.get("tId") || "";

  const airline = params.get("airline") || "";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "";

  /* =========================================================
     PASSENGER DETAILS
  ========================================================= */

  const firstName = params.get("firstName") || "";
  const lastName = params.get("lastName") || "";

  const passengerName = `${firstName} ${lastName}`.trim();

  const age = params.get("age") || "";
  const phone = params.get("phone") || "";
  const phoneCountryCode =
    params.get("phoneCountryCode") || "+91";

  const email = params.get("email") || "";
  const title = params.get("title") || "";
  const dob = params.get("dob") || "";

  /* =========================================================
     PASSENGER DOCUMENT DETAILS
  ========================================================= */

  const residence = params.get("residence") || "IN";

  const pan = params.get("pan") || "";

  const passportNumber =
    params.get("passportNumber") || "";

  const passportExpiry =
    params.get("passportExpiry") || "";

  const passportCountry =
    params.get("passportCountry") || "";

  /* =========================================================
     STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);

  const [seatResponse, setSeatResponse] =
    useState<any>(null);

  const [selectedOutboundSeat, setSelectedOutboundSeat] =
    useState<any>(null);

  const [selectedReturnSeat, setSelectedReturnSeat] =
    useState<any>(null);

  /* =========================================================
     LOAD SEAT MAP
  ========================================================= */

  useEffect(() => {
    async function loadSeatMap() {
      try {
        setLoading(true);
const response: any = await seatMap({
  dId: did,

  pax: [
    {
      pid: 1,
      title,
      fn: firstName,
      ln: lastName,
    },
  ],
});

        console.log(
          "========== BONTON SEAT MAP =========="
        );

        console.log(
          "Round Trip:",
          isg
        );

        console.log(
          "Seat Map Response:",
          response
        );

        console.log(
          "Outbound Seat Map:",
          response?.data?.dtl?.[0]
        );

        if (isg) {
          console.log(
            "Return Seat Map:",
            response?.data?.dtl?.[1]
          );
        }

        console.log(
          "====================================="
        );

        setSeatResponse(response);
      } catch (err) {
        console.error(
          "Seat Map Error:",
          err
        );

        toast.error(
          "Unable to load seat map."
        );
      } finally {
        setLoading(false);
      }
    }

    if (!did) {
      toast.error(
        "Booking Detail ID (dId) not found."
      );

      router.push("/");
      return;
    }

    loadSeatMap();
  }, [
    did,
    isg,
    title,
    firstName,
    lastName,
    router,
  ]);

  /* =========================================================
     SEAT DATA
  ========================================================= */
 
const outboundSeatRows =
  seatResponse?.data?.dtl?.[0]
    ?.smseat || [];

const returnSeatRows =
  isg
    ? seatResponse?.data?.dtl?.[1]
        ?.smseat || []
    : [];

  const outboundVisibleRows =
    outboundSeatRows.filter(
      (row: any[]) =>
        row.some(
          (seat) => !seat.isempty
        )
    );

  const returnVisibleRows =
    returnSeatRows.filter(
      (row: any[]) =>
        row.some(
          (seat) => !seat.isempty
        )
    );

  /* =========================================================
     SEAT AVAILABILITY
  ========================================================= */

  const outboundHasSeats =
    outboundVisibleRows.length > 0;

  const returnHasSeats =
    returnVisibleRows.length > 0;

  /* =========================================================
     CONTINUE VALIDATION
  ========================================================= */

 const canContinue =
  !!selectedOutboundSeat &&
  (
    !isg ||
    !returnHasSeats ||
    !!selectedReturnSeat
  );

  /* =========================================================
     DEBUG SELECTED SEATS
  ========================================================= */

  useEffect(() => {
    console.log(
      "========== SELECTED SEATS =========="
    );

    console.log(
      "Trip Type:",
      isg ? "ROUND_TRIP" : "ONEWAY"
    );

    console.log(
      "Outbound Seat:",
      selectedOutboundSeat
    );

    console.log(
      "Return Seat:",
      selectedReturnSeat
    );

    console.log(
      "===================================="
    );
  }, [
    isg,
    selectedOutboundSeat,
    selectedReturnSeat,
  ]);

  /* =========================================================
     NO OUTBOUND SEATS
  ========================================================= */

  if (
    !loading &&
    !outboundHasSeats
  ) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-gray-300">
        No seats available for this flight.
      </div>
    );
  }

  /* =========================================================
     SEAT MAP RENDERER
  ========================================================= */

  const renderSeatMap = (
    rows: any[],
    selectedSeat: any,
    onSelect: (seat: any) => void
  ) => {
    const visibleRows =
      rows.filter(
        (row: any[]) =>
          row.some(
            (seat) => !seat.isempty
          )
      );

    return (
      <div className="max-w-4xl mx-auto overflow-x-auto">
        <div className="min-w-[600px]">

          {/* COLUMN HEADERS */}

          <div className="grid grid-cols-8 gap-2 mb-3 text-center font-bold">

            <div />

            <div>A</div>
            <div>B</div>
            <div>C</div>

            <div />

            <div>D</div>
            <div>E</div>
            <div>F</div>

          </div>

          {/* SEAT ROWS */}

          {visibleRows.map(
            (
              row: any[],
              rowIndex: number
            ) => (

              <div
                key={rowIndex}
                className="grid grid-cols-8 gap-2 mb-2 items-center"
              >

                {/* ROW NUMBER */}

                <div className="text-gray-400 font-bold text-center">

                  {row
                    .find(
                      (seat) =>
                        !seat.isempty
                    )
                    ?.sno?.replace(
                      /[A-Z]/g,
                      ""
                    )}

                </div>

                {/* SEATS */}

                {row.map(
                  (
                    seat: any,
                    index: number
                  ) => {

                    if (seat.isempty) {
                      return (
                        <div
                          key={index}
                          className="w-14 h-14"
                        />
                      );
                    }

                    const isSelected =
                      selectedSeat?.code ===
                      seat.code;

                    const isOccupied =
                      seat.avlt === 2;

                    return (
                      <button
                        key={seat.code}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => {

                          if (
                            seat.isempty ||
                            isOccupied
                          ) {
                            return;
                          }

                          onSelect(seat);
                        }}
                        className={`
                          h-16
                          rounded-lg
                          border
                          text-sm
                          font-semibold
                          transition-all
                          duration-150
                          hover:scale-105
                          hover:shadow-lg
                          active:scale-95

                          ${
                            isSelected
                              ? "bg-blue-600 border-blue-300"
                              : isOccupied
                              ? "bg-red-600 cursor-not-allowed"
                              : seat.isfree
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-yellow-500 hover:bg-yellow-400 text-black"
                          }
                        `}
                      >

                        <div>
                          {seat.sno}
                        </div>

                        <div className="text-xs">
                          ₹{seat.prc}
                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            )
          )}

        </div>
      </div>
    );
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">

      <div className="max-w-5xl mx-auto">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <h1 className="text-3xl font-bold mb-8">
          Seat Selection
        </h1>

        {/* =====================================================
            FLIGHT / PASSENGER SUMMARY
        ===================================================== */}

        <div className="bg-slate-800 rounded-xl p-6 mb-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

            <div>
              <p className="text-gray-400">
                Airline
              </p>

              <p className="font-semibold">
                {airline}
              </p>
            </div>

            <div>
              <p className="text-gray-400">
                Passenger
              </p>

              <p className="font-semibold">
                {passengerName}
              </p>
            </div>

            <div>
              <p className="text-gray-400">
                Duration
              </p>

              <p className="font-semibold">
                {duration}
              </p>
            </div>

            <div>
              <p className="text-gray-400">
                Ticket Fare
              </p>

              <p className="font-semibold">
                ₹{price}
              </p>
            </div>

            <div>
              <p className="text-gray-400">
                Trip Type
              </p>

              <p className="font-semibold">
                {isg
                  ? "Round Trip"
                  : "One Way"}
              </p>
            </div>

          </div>

        </div>

        {/* =====================================================
            LEGEND
        ===================================================== */}

        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-600 rounded" />
            Free
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-500 rounded" />
            Paid
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-600 rounded" />
            Occupied
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded" />
            Selected
          </div>

        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (

          <div className="flex justify-center items-center py-20">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" />

          </div>

        ) : (

          <>

            {/* =================================================
                OUTBOUND
            ================================================= */}

            <section className="bg-slate-800 rounded-xl p-6 mb-10">

              <h2 className="text-2xl font-bold mb-2">
                Outbound Flight
              </h2>

              <p className="text-gray-400 mb-6">
                Select your seat for the
                outbound journey.
              </p>

              {/* COCKPIT */}

              <div className="flex justify-center mb-6">

                <div className="bg-slate-700 px-8 py-2 rounded-full font-semibold">
                  Cockpit
                </div>

              </div>

              {/* OUTBOUND MAP */}

              {renderSeatMap(
                outboundSeatRows,
                selectedOutboundSeat,
                setSelectedOutboundSeat
              )}

              {/* OUTBOUND SELECTED */}

              {selectedOutboundSeat && (

                <div className="mt-8 bg-slate-900 rounded-xl p-5">

                  <h3 className="text-lg font-bold mb-3">
                    Outbound Seat
                  </h3>

                  <p>
                    Seat Number:
                    <span className="font-bold ml-2">
                      {selectedOutboundSeat.sno}
                    </span>
                  </p>

                  <p>
                    Seat Fare:
                    <span className="font-bold ml-2">
                      ₹{selectedOutboundSeat.prc}
                    </span>
                  </p>

                </div>

              )}

            </section>

            {/* =================================================
                RETURN — ONLY ROUND TRIP
            ================================================= */}

            {isg && (

              <section className="bg-slate-800 rounded-xl p-6 mb-10">

                <h2 className="text-2xl font-bold mb-2">
                  Return Flight
                </h2>

                <p className="text-gray-400 mb-6">
                  Select your seat for the
                  return journey.
                </p>

                {!returnHasSeats ? (

                  <div className="text-center text-gray-400 py-10">
                    No seats available for the return flight.
                  </div>

                ) : (

                  <>

                    {/* COCKPIT */}

                    <div className="flex justify-center mb-6">

                      <div className="bg-slate-700 px-8 py-2 rounded-full font-semibold">
                        Cockpit
                      </div>

                    </div>

                    {/* RETURN MAP */}

                    {renderSeatMap(
                      returnSeatRows,
                      selectedReturnSeat,
                      setSelectedReturnSeat
                    )}

                    {/* RETURN SELECTED */}

                    {selectedReturnSeat && (

                      <div className="mt-8 bg-slate-900 rounded-xl p-5">

                        <h3 className="text-lg font-bold mb-3">
                          Return Seat
                        </h3>

                        <p>
                          Seat Number:
                          <span className="font-bold ml-2">
                            {selectedReturnSeat.sno}
                          </span>
                        </p>

                        <p>
                          Seat Fare:
                          <span className="font-bold ml-2">
                            ₹{selectedReturnSeat.prc}
                          </span>
                        </p>

                      </div>

                    )}

                  </>

                )}

              </section>

            )}

            {/* =================================================
                TOTAL
            ================================================= */}

            <div className="bg-slate-800 rounded-xl p-6 mb-8">

              <h2 className="text-xl font-bold mb-4">
                Seat Summary
              </h2>

              <div className="space-y-3">

                {selectedOutboundSeat && (

                  <div className="flex justify-between">

                    <span>
                      Outbound Seat (
                      {selectedOutboundSeat.sno}
                      )
                    </span>

                    <span>
                      ₹{selectedOutboundSeat.prc}
                    </span>

                  </div>

                )}

                {isg && selectedReturnSeat && (

                  <div className="flex justify-between">

                    <span>
                      Return Seat (
                      {selectedReturnSeat.sno}
                      )
                    </span>

                    <span>
                      ₹{selectedReturnSeat.prc}
                    </span>

                  </div>

                )}

                <hr className="border-slate-600" />

                <div className="flex justify-between">

                  <span>
                    Base Fare
                  </span>

                  <span>
                    ₹{price}
                  </span>

                </div>

                <div className="flex justify-between text-lg font-bold text-green-400">

                  <span>
                    Total Fare
                  </span>

                  <span>
                    ₹
                    {Number(price || 0) +
                      Number(
                        selectedOutboundSeat?.prc ||
                          0
                      ) +
                      (isg
                        ? Number(
                            selectedReturnSeat?.prc ||
                              0
                          )
                        : 0)}
                  </span>

                </div>

              </div>

            </div>

          </>

        )}

        {/* =====================================================
            CONTINUE
        ===================================================== */}

        <div className="flex justify-center mt-10 mb-10">

          <button
            type="button"
            disabled={
              loading ||
              !canContinue
            }
            className={`
              px-10
              py-4
              shadow-lg
              rounded-lg
              font-semibold
              transition

              ${
                canContinue && !loading
                  ? "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/40"
                  : "bg-gray-600 cursor-not-allowed opacity-50"
              }
            `}
            onClick={() => {

              if (!canContinue) {
                return;
              }

              console.log(
                "========== CONTINUE TO MEALS =========="
              );

              console.log(
                "Trip Type:",
                isg
                  ? "ROUND_TRIP"
                  : "ONEWAY"
              );

              console.log(
                "Outbound Seat:",
                selectedOutboundSeat
              );

              console.log(
                "Return Seat:",
                selectedReturnSeat
              );

              console.log(
                "======================================="
              );

              const query =
                new URLSearchParams({

                  /* Flight */

                  did,

                  isg:
                    String(isg),

                  tripType:
                    isg
                     ? "ROUND_TRIP"
                     : "ONEWAY",

                  flightId,

                  searchId,

                  tId,

                  price,

                  airline,

                  duration,

                  /* Passenger */

                  firstName,

                  lastName,

                  age,

                  phone,

                  phoneCountryCode,

                  email,

                  title,

                  dob,

                  /* Passenger documents */

                  residence,

                  pan:
                    residence === "IN"
                      ? pan
                      : "",

                  passportNumber:
                    residence !== "IN"
                      ? passportNumber
                      : "",

                  passportExpiry:
                    residence !== "IN"
                      ? passportExpiry
                      : "",

                  passportCountry:
                    residence !== "IN"
                      ? passportCountry
                      : "",

                  /* =========================
                     OUTBOUND SEAT
                  ========================= */

                  seatCode:
                    selectedOutboundSeat.code,

                  seatNumber:
                    selectedOutboundSeat.sno,

                  seatPrice:
                    String(
                      selectedOutboundSeat.prc
                    ),

                  /* =========================
                     RETURN SEAT
                     Empty for One-Way
                  ========================= */

                  returnSeatCode:
                     isg && selectedReturnSeat
                      ? selectedReturnSeat.code
                      : "",

                  returnSeatNumber:
                    isg && selectedReturnSeat
                     ? selectedReturnSeat.sno
                     : "",

                  returnSeatPrice:
                    isg && selectedReturnSeat
                     ? String(selectedReturnSeat.prc)
                     : "",
                });

              router.push(
                `/flight-meal?${query.toString()}`
              );
            }}
          >
            Continue to Meals
          </button>

        </div>

      </div>

    </div>
  );
}

export default function FlightSeatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <FlightSeatPageContent />
    </Suspense>
  );
}