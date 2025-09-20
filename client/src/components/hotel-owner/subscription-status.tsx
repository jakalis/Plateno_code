import { HotelOwner, Subscription } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate, planDetails } from "@/lib/utils";
import { useLocation } from "wouter";
import { PaymentModal } from "@/components/hotel-owner/payment-modal";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { differenceInDays } from "date-fns";
import { APP_NAME, SLOGAN} from "@/pages/constants";

function getRemainingDaysText(date: string | Date) {
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return "Expired";
  if (days === 0) return "Expires Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

interface SubscriptionStatusProps {
  hotelOwner: HotelOwner;
  activeSubscription?: Subscription | null;
  onRefresh: () => void;
}

export default function SubscriptionStatus({
  hotelOwner,
  activeSubscription,
  onRefresh,
}: SubscriptionStatusProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [showDialog, setShowDialog] = useState(false);

  const handleCreatePayment = async () => {
    try {
      console.log(`Creating payment for ${selectedPlan} plan`);
      const res = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/create-payment`, {
        type: selectedPlan,
        hotelOwnerId: hotelOwner.id,
      });

      const data = await res.json();
      console.log("Payment creation response:", data);

      if (!data.orderId || !data.amount) {
        throw new Error("Invalid response from server - missing orderId or amount");
      }

      // Store all relevant information in localStorage
      localStorage.setItem("demoHotelOwnerId", hotelOwner.id);
      localStorage.setItem("currentOrderId", data.orderId);
      localStorage.setItem("currentOrderAmount", data.amount.toString());
      localStorage.setItem("currentOrderType", selectedPlan);

      // Navigate directly to Razorpay instead of our payment page
      const options = {
        key: "rzp_test_uieyjEuMbb1jGm", // Hardcoded key for reliability
        amount: data.amount,
        currency: "INR",
        name: {APP_NAME},
        description: `${planDetails[selectedPlan].name} Subscription`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Send verification to our backend
          try {
            console.log("Payment successful, verifying with backend:", response);

            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              hotelOwnerId: hotelOwner.id
            };

            // Call our verify-payment API
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verificationData),
              credentials: "include"
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              console.log("Payment verified successfully!");
              // Redirect to success page
              window.location.href = `/payment-success?paymentId=${response.razorpay_payment_id}`;
              // Refresh the page after a short delay to show updated subscription status
              setTimeout(() => onRefresh(), 2000);
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            toast({
              title: "Payment Error",
              description: "Payment was processed but verification failed. Please contact support.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: hotelOwner.name,
          email: hotelOwner.contact,
        },
        theme: {
          color: "#3399cc"
        }
      };

      // Use already loaded Razorpay directly
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      // Close the dialog
      setShowDialog(false);
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openPaymentModal = (planType: "monthly" | "yearly") => {
    console.log(`Opening payment modal for ${planType} plan`);
    setSelectedPlan(planType);
    setShowDialog(true);
  };

  if (hotelOwner.is_active && activeSubscription) {




    // Active subscription
    return (
<>
  <Card className="border rounded-2xl p-6 bg-green-50 border-green-200 shadow-sm">
    <CardContent className="p-0 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Subscription Active</h3>
          <p className="text-sm text-gray-600">Your hotel subscription is currently active.</p>
        </div>
      </div>

      {/* Expiry Info - Highlighted */}
      <div className="bg-white border border-green-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-md text-gray-600 font-medium mb-1">Expiry Date</h4>
          <div className="text-2xl font-bold text-gray-900">
            {formatDate(hotelOwner.subscription_end_date)}
          </div>
        </div>
        <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium inline-block w-fit">
          {getRemainingDaysText(hotelOwner.subscription_end_date)}
        </div>
      </div>

      {/* Extend Section */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Extend Your Subscription</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
  { label: "Extend Monthly", type: "monthly" },
  { label: "Extend Yearly", type: "yearly" },
] as const).map(({ label, type }) => (
  <div
    key={type}
    onClick={() => openPaymentModal(type)}
    className="rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow p-4 cursor-pointer flex flex-col items-start gap-2"
  >
    <div className="text-base font-semibold text-blue-800">{label}</div>
    <div className="text-sm text-blue-600">
      {planDetails[type].amount} / {type === "monthly" ? "month" : "year"}
    </div>
  </div>
))}
        </div>
      </div>
    </CardContent>
  </Card>

  <PaymentModal
    isOpen={showDialog}
    onClose={() => setShowDialog(false)}
    planType={selectedPlan}
    onConfirm={handleCreatePayment}
  />
</>


    );




  } else {
    // Inactive subscription
    return (
      <>
        <Card className="border rounded-lg p-6 bg-red-50 border-red-200">
          <CardContent className="p-0">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Subscription Inactive</h3>
                <p className="text-sm text-gray-500">
                  Your hotel subscription has expired. Please renew to continue using our services.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">
                Choose a Subscription Plan
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Monthly Plan Card */}
                <div className="border rounded-lg bg-white p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Monthly</h3>
                      <div className="mt-1 flex items-baseline">
                        <span className="text-2xl font-semibold text-gray-900">₹100</span>
                        <span className="ml-1 text-sm text-gray-500">/month</span>
                      </div>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Basic
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {planDetails.monthly.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-green-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-2 text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 w-full"
                    onClick={() => openPaymentModal("monthly")}
                    variant="default"
                  >
                    Subscribe Now
                  </Button>
                </div>

                {/* Yearly Plan Card */}
                <div className="border rounded-lg bg-white p-5 hover:shadow-md transition-shadow relative  ">
                  <div className="absolute top-0 right-0">
                    <div className="bg-secondary-500 text-white text-xs font-bold px-3 py-1 transform rotate-45 translate-x-5 -translate-y-1">
                      SAVE 17%
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Yearly</h3>
                      <div className="mt-1 flex items-baseline">
                        <span className="text-2xl font-semibold text-gray-900">₹1000</span>
                        <span className="ml-1 text-sm text-gray-500">/year</span>
                      </div>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Best Value
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {planDetails.yearly.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-green-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-2 text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 w-full"
                    onClick={() => openPaymentModal("yearly")}
                    variant="default"
                  >
                    Subscribe Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaymentModal
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          planType={selectedPlan}
          onConfirm={handleCreatePayment}
        />
      </>
    );
  }
}




// <div>
// <dt className="font-medium text-gray-900">Plan Type</dt>
// <dd className="mt-1 text-gray-500">
//   {activeSubscription.plan_type === "monthly" ? "Monthly" : "Yearly"}
// </dd>
// </div>
// <div>
// <dt className="font-medium text-gray-900">Start Date</dt>
// <dd className="mt-1 text-gray-500">
//   {formatDate(activeSubscription.start_date)}
// </dd>
// </div>
// <div>
// <dt className="font-medium text-gray-900">Expiry Date</dt>
// <dd className="mt-1 text-gray-500">
//   {formatDate(activeSubscription.end_date)}
// </dd>
// </div>
// <div>
// <dt className="font-medium text-gray-900">Order ID</dt>
// <dd className="mt-1 text-gray-500">
//   {activeSubscription.razorpay_order_id}
// </dd>
// </div>