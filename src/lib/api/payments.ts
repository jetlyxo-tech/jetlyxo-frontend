import { AxiosError } from "axios";

import apiClient from "@/lib/apiClient";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order: RazorpayOrder;
}

export interface VerifyPaymentRequest {
  bookingId: number | string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function createOrder(
  bookingId: number | string
): Promise<CreateOrderResponse> {
  try {
    const response = await apiClient.post(
      "/payment/create-order",
      {
        bookingId,
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Create Order Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to create payment order"
    );
  }
} 

export async function verifyPayment(
  data: VerifyPaymentRequest
) {
  try {
    const response = await apiClient.post(
      "/payment/verify",
      data
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Verify Payment Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Payment verification failed"
    );
  }
}

export async function markPaymentFailed(
  bookingId: number | string
) {
  try {
    const response = await apiClient.post(
      "/payment/mark-failed",
      {
        bookingId,
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<{
      message?: string;
    }>;

    console.error(
      "Mark Payment Failed Error:",
      err.response?.data || err.message
    );

    throw new Error(
      err.response?.data?.message ??
        "Failed to update payment status"
    );
  }
}