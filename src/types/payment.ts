export interface Payment {
    bookingId: number;
  
    amount: number;
  
    paymentMethod: string;
  
    status: "Pending" | "Success" | "Failed";
  
    transactionId?: string;
  }