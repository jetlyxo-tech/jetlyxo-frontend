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

  /* =========================
     LOAD MEALS
  ========================= */

  useEffect(() => {
    async function loadMeals() {
      try {
        setLoading(true);

        const response = await meal({
          dId: did,
        });

        console.log(
          "Bonton Meal Response:",
          response
        );

        setMealResponse(response);
      } catch (err) {
        console.error(
          "Meal API Error:",
          err
        );

        toast.error(
          "Unable to load meals."
        );
      } finally {
        setLoading(false);
      }
    }

    if (did) {
      loadMeals();
    }
  }, [did]);

  /* =========================
     MEAL DATA
  ========================= */

  const mealSection =
    mealResponse?.dtl?.find(
      (item: any) =>
        item.typ === "Meal"
    );

  const meals =
    mealSection?.mel ?? [];

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
          Meal Selection
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
                {airline}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Passenger:
              </span>

              <span className="font-bold ml-2">
                {passengerName}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Duration:
              </span>

              <span className="font-bold ml-2">
                {duration}
              </span>
            </p>

            <p>
              <span className="text-gray-400">
                Ticket:
              </span>

              <span className="font-bold ml-2">
                ₹{price}
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
                ₹{seatPrice}
              </span>
            </p>

          </div>

        </div>

        {/* =====================
            MEALS
        ===================== */}

        {loading ? (

          <div className="flex justify-center py-20">

            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500" />

          </div>

        ) : (

          <>
            {meals.length === 0 ? (

              <div className="bg-slate-800 rounded-xl p-8 text-center">

                <h2 className="text-xl font-semibold mb-2">
                  No Meals Available
                </h2>

                <p className="text-gray-400">
                  This airline does not provide
                  meal selection.
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

                      <div className="text-sm text-gray-300 mt-1">
                        Code: {item.code}
                      </div>

                      <div className="mt-3 text-xl font-bold">
                        ₹{item.amt}
                      </div>

                    </button>

                  )
                )}

              </div>

            )}

          </>

        )}

        {/* =====================
            SKIP MEAL
        ===================== */}

        <div className="mt-8">

          <button
            type="button"
            onClick={() =>
              setSelectedMeal(null)
            }
            className="bg-slate-700 px-6 py-3 rounded-lg hover:bg-slate-600"
          >
            Skip Meal
          </button>

        </div>

        {/* =====================
            SELECTED MEAL
        ===================== */}

        <div className="mt-8 bg-slate-800 rounded-xl p-6 max-w-md">

          <h2 className="text-xl font-bold mb-4">
            Selected Meal
          </h2>

          {selectedMeal ? (

            <div className="space-y-2">

              <p>
                Meal:
                <span className="ml-2 font-bold">
                  {selectedMeal.des}
                </span>
              </p>

              <p>
                Price:
                <span className="ml-2 font-bold">
                  ₹{selectedMeal.amt}
                </span>
              </p>

            </div>

          ) : (

            <p className="text-gray-400">
              No Meal Selected
            </p>

          )}

        </div>

        {/* =====================
            CONTINUE
        ===================== */}

        <div className="flex justify-center">

          <button
            type="button"
            className="mt-10 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition"
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