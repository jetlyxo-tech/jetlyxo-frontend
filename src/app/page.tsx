"use client";

import { useRef, useState, useCallback, useEffect } from "react";

import Hero from "@/components/Hero";
import Services from "@/components/Services";
import SearchWidget from "@/components/SearchWidget";
import FlightResults from "@/components/FlightResults";
import BusResults from "@/components/BusResults";
import TrainResults from "@/components/TrainResults";
import TrendingDestinations from "@/components/TrendingDestinations";
import Deals from "@/components/Deals";
import Features from "@/components/Features";
import Trust from "@/components/Trust";

import AIAssistant from "@/components/AIAssistant";
import FlightAnimation from "@/components/FlightAnimation";
import { getToken } from "@/lib/auth";


import type { Bus } from "@/types/bus";
import type { Train } from "@/types/train";
import { useRouter } from "next/navigation";


import { searchFlights,searchBuses, searchTrains } from "@/lib/api";

export default function Home() {
  
  const router = useRouter();

  const resultsRef = useRef<HTMLDivElement>(null);
  const [flightResults, setFlightResults] = useState<any[] | null>(null);


  const [busResults, setBusResults] = useState<Bus[] | null>(null);
  const [trainResults, setTrainResults] = useState<Train[] | null>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
const [showOffer, setShowOffer] = useState(true);

const [showBot, setShowBot] = useState(true);
const [openChat, setOpenChat] = useState(false);
  const [loadingService, setLoadingService] =
    useState<"flights" | "buses" | "trains" | null>(null);

  const [requestLock, setRequestLock] = useState(false);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  



  /* =========================
     DEDUPE
  ========================= */
  const dedupe = <T extends { id?: string | number }>(data: T[]): T[] => {
    return Array.from(new Map(data.map(i => [i.id, i])).values());
  };

  /* =========================
     FLIGHTS
  ========================= */
  const handleFlightsClick = useCallback(async () => {


    
    // ✅ AUTH CHECK (TOP)
    //const token = localStorage.getItem("jetly_token");
    const token = getToken();
    if (!token) {
      localStorage.setItem("redirectAfterLogin", "/");
      router.push("/login");
      return;
    }
  
    if (requestLock) return;
    setRequestLock(true);
  
    setBusResults(null);
    setTrainResults(null);
    setLoadingService("flights");
  
    try {
      const results = await searchFlights({});
  
      const formatted = results.map((flight: any) => ({
        ...flight,
        id: Number(flight.id),
  
        airline: flight.airline ?? flight.carrier ?? "Unknown Airline",
  
        from: flight.from ?? flight.fromCity ?? "N/A",
        to: flight.to ?? flight.toCity ?? "N/A",
  
        departureTime: flight.departureTime ?? flight.departure ?? "",
        arrivalTime: flight.arrivalTime ?? flight.arrival ?? "",
  
        price: flight.price ?? 0,
        seats: flight.seats,
      }));
  
      setFlightResults(dedupe(formatted));
  
    } catch {
      setFlightResults([]);
    } finally {
      scrollToResults();
      setLoadingService(null);
      setRequestLock(false);
    }
  
  }, [scrollToResults, requestLock, router]);
  /* =========================
     BUSES
  ========================= */
  const handleBusesClick = useCallback(async () => {
    //const token = localStorage.getItem("jetly_token");
    const token = getToken();
  if (!token) {
    localStorage.setItem("redirectAfterLogin", "/");
    router.push("/login");
    return;
  }
    if (requestLock) return;
    setRequestLock(true);

    setFlightResults(null);
    setTrainResults(null);
    setLoadingService("buses");

    try {
      const results = await searchBuses({
        from: "BLR",
        to: "HYD"
      });

      const formatted: Bus[] = results.map((bus: any) => ({
        id: Number(bus.id),
        busName: bus.busName ?? bus.operator ?? "Unknown Bus",

         fromCity: bus.fromCity ?? bus.from,
         toCity: bus.toCity ?? bus.to,
          departure: bus.departure ?? bus.departureTime,
          arrival: bus.arrival ?? bus.arrivalTime,
          price: bus.price,
          seats: bus.seats,
        }));
  

      setBusResults(dedupe(formatted));

    } catch {
      setBusResults([]);
    } finally {
      scrollToResults();
      setLoadingService(null);
      setRequestLock(false);
    }

  }, [scrollToResults, requestLock, router]);

  /* =========================
     TRAINS
  ========================= */
  const handleTrainsClick = useCallback(async () => {

    //const token = localStorage.getItem("jetly_token");
    const token = getToken();
  if (!token) {
    localStorage.setItem("redirectAfterLogin", "/");
    router.push("/login");
    return;
  }

    if (requestLock) return;
    setRequestLock(true);

    setFlightResults(null);
    setBusResults(null);
    setLoadingService("trains");

    try {
      const results = await searchTrains({
        from: "BLR",
        to: "MAA"
      });

      const formatted: Train[] = results.map((train: any) => ({
        id: Number(train.id),
    
        trainNumber: train.trainNumber ?? train.number ?? "N/A",
        trainName: train.trainName ?? train.name ?? "Unknown Train",
      
        fromCity: train.fromCity ?? train.from ?? "N/A",
        toCity: train.toCity ?? train.to ?? "N/A",
      
        departure: train.departure ?? train.departureTime ?? "",
        arrival: train.arrival ?? train.arrivalTime ?? "",
      
        price: train.price ?? 0,
        seats: train.seats,
      }));
      setTrainResults(dedupe(formatted));

    } catch {
      setTrainResults([]);
    } finally {
      scrollToResults();
      setLoadingService(null);
      setRequestLock(false);
    }

  }, [scrollToResults, requestLock, router]);

  return (
    <main className="min-h-screen bg-navy-950">

     
      <Hero />

      {showOffer && (
   <div className="fixed left-3 right-3 sm:left-5 sm:right-auto top-24 bg-white text-black p-4 rounded-xl shadow-lg w-auto sm:w-[250px] z-40">

    <button
      onClick={() => setShowOffer(false)}
      className="absolute top-1 right-2 text-sm"
    >
      ✕
    </button>

    <h3 className="font-bold text-sm mb-2">
      ✈️ Special Offer
    </h3>

    <p className="text-sm">
      Get up to <span className="font-semibold">40% OFF</span> on flights
    </p>

    <button className="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm">
      View Deals
    </button>

  </div>
)}


      <Services
        onFlightsClick={handleFlightsClick}
        onBusesClick={handleBusesClick}
        onTrainsClick={handleTrainsClick}
      />

<SearchWidget
  onFlightResultsAction={(results) => {
    setBusResults(null);
    setTrainResults(null);
    setFlightResults(results);
  }}
  onScrollToResultsAction={scrollToResults}
/>

      <section
        ref={resultsRef}
        className="py-8 px-3 sm:px-4 container mx-auto max-w-4xl"
      >

        {loadingService && (
          <p className="text-center text-jetly-accent py-4">
            Loading {loadingService}...
          </p>
        )}

        {!loadingService && flightResults !== null && (
          <FlightResults flights={flightResults} />
        )}

        {!loadingService && busResults !== null && (
          <BusResults buses={busResults} />
        )}

        {!loadingService && trainResults !== null && (
          <TrainResults trains={trainResults} />
        )}

      </section>

      <TrendingDestinations />
      <Deals />
      <Features />
      <Trust />
    

      {showLoginModal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    
    <div className="bg-white text-black rounded-xl p-6 w-full max-w-sm mx-4">

      {/* Close button */}
      <button
        onClick={() => setShowLoginModal(false)}
        className="absolute top-2 right-3 text-xl"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-4">
        Login / Signup
      </h2>

      <input
        placeholder="+91 Enter Mobile Number"
        className="w-full border p-2 rounded mb-3"
      />

<button className="w-full sm:w-auto bg-blue-600 py-3 px-6 rounded-lg">
        Continue
      </button>

      <p className="text-xs text-gray-500 mt-3">
        By continuing, you agree to Jetly Terms
      </p>
         
      <button className="absolute center">⇄</button>
    </div>
  </div>
)}

{showBot && (
  <div className="fixed bottom-20 right-4 sm:right-6 z-50">

    {/* Robot */}
    <div
      onClick={() => setOpenChat(true)}
      className="cursor-pointer animate-bounce bg-white p-3 rounded-full shadow-lg"
    >
      🤖
    </div>

    {/* Message bubble */}
    <div className="mt-2 bg-white text-black px-3 py-2 rounded-xl shadow text-sm">
      Hi 👋 Need help planning?
    </div>

  </div>
)}

      <AIAssistant />
      <FlightAnimation />

    </main>
  );
}