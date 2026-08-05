"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { seatMap } from "@/lib/api";
import { toast } from "sonner";

function FlightSeatPageContent() {
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
  const seatPrice = params.get("seatPrice") || "";
  const [loading, setLoading] = useState(true);
  const [seatResponse, setSeatResponse] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);

  useEffect(() => {
    async function loadSeatMap() {
      try {
        setLoading(true);

        const response = await seatMap({
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



        console.log("Seat Map:", response);

        setSeatResponse(response);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load seat map.");
      } finally {
        setLoading(false);
      }
    }

    if (!did) {
      toast.error("Booking Detail ID (dId) not found.");
      router.push("/");
      return;
    }
    
    loadSeatMap();
  }, [did]);

  const seatRows =
  seatResponse?.data?.dtl?.[0]?.smseat || [];

const visibleRows = seatRows.filter((row: any[]) =>
  row.some((seat) => !seat.isempty)
);

if (!loading && seatRows.length === 0) {
  return (
    <div className="min-h-screen flex justify-center items-center text-xl text-gray-300">
      No seats available for this flight.
    </div>
  );
}

    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
    
        <h1 className="text-3xl font-bold mb-8">
          Seat Selection
        </h1>

      {/* Flight Card */}

      <div className="bg-slate-800 rounded-xl p-6 mb-8">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

<div>
  <p className="text-gray-400">Airline</p>
  <p className="font-semibold">{airline}</p>
</div>

<div>
  <p className="text-gray-400">Passenger</p>
  <p className="font-semibold">{passengerName}</p>
</div>

<div>
  <p className="text-gray-400">Duration</p>
  <p className="font-semibold">{duration}</p>
</div>

<div>
  <p className="text-gray-400">Ticket Fare</p>
  <p className="font-semibold">₹{price}</p>
</div>

{selectedSeat && (
  <>
    <div>
      <p className="text-gray-400">Seat Charge</p>
      <p className="font-semibold">₹{selectedSeat.prc}</p>
    </div>

    <div>
      <p className="text-gray-400">Total</p>
      <p className="font-bold text-green-400">
        ₹{Number(price) + Number(selectedSeat.prc)}
      </p>
    </div>
  </>
)}

</div>

        </div>

      {/* Legend */}

      <div className="flex flex-wrap justify-center gap-6 mb-8">

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-600 rounded"></div>
          Free
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-500 rounded"></div>
          Paid
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-600 rounded"></div>
          Occupied
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-600 rounded"></div>
          Selected
        </div>

      </div>

      {loading ? (

<div className="flex justify-center items-center py-20">
  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 rounded-full"></div>
</div>

) : (

<>
          {/* Cockpit */}

          <div className="flex justify-center mb-6">

            <div className="bg-slate-700 px-8 py-2 rounded-full font-semibold">
              Cockpit
            </div>

          </div>

          {/* Seat Headers */}

          <div className="max-w-4xl mx-auto">

          <div className="grid grid-cols-8 gap-2 mb-3 text-center font-bold">

          <div></div>
        
          <div>A</div>
          <div>B</div>
          <div>C</div>
        
          <div></div>
        
          <div>D</div>
          <div>E</div>
          <div>F</div>
        
        </div>

            {visibleRows.map((row: any[], rowIndex: number) => (

              <div
  key={rowIndex}
  className="grid grid-cols-8 gap-2 mb-2 items-center"
>
<div className="text-gray-400 font-bold text-center">
  {row.find((s) => !s.isempty)?.sno?.replace(/[A-Z]/g, "")}
</div>
                {row.map((seat: any, index: number) => {

                  if (seat.isempty) {
                    return (
                      <div
                        key={index}
                        className="w-14 h-14"
                      />
                    );
                  }


                  return (

                    <button
                    key={seat.code}
                    onClick={() => {
                      if (seat.isempty) return;
                      if (seat.avlt === 2) return;
                  
                      setSelectedSeat(seat);
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
                        selectedSeat?.code === seat.code
                          ? "bg-blue-600 border-blue-300"
                          : seat.avlt === 2
                          ? "bg-red-600 cursor-not-allowed"
                          : seat.isfree
                          ? "bg-green-600 hover:bg-green-500"
                          : "bg-yellow-500 hover:bg-yellow-400 text-black"
                      }
                    `}
                  >
                    <div>{seat.sno}</div>
                  
                    <div className="text-xs">
                      ₹{seat.prc}
                    </div>
                  </button>


                  );
                })}

              </div>

            ))}

          </div>

          {/* Selected Seat */}

          {selectedSeat && (

            <div className="mt-10 max-w-md mx-auto bg-slate-800 rounded-xl p-6 shadow-xl">

<h2 className="text-xl font-bold mb-4">
  Selected Seat
</h2>

<div className="space-y-2">

  <p>
  Seat Number :
    <span className="font-bold ml-2">
      {selectedSeat.sno}
    </span>
  </p>

  <p>
  Seat Fare :
    <span className="font-bold ml-2">
      ₹{selectedSeat.prc}
    </span>
  </p>

  <hr className="border-slate-600" />

  <p>
  Base Fare :
    <span className="font-bold ml-2">
      ₹{price}
    </span>
  </p>
  <p>
  Total Fare :
  <span className="font-bold text-green-400 ml-2">
    ₹{Number(price) + Number(selectedSeat.prc)}
  </span>
</p>
</div>

            </div>

          )}

        </>

      )}

      {/* Continue */}

      <div className="flex justify-center mt-10">

<button
  disabled={!selectedSeat}
  className={`
    px-10
    py-4
    shadow-lg
    hover:shadow-blue-500/40
    rounded-lg
    font-semibold
    transition

    ${
      selectedSeat
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-gray-600 cursor-not-allowed opacity-50"
    }
  `}
  onClick={() => {
    if (!selectedSeat) return;

    router.push(
      `/flight-meal?did=${encodeURIComponent(did)}` +
        `&flightId=${encodeURIComponent(flightId)}` +
        `&searchId=${encodeURIComponent(searchId)}` +
        `&tId=${encodeURIComponent(tId)}` +
        `&price=${encodeURIComponent(price)}` +
        `&airline=${encodeURIComponent(airline)}` +
        `&duration=${encodeURIComponent(duration)}` +
        `&firstName=${encodeURIComponent(firstName)}` +
        `&lastName=${encodeURIComponent(lastName)}` +
        `&age=${encodeURIComponent(age)}` +
        `&phone=${encodeURIComponent(phone)}` +
        `&email=${encodeURIComponent(email)}` +
        `&seatCode=${encodeURIComponent(selectedSeat.code)}` +
        `&seatNumber=${encodeURIComponent(selectedSeat.sno)}` +
        `&seatPrice=${encodeURIComponent(selectedSeat.prc)}` +
        `&title=${encodeURIComponent(title)}` +
        `&dob=${encodeURIComponent(dob)}` +
        `&pan=${encodeURIComponent(pan)}`
    );
  }}
>
  Continue to Meals
</button>
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