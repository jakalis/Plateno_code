// Type definitions for the application

export interface HotelOwner {
  id: string;
  name: string;
  description: string;
  location: string;
  qr_code_url: string;
  is_active: boolean;
  contact: unknown;
  service: unknown;
}

export interface Subscription {
  id: string;
  hotel_owner_id: string;
  plan_type: "monthly" | "yearly";
  start_date: string;
  end_date: string;
  razorpay_order_id: string;
  payment_status: "pending" | "paid" | "failed";
  amount: string;
  created_at: string;
}

export interface PaymentOptions {
  type: "monthly" | "yearly";
  hotelOwnerId: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  subscriptionId: string;
}

export interface RazorpayConfig {
  key_id: string;
}

// Razorpay window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}
