export interface Train {
  id: number;

  trainNumber: string;

  trainName: string;

  fromCity: string;

  toCity: string;

  departure: string;

  arrival: string;

  duration: string;

  price: number;

  seatsAvailable: number;

  availableSeats?: number;

  coachType?: string;

  platform?: string;

  runningDays?: string[];

  rating?: number;

  createdAt?: string;

  updatedAt?: string;
}