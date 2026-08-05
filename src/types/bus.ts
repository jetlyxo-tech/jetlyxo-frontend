export interface Bus {
  id: number;

  operator: string;

  busName?: string;

  busType: string;

  fromCity: string;

  toCity: string;

  departure: string;

  arrival: string;

  duration: string;

  price: number;

  seatsAvailable: number;

  availableSeats?: number;

  boardingPoint?: string;

  droppingPoint?: string;

  amenities?: string[];

  rating?: number;

  createdAt?: string;

  updatedAt?: string;
}