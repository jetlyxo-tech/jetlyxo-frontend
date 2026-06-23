export type Flight = {
    id: number;
    airline: string;
    fromCity: string;
    toCity: string;
    departure: string;
    arrival: string;
    duration: string;
    price: number;
    seats?: number;
  };