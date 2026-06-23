export type Train = {
    id: number;
    trainNumber: string;
    trainName: string;
    fromCity: string;
    toCity: string;
    departure: string;
    arrival: string;
    price: number;
    seats?: number;
  };