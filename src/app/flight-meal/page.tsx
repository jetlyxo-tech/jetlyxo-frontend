"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { meal } from "@/lib/api";

function FlightMealPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const did = params.get("did") || "";

  const flightId = params.get("flightId") || "";
  const searchId = params.get("searchId") || "";
  const tId = params.get("tId") || "";

  const airline = params.get("airline") || "";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "";

  const firstName = params.get("firstName") || "";
  const lastName = params.get("lastName") || "";

  const passengerName =
    `${firstName} ${lastName}`.trim();

  const age = params.get("age") || "";
  const phone = params.get("phone") || "";
  const email = params.get("email") || "";
  const title = params.get("title") || "";
  const dob = params.get("dob") || "";

  /* =========================
     PASSENGER DOCUMENT DETAILS
  ========================= */

  const residence =
    params.get("residence") || "IN";

  const pan =
    params.get("pan") || "";

  const phoneCountryCode =
    params.get("phoneCountryCode") || "+91";

  const passportNumber =
    params.get("passportNumber") || "";

  const passportExpiry =
    params.get("passportExpiry") || "";

  const passportCountry =
    params.get("passportCountry") || "";

  /* =========================
     SEAT DETAILS
  ========================= */

  const seatCode =
    params.get("seatCode") || "";

  const seatNumber =
    params.get("seatNumber") || "";

  const seatPrice =
    params.get("seatPrice") || "0";

  /* =========================
     STATE
  ========================= */

  const [loading, setLoading] =
    useState(true);

  const [mealResponse, setMealResponse] =
    useState<any>(null);

  const [selectedMeal, setSelectedMeal] =
    useState<any>(null);

  const [selectedBaggage, setSelectedBaggage] =
    useState<any>(null);

  /* =========================
     LOAD SSR
  ========================= */

  useEffect(() => {
    async function loadMeals() {
      try {
        setLoading(true);

        const response = await meal({
          dId: did,
        });

        console.log(
          "========== BONTON SSR RESPONSE =========="
        );

        console.log(response);

        setMealResponse(response);
      } catch (err) {
        console.error(
          "SSR API Error:",
          err
        );

        toast.error(
          "Unable to load meal/baggage options."
        );
      } finally {
        setLoading(false);
      }
    }

    if (did) {
      loadMeals();
    } else {
      setLoading(false);
    }
  }, [did]);

  /* =========================
     BONTON DATA
     
     IMPORTANT:
     Bonton response is:
     
     response
       └── data
           └── dtl
  ========================= */

  const detailSections =
    mealResponse?.data?.dtl ?? [];

  console.log(
    "Bonton SSR detail sections:",
    detailSections
  );

  /* =========================
     MEAL SECTION
  ========================= */

  const mealSection =
    detailSections.find(
      (item: any) =>
        String(item.typ).toLowerCase() ===
        "meal"
    );

  const meals =
    mealSection?.mel ?? [];

  /* =========================
     BAGGAGE SECTION
  ========================= */

  const baggageSection =
    detailSections.find(
      (item: any) =>
        String(item.typ).toLowerCase() ===
        "baggage"
    );

  const baggage =
    baggageSection?.mel ?? [];

  /* =========================
     PRICES
  ========================= */

  const selectedMealPrice =
    Number(selectedMeal?.amt || 0);

  const selectedBaggagePrice =
    Number(selectedBaggage?.amt || 0);

  const totalSSRPrice =
    selectedMealPrice +
    selectedBaggagePrice;

  /* =========================
     CONTINUE TO BOOKING
  ========================= */

  const handleContinue = () => {
    const query =
      new URLSearchParams({
        did,
        flightId,
        searchId,
        tId,
        price,
        airline,
        duration,

        /* =====================
           PASSENGER
        ===================== */

        firstName,
        lastName,
        age,
        phone,
        phoneCountryCode,
        email,
        title,
        dob,

        /* =====================
           DOCUMENT DETAILS
        ===================== */

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

        /* =====================
           SEAT
        ===================== */

        seatCode,
        seatNumber,
        seatPrice,

        /* =====================
           MEAL
        ===================== */

        mealCode:
          selectedMeal?.code || "",

        mealName:
          selectedMeal?.des || "",

        mealPrice:
          String(
            selectedMeal?.amt || "0"
          ),

        /* =====================
           BAGGAGE
        ===================== */

        baggageCode:
          selectedBaggage?.code || "",

        baggageName:
          selectedBaggage?.des || "",

        baggagePrice:
          String(
            selectedBaggage?.amt || "0"
          ),

        /* =====================
           SSR TOTAL
        ===================== */

        ssrPrice:
          String(totalSSRPrice),
      });

    router.push(
      `/flight-book?${query.toString()}`
    );
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">

      <div className="max-w-5xl mx-auto">

        {/* =====================
            HEADER
        ===================== */}

        <h1 className="text-3xl font-bold mb-8">
          Flight Extras
        </h1>

        {/* =====================
            JOURNEY CARD
        ===================== */}

        <div className="bg-slate-800 rounded-xl p-6 mb-8">

          <div className="grid md:grid-cols-2 gap-4">

            <p>
              <span className="text-gray-400">
                Airline:
              </span>

              <span className="font-bold ml-2">
                {airline || "N/A"}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Passenger:
              </span>

              <span className="font-bold ml-2">
                {passengerName || "N/A"}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Duration:
              </span>

              <span className="font-bold ml-2">
                {duration || "N/A"}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Ticket:
              </span>

              <span className="font-bold ml-2">
                ₹{price || "0"}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Seat:
              </span>

              <span className="font-bold ml-2">
                {seatNumber || "Not Selected"}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Seat Price:
              </span>

              <span className="font-bold ml-2">
                ₹{seatPrice || "0"}
              </span>
            </p>

          </div>

        </div>

        {loading ? (

          /* =====================
             LOADING
          ===================== */

          <div className="flex justify-center py-20">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" />

          </div>

        ) : (

          <>

            {/* =====================
                MEALS
            ===================== */}

            <div className="mb-10">

              <h2 className="text-2xl font-bold mb-4">
                🍱 Meals
              </h2>

              {meals.length === 0 ? (

                <div className="bg-slate-800 rounded-xl p-6">

                  <p className="text-gray-400">
                    No meal options are available
                    for this flight.
                  </p>

                </div>

              ) : (

                <div className="grid md:grid-cols-2 gap-4">

                  {meals.map(
                    (item: any) => (

                      <button
                        key={item.code}
                        type="button"
                        onClick={() =>
                          setSelectedMeal(item)
                        }
                        className={`
                          p-5
                          rounded-xl
                          border
                          text-left
                          transition

                          ${
                            selectedMeal?.code ===
                            item.code
                              ? "bg-blue-600 border-blue-300"
                              : "bg-slate-800 border-slate-700 hover:border-blue-500"
                          }
                        `}
                      >

                        <div className="font-bold text-lg">
                          {item.des}
                        </div>

                        <div className="text-sm text-gray-400 mt-2">
                          SSR Code
                        </div>

                        <div className="text-xs text-gray-500 break-all">
                          {item.code}
                        </div>

                        <div className="mt-3 text-xl font-bold">
                          ₹{item.amt}
                        </div>

                      </button>

                    )
                  )}

                </div>

              )}

              {/* SKIP MEAL */}

              <button
                type="button"
                onClick={() =>
                  setSelectedMeal(null)
                }
                className="mt-4 bg-slate-700 px-5 py-2 rounded-lg hover:bg-slate-600"
              >
                Skip Meal
              </button>

            </div>

            {/* =====================
                BAGGAGE
            ===================== */}

            <div className="mb-10">

              <h2 className="text-2xl font-bold mb-4">
                🧳 Baggage
              </h2>

              {baggage.length === 0 ? (

                <div className="bg-slate-800 rounded-xl p-6">

                  <p className="text-gray-400">
                    No baggage options are available
                    for this flight.
                  </p>

                </div>

              ) : (

                <div className="grid md:grid-cols-2 gap-4">

                  {baggage.map(
                    (item: any) => (

                      <button
                        key={item.code}
                        type="button"
                        onClick={() =>
                          setSelectedBaggage(item)
                        }
                        className={`
                          p-5
                          rounded-xl
                          border
                          text-left
                          transition

                          ${
                            selectedBaggage?.code ===
                            item.code
                              ? "bg-blue-600 border-blue-300"
                              : "bg-slate-800 border-slate-700 hover:border-blue-500"
                          }
                        `}
                      >

                        <div className="font-bold text-lg">
                          {item.des}
                        </div>

                        <div className="text-sm text-gray-400 mt-2">
                          SSR Code
                        </div>

                        <div className="text-xs text-gray-500 break-all">
                          {item.code}
                        </div>

                        <div className="mt-3 text-xl font-bold">
                          ₹{item.amt}
                        </div>

                      </button>

                    )
                  )}

                </div>

              )}

              {/* SKIP BAGGAGE */}

              <button
                type="button"
                onClick={() =>
                  setSelectedBaggage(null)
                }
                className="mt-4 bg-slate-700 px-5 py-2 rounded-lg hover:bg-slate-600"
              >
                No Extra Baggage
              </button>

            </div>

          </>

        )}

        {/* =====================
            SELECTION SUMMARY
        ===================== */}

        <div className="bg-slate-800 rounded-xl p-6 mb-8">

          <h2 className="text-xl font-bold mb-5">
            Selected Extras
          </h2>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Seat
              </span>

              <span className="font-semibold">
                {seatNumber || "Not Selected"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Meal
              </span>

              <span className="font-semibold">
                {selectedMeal?.des ||
                  "No Meal"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Meal Price
              </span>

              <span className="font-semibold">
                ₹{selectedMealPrice}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Baggage
              </span>

              <span className="font-semibold">
                {selectedBaggage?.des ||
                  "No Extra Baggage"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Baggage Price
              </span>

              <span className="font-semibold">
                ₹{selectedBaggagePrice}
              </span>
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4 flex justify-between">

              <span className="font-bold">
                SSR Total
              </span>

              <span className="text-xl font-bold text-blue-400">
                ₹{totalSSRPrice}
              </span>

            </div>

          </div>

        </div>

        {/* =====================
            CONTINUE
        ===================== */}

        <div className="flex justify-center">

          <button
            type="button"
            className="
              mt-4
              bg-blue-600
              hover:bg-blue-700
              px-8
              py-3
              rounded-lg
              font-semibold
              transition
            "
            onClick={handleContinue}
          >
            Continue to Booking
          </button>

        </div>

      </div>

    </div>
  );
}

export default function FlightMealPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <FlightMealPageContent />
    </Suspense>
  );
}