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
import FlightAnimation from "@/components/FlightAnimation";
import type { Bus } from "@/types/bus";
import type { Train } from "@/types/train";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { searchBuses, searchTrains } from "@/lib/api";
export default function Home() {
  
  const router = useRouter();

  const resultsRef = useRef<HTMLDivElement>(null);
  const [flightResults, setFlightResults] = useState<any[] | null>(null);

  useEffect(() => {
    console.log("flightResults changed:", flightResults);
  }, [flightResults]);
  
  const [busResults, setBusResults] = useState<Bus[] | null>(null);
  const [trainResults, setTrainResults] = useState<Train[] | null>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOffer, setShowOffer] = useState(true);

  const [loadingService, setLoadingService] = useState<
  "flights" | "buses" | "trains" | null
>(null);

const [selectedService, setSelectedService] = useState<
  "flights" | "buses" | "trains" | null
>(null);

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
      
        operator: bus.operator ?? "",
      
        busType: bus.busType ?? "",
      
        duration: bus.duration ?? "",
      
        seatsAvailable: bus.seatsAvailable ?? bus.seats ?? 0,
      
        busName: bus.busName ?? bus.operator,
      
        fromCity: bus.fromCity,
      
        toCity: bus.toCity,
      
        departure: bus.departure,
      
        arrival: bus.arrival,
      
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
      
        trainNumber: train.trainNumber,
      
        trainName: train.trainName,
      
        fromCity: train.fromCity,
      
        toCity: train.toCity,
      
        departure: train.departure,
      
        arrival: train.arrival,
      
        duration: train.duration ?? "",
      
        seatsAvailable: train.seatsAvailable ?? train.seats ?? 0,
      
        price: train.price,
      
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
   
 
     
     <Hero>
  <Services
    onFlightsClick={() => {
  setSelectedService("flights");

  setFlightResults(null);
  setBusResults(null);
  setTrainResults(null);
  setLoadingService(null);

  setTimeout(() => {
    document.getElementById("search")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}}
    onBusesClick={() => {
      setSelectedService("buses");
      handleBusesClick();

      setTimeout(() => {
        document.getElementById("search")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }}
    onTrainsClick={() => {
      setSelectedService("trains");
      handleTrainsClick();

      setTimeout(() => {
        document.getElementById("search")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }}
  />
</Hero>

{selectedService === "flights" && (
  <div id="search" className="container mx-auto px-4 py-8">
    <SearchWidget
      service="flights"
      onFlightResultsAction={(results) => {
        setFlightResults(results);
        setBusResults(null);
        setTrainResults(null);
      }}
      onScrollToResultsAction={scrollToResults}
    />
  </div>
)}

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


      <FlightAnimation />

    </main>
  );
}