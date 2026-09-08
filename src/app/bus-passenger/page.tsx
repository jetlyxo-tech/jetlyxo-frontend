"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  selectI2SpaceBus,
  createBooking,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

type I2SpaceSeat = {
  id?: string | number;
  status?: string;
  [key: string]: any;
};

function BusPassengerPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  /* -------- PARAMS -------- */

  const busId = params.get("busId");
  const operator = params.get("operator") || "Bus";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "0";

  /* -------- STATE -------- */

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [selectLoading, setSelectLoading] = useState(true);

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const [seats, setSeats] = useState<I2SpaceSeat[]>([]);
  const [tripKey, setTripKey] = useState<string | null>(null);

  const [providerContext, setProviderContext] = useState<any>(null);

  const [error, setError] = useState("");

  /* =========================================================
     I2SPACE SELECT
     ========================================================= */

  useEffect(() => {
    async function selectBus() {
      try {
        setSelectLoading(true);
        setError("");

        const stored = sessionStorage.getItem(
          "jetly_bus_selection"
        );

        if (!stored) {
          throw new Error(
            "Bus selection information is missing"
          );
        }

        const busSelection = JSON.parse(stored);

        const context =
          busSelection?.providerContext;

        if (!context) {
          throw new Error(
            "I2Space provider information is missing"
          );
        }

        if (
          !context.traceId ||
          !context.busId ||
          context.bpid === undefined ||
          context.dpid === undefined
        ) {
          throw new Error(
            "Incomplete I2Space bus information"
          );
        }

        setProviderContext(context);

        console.log(
          "I2SPACE SELECT REQUEST:",
          {
            traceId: context.traceId,
            busId: context.busId,
            bpid: context.bpid,
            dpid: context.dpid,
          }
        );

        const result = await selectI2SpaceBus({
          traceId: context.traceId,
          busId: String(context.busId),
          bpid: context.bpid,
          dpid: context.dpid,
          layout: "Horizontal",
        });

        console.log(
          "I2SPACE SELECT RESPONSE:",
          result
        );

        /*
         * I2Space returns tripKey from Select.
         */
        const returnedTripKey =
          result?.tripKey ??
          result?.trips?.[0]?.tripKey ??
          null;

        setTripKey(returnedTripKey);

        /*
         * Seat response can be nested depending on
         * provider response structure.
         *
         * We intentionally keep this defensive until
         * we inspect the exact live response.
         */
        const returnedSeats =
          result?.seats ??
          result?.trip?.seats ??
          result?.trips?.[0]?.seats ??
          [];

        if (Array.isArray(returnedSeats)) {
          setSeats(returnedSeats);
        } else {
          setSeats([]);
        }

        /*
         * Save the complete Select response temporarily.
         * This will help us build the exact seat UI
         * from the provider response.
         */
        sessionStorage.setItem(
          "jetly_i2space_select",
          JSON.stringify(result)
        );

        if (!returnedTripKey) {
          console.warn(
            "I2Space Select succeeded but tripKey was not found."
          );
        }

        console.log(
          "I2SPACE SEATS:",
          returnedSeats
        );
      } catch (err: any) {
        console.error(
          "I2SPACE SELECT ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to load bus seats"
        );
      } finally {
        setSelectLoading(false);
      }
    }

    selectBus();
  }, []);

  /* =========================================================
     SEAT SELECTION
     ========================================================= */

  function handleSeatClick(seat: I2SpaceSeat) {
    const seatId =
      seat?.id !== undefined
        ? String(seat.id)
        : null;

    if (!seatId) {
      return;
    }

    /*
     * I2Space uses status values such as AFA/BFA.
     * AFA = available for allocation.
     */
    if (seat.status && seat.status !== "AFA") {
      return;
    }

    setSelectedSeat(seatId);
  }

  /* =========================================================
     CONTINUE
     ========================================================= */

  async function handleContinue() {
    try {
      setLoading(true);

      /* LOGIN CHECK */

      const token = getToken();

      if (!token) {
        alert("Please login first");
        router.push("/login");
        return;
      }

      /* BUS CHECK */

      if (!busId) {
        alert("Bus info missing");
        return;
      }

      /* SEAT CHECK */

      if (!selectedSeat) {
        alert("Please select a seat");
        return;
      }

      /* PASSENGER CHECK */

      if (!name || !age || !phone || !email) {
        alert("Please fill all details");
        return;
      }

      /*
       * STAGE 1:
       *
       * We are NOT calling I2Space Block yet.
       *
       * We are also NOT changing the existing
       * createBooking/payment flow yet.
       *
       * First we verify that Select + seat selection
       * works correctly.
       */

      console.log(
        "BUS SELECTION READY:",
        {
          busId,
          operator,
          selectedSeat,
          tripKey,
          providerContext,
          passenger: {
            name,
            age: Number(age),
            phone,
            email,
          },
        }
      );

      /*
       * Keep existing Jetly booking flow temporarily.
       *
       * IMPORTANT:
       * This will be replaced with I2Space Block
       * after we verify the Select response.
       */

      const payload = {
        bookingType: "BUS",
        entityId: Number(busId),

        passengerName: name,
        passengerAge: Number(age),
        passengerPhone: phone,
        passengerEmail: email,
      };

      console.log(
        "CURRENT LOCAL BOOKING PAYLOAD:",
        payload
      );

      const res = await createBooking(payload);

      const bookingId = res.bookingId;

      if (!bookingId) {
        alert("Booking failed");
        return;
      }

      router.push(
        `/payment?bookingId=${bookingId}`
      );
    } catch (err: any) {
      console.error(
        "BUS BOOKING ERROR:",
        err
      );

      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Error processing bus booking"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">

        <div className="bg-slate-800 p-8 rounded-xl shadow-lg">

          <h1 className="text-2xl font-bold text-center mb-6">
            Bus Passenger Details
          </h1>

          {/* BUS INFO */}

          <div className="space-y-2 mb-8">
            <p>
              Operator:{" "}
              <span className="font-semibold">
                {operator}
              </span>
            </p>

            <p>
              Duration:{" "}
              <span className="font-semibold">
                {duration}
              </span>
            </p>

            <p>
              Price:{" "}
              <span className="font-semibold">
                ₹{price}
              </span>
            </p>
          </div>

          {/* SELECT LOADING */}

          {selectLoading && (
            <div className="mb-6 p-4 rounded-lg bg-slate-700 text-center">
              Loading available seats...
            </div>
          )}

          {/* SELECT ERROR */}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/50 text-red-200">
              {error}
            </div>
          )}

          {/* SEATS */}

          {!selectLoading &&
            !error &&
            seats.length > 0 && (
              <div className="mb-8">

                <h2 className="text-xl font-semibold mb-4">
                  Select Your Seat
                </h2>

                <div className="grid grid-cols-4 gap-3 max-w-md">

                  {seats.map((seat, index) => {
                    const seatId =
                      seat?.id !== undefined
                        ? String(seat.id)
                        : String(index + 1);

                    const available =
                      !seat.status ||
                      seat.status === "AFA";

                    const selected =
                      selectedSeat === seatId;

                    return (
                      <button
                        key={seatId}
                        type="button"
                        onClick={() =>
                          handleSeatClick(seat)
                        }
                        disabled={!available}
                        className={`
                          p-3 rounded-lg border
                          ${
                            selected
                              ? "bg-green-600 border-green-400"
                              : available
                              ? "bg-slate-700 border-slate-500 hover:bg-slate-600"
                              : "bg-red-900/40 border-red-800 opacity-50 cursor-not-allowed"
                          }
                        `}
                      >
                        <div className="font-semibold">
                          Seat {seatId}
                        </div>

                        <div className="text-xs mt-1">
                          {available
                            ? "Available"
                            : seat.status || "Unavailable"}
                        </div>
                      </button>
                    );
                  })}

                </div>

                {selectedSeat && (
                  <p className="mt-4 text-green-400">
                    Selected Seat:{" "}
                    <span className="font-semibold">
                      {selectedSeat}
                    </span>
                  </p>
                )}
              </div>
            )}

          {/* PASSENGER */}

          <div className="space-y-4">

            <input
              placeholder="Full Name"
              className="w-full p-3 rounded bg-slate-700"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Age"
              className="w-full p-3 rounded bg-slate-700"
              value={age}
              onChange={(e) =>
                setAge(e.target.value)
              }
            />

            <input
              placeholder="Phone Number"
              className="w-full p-3 rounded bg-slate-700"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded bg-slate-700"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <button
              onClick={handleContinue}
              disabled={
                loading ||
                selectLoading ||
                !tripKey ||
                !selectedSeat
              }
              className="w-full bg-green-600 py-3 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : "Continue"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusPassengerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <BusPassengerPageContent />
    </Suspense>
  );
}