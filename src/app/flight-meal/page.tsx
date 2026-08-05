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

const passengerName = `${firstName} ${lastName}`.trim();
  const age = params.get("age") || "";
  const phone = params.get("phone") || "";
  const email = params.get("email") || "";
  const title = params.get("title") || "";
  const dob = params.get("dob") || "";
const pan = params.get("pan") || "";
  const seatCode = params.get("seatCode") || "";
  const seatNumber = params.get("seatNumber") || "";
  const seatPrice = params.get("seatPrice") || "0";

  const [loading, setLoading] = useState(true);
  const [mealResponse, setMealResponse] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  useEffect(() => {
    async function loadMeals() {
      try {
        setLoading(true);

        const response = await meal({
          dId: did,
        });

        console.log("Meal Response");
        console.log(response);

        setMealResponse(response);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load meals.");
      } finally {
        setLoading(false);
      }
    }

    if (did) {
      loadMeals();
    }
  }, [did]);

  const meals =
    mealResponse?.data?.dtl?.[0]?.meal ||
    mealResponse?.data?.meal ||
    [];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-3xl font-bold mb-8">
        Meal Selection
      </h1>

      {/* Journey Card */}

      <div className="bg-slate-800 rounded-xl p-6 mb-8">

        <div className="grid md:grid-cols-2 gap-3">

          <p>
            Airline :
            <span className="font-bold ml-2">
              {airline}
            </span>
          </p>

          <p>
            Passenger :
            <span className="font-bold ml-2">
              {passengerName}
            </span>
          </p>

          <p>
            Duration :
            <span className="font-bold ml-2">
              {duration}
            </span>
          </p>

          <p>
            Ticket :
            <span className="font-bold ml-2">
              ₹{price}
            </span>
          </p>

          <p>
            Seat :
            <span className="font-bold ml-2">
              {seatNumber}
            </span>
          </p>

          <p>
            Seat Price :
            <span className="font-bold ml-2">
              ₹{seatPrice}
            </span>
          </p>

        </div>

      </div>

      {loading ? (

        <div className="text-xl">
          Loading Meals...
        </div>

      ) : (

        <>

          {meals.length === 0 ? (

            <div className="bg-slate-800 rounded-xl p-8 text-center">

              <h2 className="text-xl font-semibold mb-2">
                No Meals Available
              </h2>

              <p className="text-gray-400">
                This airline does not provide meal selection.
              </p>

            </div>

          ) : (

            <div className="grid md:grid-cols-2 gap-4">

              {meals.map((item: any) => (

                <button
                  key={item.code}
                  onClick={() => setSelectedMeal(item)}
                  className={`p-5 rounded-xl border text-left transition

                    ${
                      selectedMeal?.code === item.code
                        ? "bg-blue-600 border-blue-300"
                        : "bg-slate-800 border-slate-700 hover:border-blue-500"
                    }
                  `}
                >

                  <div className="font-bold text-lg">
                    {item.name || item.nm || "Meal"}
                  </div>

                  <div className="text-sm text-gray-300 mt-1">
                    Code : {item.code}
                  </div>

                  <div className="mt-3 text-xl font-bold">

                    ₹{item.prc || 0}

                  </div>

                </button>

              ))}

            </div>

          )}

        </>

      )}

      {/* Skip Meal */}

      <div className="mt-8">

        <button
          onClick={() => setSelectedMeal(null)}
          className="bg-slate-700 px-6 py-3 rounded-lg hover:bg-slate-600"
        >
          Skip Meal
        </button>

      </div>

      {/* Selected Meal */}

      <div className="mt-8 bg-slate-800 rounded-xl p-6 max-w-md">

        <h2 className="text-xl font-bold mb-4">
          Selected Meal
        </h2>

        {selectedMeal ? (

          <>

            <p>

              Meal :

              <span className="ml-2 font-bold">

                {selectedMeal.name || selectedMeal.nm}

              </span>

            </p>

            <p>

              Price :

              <span className="ml-2 font-bold">

                ₹{selectedMeal.prc}

              </span>

            </p>

          </>

        ) : (

          <p>No Meal Selected</p>

        )}

      </div>

      {/* Continue */}

      <button
        className="mt-10 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg"
        onClick={() => {

          router.push(

            `/flight-book?` +

            `did=${encodeURIComponent(did)}` +

            `&flightId=${encodeURIComponent(flightId)}` +

            `&searchId=${encodeURIComponent(searchId)}` +

            `&tId=${encodeURIComponent(tId)}` +

            `&price=${encodeURIComponent(price)}` +

            `&airline=${encodeURIComponent(airline)}` +

            `&duration=${encodeURIComponent(duration)}` +

            `&firstName=${encodeURIComponent(firstName)}`+
             `&lastName=${encodeURIComponent(lastName)}`+

            `&age=${encodeURIComponent(age)}` +

            `&phone=${encodeURIComponent(phone)}` +

            `&email=${encodeURIComponent(email)}` +

            `&seatCode=${encodeURIComponent(seatCode)}` +

            `&seatNumber=${encodeURIComponent(seatNumber)}` +

            `&seatPrice=${encodeURIComponent(seatPrice)}` +

            `&title=${encodeURIComponent(title)}` +

            `&dob=${encodeURIComponent(dob)}` +

            `&pan=${encodeURIComponent(pan)}` +

            `&mealCode=${encodeURIComponent(selectedMeal?.code || "")}` +

            `&mealName=${encodeURIComponent(
              selectedMeal?.name ||
              selectedMeal?.nm ||
              ""
            )}` +

            `&mealPrice=${encodeURIComponent(
              selectedMeal?.prc || "0"
            )}`

          );

        }}
      >
        Continue to Booking
      </button>

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