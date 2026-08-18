import { Bus } from "./bus";
import { Flight } from "./flight";
import { Passenger } from "./passenger";
import { Train } from "./train";


export type BookingType =
  | "FLIGHT"
  | "BUS"
  | "TRAIN";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface BookingFlightData {
  orgcty?: string;
  orgapc?: string;

  dstcty?: string;
  dstapc?: string;

  airnm?: string;
  aircd?: string;
  fltno?: string;

  dur?: string;

  dptm?: string;
  artm?: string;

  brn?: string;
  pnr?: string;

  trv?: Array<{
    fnm?: string;
    lnm?: string;
    pfx?: string;
    tno?: string;
  }>;

  mbg?: Array<{
    ssr_type?: string;
    ssr_info?: string;
    ssr_amount?: number;
  }>;

  prcd?: {
    crncy?: string;
    bfr?: number;
    txf?: number;
    np?: number;
  };
}

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

  // Bonton flight booking data
  flightData?: BookingFlightData | null;

  // Original Bonton booking payload
  bontonPayload?: any;
}