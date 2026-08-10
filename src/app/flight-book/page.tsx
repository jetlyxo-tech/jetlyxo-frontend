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

  /*
   * IMPORTANT:
   * cc = phone country code
   * residence = passenger residence
   *
   * They are separate values.
   */
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

  /* =========================
     BAGGAGE DETAILS
  ========================= */

  const baggageCode =
    params.get("baggageCode") || "";

  const baggageName =
    params.get("baggageName") || "";

  const baggagePrice =
    params.get("baggagePrice") || "0";

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

      if (!did) {
        toast.error(
          "Booking Detail ID is missing."
        );
        return;
      }

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

        pcn =
          normalizedPassportCountry;

        nat = residence;
      }

      /* =========================
   DISPLAY PRICES
========================= */

const basePrice = Number(price) || 0;

const selectedSeatPrice =
  Number(seatPrice) || 0;

const selectedMealPrice =
  Number(mealPrice) || 0;

const selectedBaggagePrice =
  Number(baggagePrice) || 0;

const displayTotal =
  basePrice +
  selectedSeatPrice +
  selectedMealPrice +
  selectedBaggagePrice;

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

            /*
             * Currently supporting Adult.
             *
             * If you later add Child/Infant,
             * this should come from passenger form.
             */
            pxt: "Adult",

            dob:
              `${dob}T00:00:00`,

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
              /* =====================
                 SEAT
              ===================== */

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

              /* =====================
                 MEAL
              ===================== */

              ...(mealCode
                ? [
                    {
                      type:
                        "Meal",

                      triptype:
                        "Oneway",

                      code:
                        mealCode,
                    },
                  ]
                : []),

              /*
               * IMPORTANT:
               *
               * Baggage is intentionally NOT
               * added to Bonton SSR yet.
               *
               * We need to confirm the exact
               * Bonton SSR type/code structure
               * from the Bonton SSR response.
               *
               * Do NOT guess:
               *
               * {
               *   type: "Baggage"
               * }
               *
               * until Bonton documentation/
               * response confirms it.
               */
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

        email:
          email.trim().toLowerCase(),

        cno:
          phone.trim(),

        /*
         * This is the phone country code.
         *
         * It is NOT derived from
         * residence.
         */
        cc:
          phoneCountryCode,

        /*
         * Local calculated total.
         *
         * Bonton Book payload itself
         * does not document totalPrice
         * as a request field, so be aware
         * that your backend may strip or
         * ignore this field before sending
         * to Bonton.
         */
        totalPrice: displayTotal,
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
        "==============================================="
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

      console.log(
        "Phone Country Code:",
        phoneCountryCode
      );

      console.log(
        "Seat:",
        {
          code: seatCode,
          number: seatNumber,
          price: selectedSeatPrice,
        }
      );

      console.log(
        "Meal:",
        {
          code: mealCode,
          name: mealName,
          price: selectedMealPrice,
        }
      );

      console.log(
        "Baggage:",
        {
          code: baggageCode,
          name: baggageName,
          price: selectedBaggagePrice,
        }
      );

      console.log(
        "Base Price:",
        basePrice
      );

      console.log(
        "Calculated Total:",
        totalPrice: displayTotal,
      );

      /* =========================
         CREATE JETLY BOOKING
      ========================= */

      const booking =
        await createBooking({
          bookingType:
            "FLIGHT",

          passengerName:
            `${title} ${firstName} ${lastName}`,

          passengerAge:
            Number(age),

          passengerPhone:
            phone,

          passengerEmail:
            email,

          /*
           * Keep your existing Jetly
           * booking service price.
           *
           * The complete selected
           * amount is available in
           * bontonPayload.totalPrice.
           */
          totalPrice:
            Number(price),

          /*
           * Save the complete
           * Bonton booking payload.
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

    if (loading) {
      return;
    }

    const ok =
      window.confirm(
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
     DISPLAY TOTAL
  ========================= */

  const displayTotal =
    (Number(price) || 0) +
    (Number(seatPrice) || 0) +
    (Number(mealPrice) || 0) +
    (Number(baggagePrice) || 0);

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

        <div className="bg-slate-800 rounded-xl p-6 space-y-4 shadow-xl">

          {/* PASSENGER */}

          <p>
            <b>Passenger:</b>{" "}
            {title} {firstName} {lastName}
          </p>

          {/* AIRLINE */}

          <p>
            <b>Airline:</b>{" "}
            {airline}
          </p>

          {/* DURATION */}

          <p>
            <b>Duration:</b>{" "}
            {duration || "—"}
          </p>

          {/* TICKET PRICE */}

          <p>
            <b>Ticket Price:</b>{" "}
            ₹{basePrice}
          </p>

          <hr className="border-slate-600" />

          {/* =====================
              DOCUMENT
          ===================== */}

          <p>
            <b>{documentLabel}:</b>{" "}

            {residence === "IN"
              ? pan || "Not provided"
              : passportNumber ||
                "Not provided"}
          </p>

          <hr className="border-slate-600" />

          {/* =====================
              SEAT
          ===================== */}

          <p>
            <b>Seat:</b>{" "}
            {seatNumber ||
              "Not Selected"}
          </p>

          <p>
            <b>Seat Price:</b>{" "}
            ₹{selectedSeatPrice}
          </p>

          <hr className="border-slate-600" />

          {/* =====================
              MEAL
          ===================== */}

          <p>
            <b>Meal:</b>{" "}
            {mealName ||
              "No Meal"}
          </p>

          <p>
            <b>Meal Price:</b>{" "}
            ₹{selectedMealPrice}
          </p>

          <hr className="border-slate-600" />

          {/* =====================
              BAGGAGE
          ===================== */}

          <p>
            <b>Baggage:</b>{" "}
            {baggageName ||
              "No Extra Baggage"}
          </p>

          <p>
            <b>Baggage Price:</b>{" "}
            ₹{selectedBaggagePrice}
          </p>

          <hr className="border-slate-600" />

          {/* =====================
              TOTAL
          ===================== */}

          <div className="flex items-center justify-between">

            <p className="text-lg">
              <b>Total:</b>
            </p>

            <p className="text-2xl font-bold text-green-400">
              ₹{displayTotal}
            </p>

          </div>

        </div>

        {/* =====================
            PAYMENT INFO
        ===================== */}

        <div className="mt-6 bg-blue-950/40 border border-blue-900 rounded-xl p-4">

          <p className="text-sm text-blue-200">
            Your booking will be created first.
            You will then be redirected to the
            secure Razorpay payment page.
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
            className="
              mt-8
              bg-blue-600
              hover:bg-blue-700
              px-8
              py-3
              rounded-lg
              font-semibold
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            {loading
              ? "Creating Booking..."
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