export type Bus = {
    // types/bus.ts
id: number;
    busName: string;
    fromCity: string;
    toCity: string;
    departure: string;
    arrival: string;
    price: number;
    seats?: number;
  };