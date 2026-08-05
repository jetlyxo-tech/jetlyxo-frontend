"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBooking } from "@/lib/api";
import { toast } from "sonner";

function FlightBookPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const did = params.get("did") || "";

  const airline = params.get("airline") || "";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "";

  const firstName = params.get("firstName") || "";
  const lastName = params.get("lastName") || "";

  const phone = params.get("phone") || "";
  const email = params.get("email") || "";

  const title = params.get("title") || "Ms";
  const dob = params.get("dob") || "";
  const pan = params.get("pan") || "";
  const age = params.get("age") || "";
  const seatCode = params.get("seatCode") || "";
  const seatNumber = params.get("seatNumber") || "";
  const seatPrice = params.get("seatPrice") || "0";

  const mealCode = params.get("mealCode") || "";
  const mealName = params.get("mealName") || "";
  const mealPrice = params.get("mealPrice") || "0";

  const [loading, setLoading] = useState(false);

  async function handleBooking() {
    try {
      setLoading(true);   
      
      const totalPrice =
      Number(price) +
      Number(seatPrice || 0) +
      Number(mealPrice || 0);


      const payload = {
        dId: did,

        pax: [
          {
            ttl: title,
            fn: firstName,
            ln: lastName,
            pxt: "Adult",

            dob: `${dob}T00:00:00`,

            pno: "",
            panc: pan,

            pexp: "",
            pcn: "IN",
            nat: "IN",

            ffair: "",
            ffno: "",
            fdocid: "",

            ssr: [
              ...(seatCode
                ? [
                    {
                      type: "SeatDynamic",
                      triptype: "Oneway",
                      code: seatCode,
                    },
                  ]
                : []),

              ...(mealCode
                ? [
                    {
                      type: "Meal",
                      triptype: "Oneway",
                      code: mealCode,
                    },
                  ]
                : []),
            ],
          },
        ],

        gstad: "",
        gstcno: "",
        gstcn: "",
        gstno: "",
        gste: "",
        isg: false,

        email,
        cno: phone,
        cc: "+91",
        totalPrice,
      };

      

      console.log("========== BOOK PAYLOAD ==========");
      console.log(payload);

      const booking = await createBooking({
        bookingType: "FLIGHT",
      
        passengerName: `${title} ${firstName} ${lastName}`,
      
        passengerAge: Number(age),
      
        passengerPhone: phone,
        passengerEmail: email,
      
        totalPrice: Number(price),
      
        bontonPayload: payload,
      });
      
      toast.success("Booking created. Proceed to payment.");
      
      setTimeout(() => {
        router.push(`/payment?bookingId=${booking.bookingId}`);
      }, 800);
     
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ??
        err?.message ??
        "Booking failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function confirmBooking() {
    if (!firstName || lastName.trim().length < 2) {
      toast.warning(
        "Please enter a valid First Name and Last Name."
      );
      return;
    }
  
    const ok = window.confirm(
      "You will be redirected to the secure Razorpay payment page. Your flight will be booked only after successful payment.\n\nContinue?"
    );
  
    if (!ok) return;
  
    handleBooking();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">
        Confirm Booking
      </h1>

      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <p>
          <b>Passenger:</b> {title} {firstName} {lastName}
        </p>

        <p>
          <b>Airline:</b> {airline}
        </p>

        <p>
          <b>Duration:</b> {duration}
        </p>

        <p>
          <b>Ticket Price:</b> ₹{price}
        </p>

        <hr className="border-slate-600" />

        <p>
          <b>Seat:</b> {seatNumber || "Not Selected"}
        </p>

        <p>
          <b>Seat Price:</b> ₹{seatPrice}
        </p>

        <hr className="border-slate-600" />

        <p>
          <b>Meal:</b> {mealName || "No Meal"}
        </p>

        <p>
          <b>Meal Price:</b> ₹{mealPrice}
        </p>
      </div>

      <button
  onClick={confirmBooking}
  disabled={loading}

        className="mt-8 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? "Booking..." : "Confirm Booking"}
      </button>
    </div>
  );
}

export default function FlightBookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <FlightBookPageContent />
    </Suspense>
  );
}