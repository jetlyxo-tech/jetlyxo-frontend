import { Bus } from "./bus";
import { Flight } from "./flight";
import { Passenger } from "./passenger";
import { Train } from "./train";

export type BookingType =
  | "flight"
  | "bus"
  | "train";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface Booking {
  id: number;

  bookingType: BookingType;

  status: BookingStatus;

  totalPrice: number;

  createdAt: string;

  updatedAt?: string;

  pnr?: string;

  passenger?: Passenger;

  passengerName?: string;

  flight?: Flight | null;

  bus?: Bus | null;

  train?: Train | null;
}