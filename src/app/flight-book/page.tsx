"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createBooking } from "@/lib/api";
import { toast } from "sonner";

function FlightBookPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  /* =========================
     BASIC FLIGHT DETAILS
  ========================= */

  const did = params.get("did") || "";

  const airline = params.get("airline") || "";
  const duration = params.get("duration") || "";
  const price = params.get("price") || "0";

  /* =========================
     PASSENGER DETAILS
  ========================= */

  const firstName = params.get("firstName") || "";
  const lastName = params.get("lastName") || "";

  const phone = params.get("phone") || "";
  const email = params.get("email") || "";

  const title = params.get("title") || "Ms";
  const dob = params.get("dob") || "";
  const age = params.get("age") || "";

  /* =========================
     RESIDENCY / DOCUMENT
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
     MEAL DETAILS
  ========================= */

  const mealCode =
    params.get("mealCode") || "";

  const mealName =
    params.get("mealName") || "";

  const mealPrice =
    params.get("mealPrice") || "0";

  const [loading, setLoading] =
    useState(false);

  /* =========================
     HANDLE BOOKING
  ========================= */

  async function handleBooking() {
    try {
      setLoading(true);

      /* =========================
         BASIC VALIDATION
      ========================= */

      if (!firstName.trim()) {
        toast.warning(
          "Please enter a valid first name."
        );
        return;
      }

      if (!lastName.trim()) {
        toast.warning(
          "Please enter a valid last name."
        );
        return;
      }

      if (!dob) {
        toast.warning(
          "Date of birth is required."
        );
        return;
      }

      if (!phone) {
        toast.warning(
          "Phone number is required."
        );
        return;
      }

      if (!email) {
        toast.warning(
          "Email address is required."
        );
        return;
      }

      /* =========================
         DOCUMENT DATA
      ========================= */

      let panc = "";
      let pno = "";
      let pexp = "";
      let pcn = "";
      let nat = "";

      /* =========================
         INDIAN RESIDENT
      ========================= */

      if (residence === "IN") {
        const normalizedPan =
          pan.trim().toUpperCase();

        if (
          !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
            normalizedPan
          )
        ) {
          toast.warning(
            "Please enter a valid PAN number."
          );
          return;
        }

        panc = normalizedPan;

        pno = "";
        pexp = "";
        pcn = "IN";
        nat = "IN";
      }

      /* =========================
         NON-INDIAN RESIDENT
      ========================= */

      else {
        const normalizedPassport =
          passportNumber
            .trim()
            .toUpperCase();

        const normalizedPassportCountry =
          passportCountry
            .trim()
            .toUpperCase();

        if (!normalizedPassport) {
          toast.warning(
            "Passport number is required."
          );
          return;
        }

        if (!passportExpiry) {
          toast.warning(
            "Passport expiry date is required."
          );
          return;
        }

        if (!normalizedPassportCountry) {
          toast.warning(
            "Passport country is required."
          );
          return;
        }

        panc = "";

        pno = normalizedPassport;

        pexp =
          `${passportExpiry}T00:00:00`;

        pcn = normalizedPassportCountry;

        nat = residence;
      }

      /* =========================
         TOTAL PRICE
      ========================= */

      const totalPrice =
        Number(price) +
        Number(seatPrice || 0) +
        Number(mealPrice || 0);

      /* =========================
         BONTON BOOK PAYLOAD
      ========================= */

      const payload = {
        dId: did,

        pax: [
          {
            ttl: title,

            fn: firstName.trim(),

            ln: lastName.trim(),

            pxt: "Adult",

            dob: `${dob}T00:00:00`,

            /*
             * Indian:
             *   panc = PAN
             *
             * Non-Indian:
             *   pno  = Passport number
             *   pexp = Passport expiry
             */

            pno,

            panc,

            pexp,

            pcn,

            nat,

            ffair: "",

            ffno: "",

            fdocid: "",

            /* =====================
               SSR
            ===================== */

            ssr: [
              ...(seatCode
                ? [
                    {
                      type:
                        "SeatDynamic",

                      triptype:
                        "Oneway",

                      code:
                        seatCode,
                    },
                  ]
                : []),

              ...(mealCode
                ? [
                    {
                      type: "Meal",

                      triptype:
                        "Oneway",

                      code:
                        mealCode,
                    },
                  ]
                : []),
            ],
          },
        ],

        /* =========================
           GST
        ========================= */

        gstad: "",
        gstcno: "",
        gstcn: "",
        gstno: "",
        gste: "",
        isg: false,

        /* =========================
           CONTACT
        ========================= */

        email,

        cno: phone,

        cc: phoneCountryCode,

        totalPrice,
      };

      /* =========================
         DEBUG
      ========================= */

      console.log(
        "========== FINAL BONTON BOOK PAYLOAD =========="
      );

      console.log(
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.log(
        "Residence:",
        residence
      );

      console.log(
        "Document Type:",
        residence === "IN"
          ? "PAN"
          : "PASSPORT"
      );

      /* =========================
         CREATE JETLY BOOKING
      ========================= */

      const booking =
        await createBooking({
          bookingType: "FLIGHT",

          passengerName:
            `${title} ${firstName} ${lastName}`,

          passengerAge:
            Number(age),

          passengerPhone:
            phone,

          passengerEmail:
            email,

          /*
           * Keep your existing booking
           * service price.
           */
          totalPrice:
            Number(price),

          /*
           * Bonton payload contains
           * the actual booking total.
           */
          bontonPayload:
            payload,
        });

      console.log(
        "Jetly Booking Response:",
        booking
      );

      toast.success(
        "Booking created. Proceed to payment."
      );

      setTimeout(() => {
        router.push(
          `/payment?bookingId=${booking.bookingId}`
        );
      }, 800);

    } catch (err: any) {
      console.error(
        "Booking Error:",
        err
      );

      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Booking failed."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CONFIRM BOOKING
  ========================= */

  function confirmBooking() {
    if (
      !firstName.trim() ||
      lastName.trim().length < 2
    ) {
      toast.warning(
        "Please enter a valid First Name and Last Name."
      );

      return;
    }

    const ok = window.confirm(
      "You will be redirected to the secure Razorpay payment page. Your flight will be booked only after successful payment.\n\nContinue?"
    );

    if (!ok) {
      return;
    }

    handleBooking();
  }

  /* =========================
     DOCUMENT LABEL
  ========================= */

  const documentLabel =
    residence === "IN"
      ? "PAN"
      : "Passport";

  /* =========================
     PAGE
  ========================= */

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">

      <div className="max-w-3xl mx-auto">

        {/* =====================
            HEADER
        ===================== */}

        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold">
            Confirm Booking
          </h1>

          <p className="text-slate-400 mt-2">
            Review your passenger and
            booking details before payment.
          </p>

        </div>

        {/* =====================
            BOOKING SUMMARY
        ===================== */}

        <div className="bg-slate-800 rounded-xl p-6 space-y-4">

          <p>
            <b>Passenger:</b>{" "}
            {title} {firstName} {lastName}
          </p>

          <p>
            <b>Airline:</b>{" "}
            {airline}
          </p>

          <p>
            <b>Duration:</b>{" "}
            {duration}
          </p>

          <p>
            <b>Ticket Price:</b>{" "}
            ₹{price}
          </p>

          <hr className="border-slate-600" />

          {/* DOCUMENT */}

          <p>
            <b>{documentLabel}:</b>{" "}

            {residence === "IN"
              ? pan || "Not provided"
              : passportNumber ||
                "Not provided"}
          </p>

          <hr className="border-slate-600" />

          {/* SEAT */}

          <p>
            <b>Seat:</b>{" "}
            {seatNumber ||
              "Not Selected"}
          </p>

          <p>
            <b>Seat Price:</b>{" "}
            ₹{seatPrice}
          </p>

          <hr className="border-slate-600" />

          {/* MEAL */}

          <p>
            <b>Meal:</b>{" "}
            {mealName ||
              "No Meal"}
          </p>

          <p>
            <b>Meal Price:</b>{" "}
            ₹{mealPrice}
          </p>

          <hr className="border-slate-600" />

          {/* TOTAL */}

          <p className="text-lg">

            <b>Total:</b>{" "}

            <span className="font-bold text-green-400">
              ₹
              {Number(price) +
                Number(seatPrice || 0) +
                Number(mealPrice || 0)}
            </span>

          </p>

        </div>

        {/* =====================
            CONFIRM BUTTON
        ===================== */}

        <div className="flex justify-center">

          <button
            type="button"
            onClick={confirmBooking}
            disabled={loading}
            className="mt-8 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading
              ? "Booking..."
              : "Confirm Booking"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default function FlightBookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          Loading...
        </div>
      }
    >
      <FlightBookPageContent />
    </Suspense>
  );
}