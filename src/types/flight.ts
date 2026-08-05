export interface Flight {
  // Common
  id: string | number;

  provider?: "AMADEUS" | "BONTON";

  airline: string;
  flightNumber?: string;

  from?: string;
  to?: string;

  fromCity?: string;
  toCity?: string;

  departure?: string;
  arrival?: string;

  duration: string;

  price: number;

  currency?: string;

  seats?: number;

  stops?: number;

  refundable?: boolean;

  cabin?: string;

  baggage?: {
    cabin?: string;
    checkin?: string;
  };

  airlineRemarks?: string;

  // Bonton identifiers
  searchId?: string;
  traceId?: string;
  tId?: string;
  searchKey?: string;

  // Existing fields
  createdAt?: string;
  cachedAt?: string;
}

export type TripType = "ONE_WAY" | "ROUND_TRIP";

export type CabinClass =
  | "ECONOMY"
  | "PREMIUM_ECONOMY"
  | "BUSINESS"
  | "FIRST";

export interface FlightSearchParams {
  from: string;
  to: string;

  departureDate: string;
  returnDate?: string;

  travellers?: number;
  children?: number;
  infants?: number;

  cabin?: CabinClass;

  fareType?: string;

  tripType?: TripType;
}