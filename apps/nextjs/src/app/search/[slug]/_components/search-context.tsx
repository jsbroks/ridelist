"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

export interface HoveredTrip {
  id: string;
  routeGeometry: GeoJSON.LineString;
  fromName: string;
  toName: string;
}

interface SearchContextValue {
  hoveredTrip: HoveredTrip | null;
  setHoveredTrip: (trip: HoveredTrip | null) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [hoveredTrip, setHoveredTrip] = useState<HoveredTrip | null>(null);

  return (
    <SearchContext.Provider value={{ hoveredTrip, setHoveredTrip }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
}
