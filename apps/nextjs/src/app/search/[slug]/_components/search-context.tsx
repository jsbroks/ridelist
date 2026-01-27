"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

export interface HoveredRide {
  id: string;
  routeGeometry: GeoJSON.LineString;
  fromName: string;
  toName: string;
}

interface SearchContextValue {
  hoveredRide: HoveredRide | null;
  setHoveredRide: (ride: HoveredRide | null) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [hoveredRide, setHoveredRide] = useState<HoveredRide | null>(null);

  return (
    <SearchContext.Provider value={{ hoveredRide, setHoveredRide }}>
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
