"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchFlights, searchBuses, searchTrains } from "@/lib/api";
import { getToken } from "@/lib/auth";
function ResultsPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const type =
    (params.get("type") as "flight" | "bus" | "train") || "flight";

  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);

        let data: any[] = [];

        if (type === "flight") {
          data = await searchFlights({ from, to });
        } else if (type === "bus") {
          data = await searchBuses({ from, to });
        } else {
          data = await searchTrains({ from, to });
        }

        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load results:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [type, from, to]);

  

const handleBookNow = (item: any) => {
  let target = "";

  if (type === "flight") {
    target =
      `/flight-passenger?flightId=${item.id}` +
      `&price=${item.price || 0}` +
      `&airline=${encodeURIComponent(
        item.airline || item.name || "Flight"
      )}` +
      `&duration=${encodeURIComponent(item.duration || "")}`;
  }

  else if (type === "bus") {
    target =
      `/bus-passenger?busId=${item.id}` +
      `&price=${item.price || 0}` +
      `&operator=${encodeURIComponent(
        item.busName || item.operator || "Bus"
      )}` +
      `&duration=${encodeURIComponent(
        item.duration || item.departure || ""
      )}`;
  }

  else {
    target =
      `/train-passenger?trainId=${item.id}` +
      `&price=${item.price || 0}` +
      `&trainName=${encodeURIComponent(
        item.trainName || item.name || "Train"
      )}` +
      `&duration=${encodeURIComponent(
        item.duration || item.departure || ""
      )}`;
  }

  const token = getToken();

  if (!token) {
    router.push(
      `/login?redirect=${encodeURIComponent(target)}`
    );
    return;
  }

  router.push(target);
};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading results...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          {type.toUpperCase()} Results: {from} → {to}
        </h1>

        {results.length === 0 && (
          <p className="text-gray-400">No results found</p>
        )}

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={result.id || index}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="text-lg font-semibold">
                  {type === "flight" &&
                    (result.airline || result.name)}
                  {type === "bus" &&
                    (result.busName || result.operator)}
                  {type === "train" &&
                    (result.trainName || result.name)}
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  {result.fromCity || result.from || from} →{" "}
                  {result.toCity || result.to || to}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="font-bold text-lg">
                  ₹{result.price}
                </p>

                <button
                  type="button"
                  onClick={() => handleBookNow(result)}
                  className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg w-full sm:w-auto"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}