import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layouts/navbar";
import { RazorpayConfig } from "@/lib/types";
import { planDetails } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payment() {
  const [, params] = useRoute("/pay");
  const [searchParams] = useLocation();
  const urlParams = new URLSearchParams(searchParams);
  
  const orderId = urlParams.get("orderId");
  const amount = urlParams.get("amount");
  const type = urlParams.get("type") as "monthly" | "yearly";
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [razorpay, setRazorpay] = useState<any>(null);
  
  // Validate the type parameter
  const validType = type === "monthly" || type === "yearly" ? type : "monthly";
  const safeType = validType in planDetails ? validType : "monthly";
  
  const { data: razorpayConfig, isLoading: isLoadingConfig } = useQuery<RazorpayConfig>({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/razorpay-config`],
  });

  // Load Razorpay script dynamically
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        document.body.appendChild(script);
      });
    };

    // Store payment details in localStorage
    if (orderId) localStorage.setItem("currentOrderId", orderId);
    if (amount) localStorage.setItem("currentOrderAmount", amount);
    if (safeType) localStorage.setItem("currentOrderType", safeType);

    // Load the Razorpay script
    loadRazorpayScript();
  }, [orderId, amount, safeType]);

  const handlePayment = () => {
    if (!razorpayConfig?.key_id) {
      toast({
        title: "Configuration Error",
        description: "Payment gateway configuration is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // Get values from URL or localStorage as fallback
    const effectiveOrderId = orderId || localStorage.getItem("currentOrderId");
    const effectiveAmount = amount || localStorage.getItem("currentOrderAmount");
    
    if (!effectiveOrderId || !effectiveAmount) {
      toast({
        title: "Payment Error",
        description: "Missing payment details. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    // Make sure Razorpay is available
    if (typeof window.Razorpay === 'undefined') {
      toast({
        title: "Payment Error",
        description: "Payment gateway is not loaded. Please refresh the page.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    // Convert amount to number (ensure it's an integer)
    let paymentAmount: number;
    try {
      paymentAmount = parseInt(effectiveAmount as string, 10);
      if (isNaN(paymentAmount)) throw new Error("Invalid amount");
      console.log("Amount for payment:", paymentAmount);
    } catch (error) {
      console.error("Amount parsing error:", error);
      toast({
        title: "Payment Error", 
        description: "Invalid amount format", 
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    // Get hotel owner ID
    const hotelOwnerId = localStorage.getItem("demoHotelOwnerId") || "";
    
    // Get preferred payment method (if any)
    const preferredPaymentMethod = localStorage.getItem("preferredPaymentMethod");
    
    // Log payment details
    console.log("Payment parameters:", {
      key: razorpayConfig.key_id,
      amount: paymentAmount,
      orderId: effectiveOrderId,
      hotelOwnerId,
      preferredMethod: preferredPaymentMethod
    });

    // Create Razorpay options
    const options: any = {
      key: razorpayConfig.key_id,
      amount: paymentAmount,
      currency: "INR",
      name: "HotelHub",
      description: `${planDetails[safeType].name} Subscription`,
      order_id: effectiveOrderId,
      prefill: {
        name: "Hotel Owner",
        email: "owner@example.com",
        contact: "9999999999"  // Default contact number for better compatibility
      },
      handler: function(response: any) {
        console.log("Payment successful, response:", response);
        verifyPayment(response);
      },
      theme: {
        color: "#3B82F6"
      }
    };

    // Add method configuration if we have a preferred payment method
    if (preferredPaymentMethod) {
      options.method = {
        netbanking: preferredPaymentMethod === 'NetBanking',
        card: preferredPaymentMethod === 'Card',
        upi: preferredPaymentMethod === 'UPI',
        wallet: false
      };
    }

    // Initialize Razorpay with minimal options
    try {
      const razorpayInstance = new window.Razorpay(options);
      
      // Define error handler
      razorpayInstance.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        setPaymentError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      // Open Razorpay
      razorpayInstance.open();
      
      // Save instance reference
      setRazorpay(razorpayInstance);
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      setPaymentError("Failed to initialize payment gateway. Please try again.");
      setIsProcessing(false);
    }
  };

  // Handle payment verification
  const verifyPayment = async (response: any) => {
    try {
      const hotelOwnerId = localStorage.getItem("demoHotelOwnerId") || "";
      
      // Create verification payload
      const verificationData = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        hotelOwnerId
      };
      
      console.log("Verifying payment:", verificationData);

      // Send verification request
      const res = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/verify-payment`, verificationData);
      const data = await res.json();
      
      if (data.success) {
        console.log("Payment verified successfully");
        
        // Clear payment data from localStorage
        localStorage.removeItem("currentOrderId");
        localStorage.removeItem("currentOrderAmount");
        localStorage.removeItem("currentOrderType");
        
        // Navigate to success page
        navigate("/payment-success");
      } else {
        throw new Error(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setPaymentError("Payment verification failed. Please contact support.");
      toast({
        title: "Payment Error",
        description: "We couldn't verify your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto mt-16 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading Payment Details</CardTitle>
              <CardDescription>Please wait while we prepare your payment...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto mt-16 px-4">
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-xl text-blue-700">Complete Your Payment</CardTitle>
            <CardDescription>
              Subscribe to the {planDetails[safeType].name} plan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Plan</span>
                  <span className="text-sm font-bold">{planDetails[safeType].name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Amount</span>
                  <span className="text-sm font-bold">{planDetails[safeType].amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700">Duration</span>
                  <span className="text-sm font-bold">{planDetails[safeType].duration}</span>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Payment Information</h3>
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    Your payment will be processed securely via Razorpay
                  </span>
                </div>
              </div>
              
              {paymentError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200">
                  {paymentError}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-lg">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Proceed to Pay"}
            </Button>
            <Link href="/" className="text-center w-full text-sm text-blue-600 hover:text-blue-800">
              Cancel and Return to Dashboard
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}