"use client";

import { Sparkles, Send } from "lucide-react";
import { useState } from "react";

interface Props {
  onApplyFilter: (query: string) => void;
}

export default function SmartFilters({
  onApplyFilter,
}: Props) {
  const [query, setQuery] = useState("");

  const suggestions = [
    "Non Stop",
    "Cheapest",
    "Morning",
    "Evening",
    "Shortest",
    "Premium",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="text-blue-400" />

        <div>
          <h3 className="font-semibold text-white">
            Smart Filters
          </h3>

          <p className="text-xs text-gray-400">
            Powered by Jetly AI
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your flight preference"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
        />

        <button
          onClick={() => onApplyFilter(query)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <Send size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            onClick={() => onApplyFilter(item)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:border-blue-400"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}