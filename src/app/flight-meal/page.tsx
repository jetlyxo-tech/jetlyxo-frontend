"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { meal } from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

interface SSROption {
  des?: string;
  amt?: string | number;
  cur?: string;
  code?: string;
  disnm?: string;
}

interface SSRSection {
  typ?: string;
  trpt?: string;
  frapc?: string;
  toapc?: string;
  mel?: SSROption[];
  ssrl?: SSROption[];
}

/* =========================================================
   HELPERS
========================================================= */

function getAmount(value: unknown): number {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
}

function getOptionName(item: SSROption): string {
  return (
    item.des ||
    item.disnm ||
    "SSR Option"
  );
}

function getCurrency(item: SSROption): string {
  return item.cur || "INR";
}

/* =========================================================
   EXTRACT SSR SECTIONS
========================================================= */

function extractSSRSections(response: any): SSRSection[] {
  /*
    Bonton response from your Network tab:

    {
      success: true,
      data: {
        success: true,
        message: "Success",
        errorCode: null,
        data: {
          mealId: "...",
          isssr: true,
          dtl: [...]
        }
      }
    }

    Therefore the main path is:

    response.data.data.dtl
  */

  const possibleSections = [
    response?.data?.data?.dtl,
    response?.data?.dtl,
    response?.data?.data?.data?.dtl,
    response?.dtl,
  ];

  const sections = possibleSections.find(
    (value) => Array.isArray(value)
  );

  return Array.isArray(sections)
    ? sections
    : [];
}

/* =========================================================
   PAGE
========================================================= */

function FlightMealPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  /* =======================================================
     BASIC FLIGHT DETAILS
  ======================================================= */

  const did = params.get("did") || "";

  const flightId =
    params.get("flightId") || "";

  const searchId =
    params.get("searchId") || "";

  const tId =
    params.get("tId") || "";

  const airline =
    params.get("airline") || "";

  const duration =
    params.get("duration") || "";

  const price =
    params.get("price") || "";

  /* =======================================================
     PASSENGER
  ======================================================= */

  const firstName =
    params.get("firstName") || "";

  const lastName =
    params.get("lastName") || "";

  const passengerName =
    `${firstName} ${lastName}`.trim();

  const age =
    params.get("age") || "";

  const phone =
    params.get("phone") || "";

  const email =
    params.get("email") || "";

  const title =
    params.get("title") || "";

  const dob =
    params.get("dob") || "";

  /* =======================================================
     DOCUMENT DETAILS
  ======================================================= */

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

  /* =======================================================
     SEAT DETAILS
  ======================================================= */

  const seatCode =
    params.get("seatCode") || "";

  const seatNumber =
    params.get("seatNumber") || "";

  const seatPrice =
    params.get("seatPrice") || "0";

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [mealResponse, setMealResponse] =
    useState<any>(null);

  const [selectedMeal, setSelectedMeal] =
    useState<SSROption | null>(null);

  const [selectedBaggage, setSelectedBaggage] =
    useState<SSROption | null>(null);

  /* =======================================================
     LOAD BONTON SSR
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadMeals() {
      try {
        setLoading(true);

        console.log(
          "=========================================="
        );

        console.log(
          "🚀 REQUESTING BONTON SSR"
        );

        console.log(
          "dId:",
          did
        );

        const response = await meal({
          dId: did,
        });

        if (cancelled) {
          return;
        }

        console.log(
          "========== BONTON SSR RESPONSE =========="
        );

        console.dir(
          response,
          {
            depth: null,
          }
        );

        console.log(
          "=========================================="
        );

        setMealResponse(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "❌ SSR API ERROR:",
          error
        );

        toast.error(
          "Unable to load meal/baggage options."
        );

        setMealResponse(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!did) {
      console.warn(
        "⚠️ No dId supplied to Flight Meal page."
      );

      setLoading(false);

      return;
    }

    loadMeals();

    return () => {
      cancelled = true;
    };
  }, [did]);

  /* =======================================================
     EXTRACT BONTON SSR SECTIONS
  ======================================================= */

  const detailSections =
    useMemo(
      () =>
        extractSSRSections(
          mealResponse
        ),
      [mealResponse]
    );

  /* =======================================================
     DEBUG SSR STRUCTURE
  ======================================================= */

  useEffect(() => {
    if (!mealResponse) {
      return;
    }

    console.log(
      "========== SSR DETAIL SECTIONS =========="
    );

    console.dir(
      detailSections,
      {
        depth: null,
      }
    );

    console.log(
      "=========================================="
    );
  }, [mealResponse, detailSections]);

  /* =======================================================
     MEAL SECTION

     Bonton uses:

     typ: "MealDynamic"
  ======================================================= */

  const mealSection =
    useMemo(
      () =>
        detailSections.find(
          (item) =>
            String(item.typ || "")
              .trim()
              .toLowerCase() ===
            "mealdynamic"
        ),
      [detailSections]
    );

  const meals =
    useMemo(
      () =>
        Array.isArray(
          mealSection?.mel
        )
          ? mealSection.mel
          : [],
      [mealSection]
    );

  /* =======================================================
     BAGGAGE SECTION
  ======================================================= */

  const baggageSection =
    useMemo(
      () =>
        detailSections.find(
          (item) =>
            String(item.typ || "")
              .trim()
              .toLowerCase() ===
            "baggage"
        ),
      [detailSections]
    );

  const baggage =
    useMemo(
      () =>
        Array.isArray(
          baggageSection?.mel
        )
          ? baggageSection.mel
          : [],
      [baggageSection]
    );

  /* =======================================================
     DEBUG MEALS
  ======================================================= */

  useEffect(() => {
    console.log(
      "🍱 MEAL OPTIONS:",
      meals
    );

    console.log(
      "🧳 BAGGAGE OPTIONS:",
      baggage
    );
  }, [meals, baggage]);

  /* =======================================================
     PRICES
  ======================================================= */

  const selectedMealPrice =
    getAmount(
      selectedMeal?.amt
    );

  const selectedBaggagePrice =
    getAmount(
      selectedBaggage?.amt
    );

  const totalSSRPrice =
    selectedMealPrice +
    selectedBaggagePrice;

  /* =======================================================
     SELECT MEAL
  ======================================================= */

  const handleMealSelect = (
    item: SSROption
  ) => {
    setSelectedMeal(item);

    console.log(
      "🍱 Selected Meal:",
      item
    );
  };

  /* =======================================================
     SELECT BAGGAGE
  ======================================================= */

  const handleBaggageSelect = (
    item: SSROption
  ) => {
    setSelectedBaggage(item);

    console.log(
      "🧳 Selected Baggage:",
      item
    );
  };

  /* =======================================================
     CONTINUE TO BOOKING
  ======================================================= */

  const handleContinue = () => {
    const query =
      new URLSearchParams({
        /* =====================
           FLIGHT
        ===================== */

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
          selectedMeal
            ? getOptionName(
                selectedMeal
              )
            : "",

        mealPrice:
          String(
            selectedMealPrice
          ),

        /* =====================
           BAGGAGE
        ===================== */

        baggageCode:
          selectedBaggage?.code || "",

        baggageName:
          selectedBaggage
            ? getOptionName(
                selectedBaggage
              )
            : "",

        baggagePrice:
          String(
            selectedBaggagePrice
          ),

        /* =====================
           SSR TOTAL
        ===================== */

        ssrPrice:
          String(
            totalSSRPrice
          ),
      });

    console.log(
      "========== CONTINUE TO BOOKING =========="
    );

    console.log({
      mealCode:
        selectedMeal?.code || "",

      mealName:
        selectedMeal
          ? getOptionName(
              selectedMeal
            )
          : "",

      mealPrice:
        selectedMealPrice,

      baggageCode:
        selectedBaggage?.code || "",

      baggageName:
        selectedBaggage
          ? getOptionName(
              selectedBaggage
            )
          : "",

      baggagePrice:
        selectedBaggagePrice,

      ssrPrice:
        totalSSRPrice,
    });

    router.push(
      `/flight-book?${query.toString()}`
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">

      <div className="max-w-5xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold">
            Flight Extras
          </h1>

          <p className="text-slate-400 mt-2">
            Select meals and additional baggage
            for your journey.
          </p>

        </div>

        {/* =================================================
            JOURNEY CARD
        ================================================= */}

        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">

          <div className="grid sm:grid-cols-2 gap-5">

            <div>
              <p className="text-sm text-slate-400">
                Airline
              </p>

              <p className="font-bold mt-1">
                {airline || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Passenger
              </p>

              <p className="font-bold mt-1">
                {passengerName || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Duration
              </p>

              <p className="font-bold mt-1">
                {duration || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Ticket
              </p>

              <p className="font-bold mt-1">
                ₹{price || "0"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Seat
              </p>

              <p className="font-bold mt-1">
                {seatNumber ||
                  "Not Selected"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">
                Seat Price
              </p>

              <p className="font-bold mt-1">
                ₹{seatPrice || "0"}
              </p>
            </div>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="bg-slate-800 rounded-xl p-10 flex flex-col items-center justify-center border border-slate-700">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" />

            <p className="text-slate-400 mt-4">
              Loading meal and baggage options...
            </p>

          </div>

        ) : (

          <>

            {/* =============================================
                MEALS
            ============================================= */}

            <section className="mb-10">

              <div className="flex items-center justify-between mb-4">

                <div>
                  <h2 className="text-2xl font-bold">
                    🍱 Meals
                  </h2>

                  <p className="text-sm text-slate-400 mt-1">
                    Choose an available meal for
                    your journey.
                  </p>
                </div>

                {meals.length > 0 && (
                  <span className="text-sm text-slate-400">
                    {meals.length} option
                    {meals.length !== 1
                      ? "s"
                      : ""}
                  </span>
                )}

              </div>

              {meals.length === 0 ? (

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">

                  <p className="text-slate-400">
                    No meal options are available
                    for this flight.
                  </p>

                </div>

              ) : (

                <div className="grid sm:grid-cols-2 gap-4">

                  {meals.map(
                    (
                      item,
                      index
                    ) => {

                      const isSelected =
                        selectedMeal?.code ===
                        item.code;

                      const amount =
                        getAmount(
                          item.amt
                        );

                      const name =
                        getOptionName(
                          item
                        );

                      const currency =
                        getCurrency(
                          item
                        );

                      return (

                        <button
                          key={
                            item.code ||
                            `${name}-${index}`
                          }
                          type="button"
                          onClick={() =>
                            handleMealSelect(
                              item
                            )
                          }
                          className={`
                            w-full
                            p-5
                            rounded-xl
                            border
                            text-left
                            transition-all
                            duration-200
                            ${
                              isSelected
                                ? "bg-blue-600 border-blue-300 shadow-lg shadow-blue-900/30"
                                : "bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750"
                            }
                          `}
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex-1">

                              <div className="flex items-center gap-2">

                                <span className="text-xl">
                                  🍱
                                </span>

                                <span className="font-bold text-lg">
                                  {name}
                                </span>

                              </div>

                              {item.disnm &&
                                item.disnm !==
                                  item.des && (

                                  <p className="text-sm text-slate-400 mt-2">
                                    {item.disnm}
                                  </p>

                                )}

                            </div>

                            <div className="text-right">

                              <p className="font-bold text-lg">
                                {currency === "INR"
                                  ? "₹"
                                  : `${currency} `}
                                {amount}
                              </p>

                            </div>

                          </div>

                          {isSelected && (

                            <div className="mt-4 pt-3 border-t border-blue-400/40">

                              <span className="text-sm font-semibold">
                                ✓ Selected
                              </span>

                            </div>

                          )}

                        </button>

                      );
                    }
                  )}

                </div>

              )}

              <button
                type="button"
                onClick={() =>
                  setSelectedMeal(
                    null
                  )
                }
                className={`
                  mt-4
                  px-5
                  py-2.5
                  rounded-lg
                  font-medium
                  transition
                  ${
                    selectedMeal === null
                      ? "bg-slate-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600"
                  }
                `}
              >
                Skip Meal
              </button>

            </section>

            {/* =============================================
                BAGGAGE
            ============================================= */}

            <section className="mb-10">

              <div className="flex items-center justify-between mb-4">

                <div>
                  <h2 className="text-2xl font-bold">
                    🧳 Baggage
                  </h2>

                  <p className="text-sm text-slate-400 mt-1">
                    Add extra baggage if required.
                  </p>
                </div>

                {baggage.length > 0 && (
                  <span className="text-sm text-slate-400">
                    {baggage.length} option
                    {baggage.length !== 1
                      ? "s"
                      : ""}
                  </span>
                )}

              </div>

              {baggage.length === 0 ? (

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">

                  <p className="text-slate-400">
                    No baggage options are available
                    for this flight.
                  </p>

                </div>

              ) : (

                <div className="grid sm:grid-cols-2 gap-4">

                  {baggage.map(
                    (
                      item,
                      index
                    ) => {

                      const isSelected =
                        selectedBaggage?.code ===
                        item.code;

                      const amount =
                        getAmount(
                          item.amt
                        );

                      const name =
                        getOptionName(
                          item
                        );

                      const currency =
                        getCurrency(
                          item
                        );

                      return (

                        <button
                          key={
                            item.code ||
                            `${name}-${index}`
                          }
                          type="button"
                          onClick={() =>
                            handleBaggageSelect(
                              item
                            )
                          }
                          className={`
                            w-full
                            p-5
                            rounded-xl
                            border
                            text-left
                            transition-all
                            duration-200
                            ${
                              isSelected
                                ? "bg-blue-600 border-blue-300 shadow-lg shadow-blue-900/30"
                                : "bg-slate-800 border-slate-700 hover:border-blue-500"
                            }
                          `}
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex-1">

                              <div className="flex items-center gap-2">

                                <span className="text-xl">
                                  🧳
                                </span>

                                <span className="font-bold text-lg">
                                  {name}
                                </span>

                              </div>

                              {item.disnm &&
                                item.disnm !==
                                  item.des && (

                                  <p className="text-sm text-slate-400 mt-2">
                                    {item.disnm}
                                  </p>

                                )}

                            </div>

                            <div className="text-right">

                              <p className="font-bold text-lg">
                                {currency === "INR"
                                  ? "₹"
                                  : `${currency} `}
                                {amount}
                              </p>

                            </div>

                          </div>

                          {isSelected && (

                            <div className="mt-4 pt-3 border-t border-blue-400/40">

                              <span className="text-sm font-semibold">
                                ✓ Selected
                              </span>

                            </div>

                          )}

                        </button>

                      );
                    }
                  )}

                </div>

              )}

              <button
                type="button"
                onClick={() =>
                  setSelectedBaggage(
                    null
                  )
                }
                className={`
                  mt-4
                  px-5
                  py-2.5
                  rounded-lg
                  font-medium
                  transition
                  ${
                    selectedBaggage === null
                      ? "bg-slate-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600"
                  }
                `}
              >
                No Extra Baggage
              </button>

            </section>

          </>

        )}

        {/* =================================================
            SELECTION SUMMARY
        ================================================= */}

        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">

          <h2 className="text-xl font-bold mb-5">
            Selected Extras
          </h2>

          <div className="space-y-4">

            {/* SEAT */}

            <div className="flex justify-between gap-4">

              <span className="text-slate-400">
                Seat
              </span>

              <span className="font-semibold text-right">
                {seatNumber ||
                  "Not Selected"}
              </span>

            </div>

            {/* MEAL */}

            <div className="flex justify-between gap-4">

              <span className="text-slate-400">
                Meal
              </span>

              <span className="font-semibold text-right">
                {selectedMeal
                  ? getOptionName(
                      selectedMeal
                    )
                  : "No Meal"}
              </span>

            </div>

            {/* MEAL PRICE */}

            <div className="flex justify-between gap-4">

              <span className="text-slate-400">
                Meal Price
              </span>

              <span className="font-semibold">
                ₹{selectedMealPrice}
              </span>

            </div>

            {/* BAGGAGE */}

            <div className="flex justify-between gap-4">

              <span className="text-slate-400">
                Baggage
              </span>

              <span className="font-semibold text-right">
                {selectedBaggage
                  ? getOptionName(
                      selectedBaggage
                    )
                  : "No Extra Baggage"}
              </span>

            </div>

            {/* BAGGAGE PRICE */}

            <div className="flex justify-between gap-4">

              <span className="text-slate-400">
                Baggage Price
              </span>

              <span className="font-semibold">
                ₹{selectedBaggagePrice}
              </span>

            </div>

            {/* TOTAL */}

            <div className="border-t border-slate-700 pt-4 mt-4 flex justify-between items-center">

              <span className="font-bold">
                SSR Total
              </span>

              <span className="text-2xl font-bold text-blue-400">
                ₹{totalSSRPrice}
              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            CONTINUE
        ================================================= */}

        <div className="flex justify-center pb-10">

          <button
            type="button"
            onClick={
              handleContinue
            }
            className="
              bg-blue-600
              hover:bg-blue-700
              active:bg-blue-800
              px-8
              py-3
              rounded-lg
              font-semibold
              transition
              shadow-lg
              shadow-blue-900/30
            "
          >
            Continue to Booking →
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   PAGE WRAPPER
========================================================= */

export default function FlightMealPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">

          <div className="text-center">

            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-blue-500 mx-auto" />

            <p className="mt-4 text-slate-400">
              Loading...
            </p>

          </div>

        </div>
      }
    >
      <FlightMealPageContent />
    </Suspense>
  );
}