"use client";

import { useState, useEffect } from "react";

type Location = {
  id: number;
  name: string;
  lat: string;
  lon: string;
};

export default function LocationInput({
  placeholder,
  onSelect,
}: {
  placeholder: string;
  onSelect: (loc: Location) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length < 2) return;

      fetch(`/api/location/search?query=${query}`)
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch(() => setResults([]));
    }, 300); // debounce

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        className="w-full border p-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <div className="text-sm mt-1">Loading...</div>}

      {results.length > 0 && (
        <div className="absolute z-10 bg-white border w-full mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setQuery(item.name);
                setResults([]);
                onSelect(item);
              }}
              className="p-3 hover:bg-blue-50 cursor-pointer text-sm"
            >
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}