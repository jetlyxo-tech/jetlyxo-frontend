"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRightLeft, X } from "lucide-react";
import { searchFlights } from "@/lib/api";
import type { Flight } from "@/types";   

type Tab = "one-way" | "round-trip" | "multi-city";

const TABS = [
  { id: "one-way", label: "One Way" },
  { id: "round-trip", label: "Round Trip" },
  { id: "multi-city", label: "Multi City" },
] as const;

type Props = {
  onFlightResults?: (results: Flight[]) => void;
  onScrollToResults?: () => void;
  onFlightResultsAction?: (results: Flight[]) => void;
  onScrollToResultsAction?: () => void;
};

export default function SearchWidget({
  onFlightResults,
  onScrollToResults,
  onFlightResultsAction,
  onScrollToResultsAction,
}: Props) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const [activeTab, setActiveTab] = useState<Tab>("one-way");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travellers, setTravellers] = useState(1);
  const [cabin, setCabin] = useState("economy");
  const [selectedFare, setSelectedFare] = useState("Regular");

  const publish = (results: Flight[]) => {
    onFlightResults?.(results);
    onFlightResultsAction?.(results);
  };

  const scroll = () => {
    onScrollToResults?.();
    onScrollToResultsAction?.();
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({coords})=>{
      try{
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
        const j = await r.json();
        setFrom(j.address?.city || j.address?.town || j.address?.state || "");
      }catch{}
    });
  },[]);

  async function handleSearch(e?:React.FormEvent){
    e?.preventDefault();
    setLoading(true);
    setError("");

    try{
      fetch(`${API_BASE}/behavior/track`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"SEARCH",metadata:{from,to}})
      }).catch(()=>{});

      const params = {
        from,
        to,
        departureDate: departure,
        travellers,
        children: 0,
        infants: 0,
        cabin,
        fareType: selectedFare,
        tripType:
          activeTab === "one-way"
            ? "ONE_WAY"
            : "ROUND_TRIP",
      };

      const results = await searchFlights(params as any);

      console.log("Flights returned",results);

      publish(results);

      if(results.length===0){
        setError("No flights found.");
      }

      scroll();

    }catch(err:any){
      console.error(err);
      setError(err.message || "Search failed");
    }finally{
      setLoading(false);
    }
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-card p-6 rounded-2xl">

          <div className="flex gap-2 mb-6">
            {TABS.map(tab=>(
              <button
                key={tab.id}
                type="button"
                onClick={()=>setActiveTab(tab.id)}
                className={activeTab===tab.id?"px-4 py-2 rounded bg-blue-600 text-white":"px-4 py-2 rounded bg-slate-700 text-white"}>
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="grid md:grid-cols-2 gap-4">

            <div className="relative">
              <MapPin className="absolute left-3 top-3" size={18}/>
              <input
                className="w-full pl-10 p-3 rounded bg-slate-800 text-white"
                placeholder="From"
                value={from}
                onChange={e=>setFrom(e.target.value)}
              />
              {from && (
                <button type="button" onClick={()=>setFrom("")} className="absolute right-3 top-3">
                  <X size={16}/>
                </button>
              )}
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3" size={18}/>
              <input
                className="w-full pl-10 p-3 rounded bg-slate-800 text-white"
                placeholder="To"
                value={to}
                onChange={e=>setTo(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={()=>{
                const tmp=from;
                setFrom(to);
                setTo(tmp);
              }}
              className="md:col-span-2 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <ArrowRightLeft size={18}/>
            </button>

            <input type="date" value={departure} onChange={e=>setDeparture(e.target.value)} className="p-3 rounded bg-slate-800 text-white"/>
            {activeTab!=="one-way" ? (
              <input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} className="p-3 rounded bg-slate-800 text-white"/>
            ) : <div />}

            <select value={travellers} onChange={e=>setTravellers(Number(e.target.value))} className="p-3 rounded bg-slate-800 text-white">
              {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
            </select>

            <select value={cabin} onChange={e=>setCabin(e.target.value)} className="p-3 rounded bg-slate-800 text-white">
              <option value="economy">Economy</option>
              <option value="business">Business</option>
            </select>

            <div className="md:col-span-2 flex gap-2 flex-wrap">
              {["Regular","Student","Defence","Business","Senior","Medical"].map(f=>(
                <button
                  key={f}
                  type="button"
                  onClick={()=>setSelectedFare(f)}
                  className={selectedFare===f?"px-3 py-2 rounded bg-blue-600":"px-3 py-2 rounded bg-slate-700"}>
                  {f}
                </button>
              ))}
            </div>

            <button type="submit" disabled={loading} className="md:col-span-2 p-4 rounded bg-blue-600 text-white">
              {loading ? "Searching..." : "Search Flights"}
            </button>

            {error && <p className="md:col-span-2 text-red-400">{error}</p>}
          </form>

        </motion.div>
      </div>
    </section>
  );
}

