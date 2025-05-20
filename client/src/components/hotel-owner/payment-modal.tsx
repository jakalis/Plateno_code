import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { planDetails } from "@/lib/utils";
import { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: "monthly" | "yearly";
  onConfirm: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  planType,
  onConfirm,
}: PaymentModalProps) {
  console.log(`PaymentModal: isOpen=${isOpen}, planType=${planType}`);
  const plan = planDetails[planType];
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handleConfirm = () => {
    // Save the selected payment method to localStorage
    if (selectedPaymentMethod) {
      localStorage.setItem("preferredPaymentMethod", selectedPaymentMethod);
      console.log(`Saved payment method to localStorage: ${selectedPaymentMethod}`);
    }
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="w-[90%] max-w-sm p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            You are about to purchase the {planType} subscription plan for HotelHub services.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Plan</span>
            <span className="text-sm font-medium text-gray-900">{plan.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="text-sm font-medium text-gray-900">{plan.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Duration</span>
            <span className="text-sm font-medium text-gray-900">{plan.duration}</span>
          </div>
        </div>
        <div className="relative">
            <div className="flex p-3 border rounded-md items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2 text-blue-600"
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
                Payment will be processed securely via Razorpay
              </span>
            </div>
          </div>








        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedPaymentMethod}
          >
            Proceed to Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
