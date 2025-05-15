import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export interface OrderOptions {
  amount: number; // in paise (100 paise = ₹1)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface OrderResponse {
  id: string;
  entity: string;
  amount: number | string; // Razorpay can return this as string or number
  amount_paid: number | string;
  amount_due: number | string;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export async function createOrder(
  options: OrderOptions,
): Promise<OrderResponse> {
  try {
    console.log(
      "Creating Razorpay order with options:",
      JSON.stringify(options),
    );
    console.log(
      "Using Razorpay credentials - Key ID:",
      process.env.RAZORPAY_KEY_ID,
    );
    // Don't log the full secret, just the first few characters for verification
    console.log(
      "Using Razorpay credentials - Key Secret (first 4 chars):",
      process.env.RAZORPAY_KEY_SECRET
        ? process.env.RAZORPAY_KEY_SECRET + "..."
        : "not set",
    );

    const order = (await razorpay.orders.create(options)) as OrderResponse;
    console.log("Razorpay order created successfully:", order.id);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new Error("Failed to create payment order");
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  try {
    console.log("Verifying payment signature:", {
      orderId,
      paymentId,
      hasSignature: !!signature,
      hasSecretKey: !!process.env.RAZORPAY_KEY_SECRET
    });
    
    if (!orderId || !paymentId || !signature) {
      console.error("Missing required parameters for signature verification");
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    
    const isValid = expectedSignature === signature;
    console.log(`Signature verification result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    return isValid;
  } catch (error) {
    console.error("Error during signature verification:", error);
    return false;
  }
}

export function getRazorpayConfig() {
  console.log("Razorpay Key ID used:", process.env.RAZORPAY_KEY_ID);
  return {
    key_id: process.env.RAZORPAY_KEY_ID,
  };
}

export default razorpay;
