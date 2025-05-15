import { useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layouts/navbar";
import { queryClient } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Show success toast when the component mounts
    toast({
      title: "Payment Successful",
      description: "Your subscription has been activated successfully.",
      variant: "default",
    });
    
    // Get the hotel owner ID from local storage
    const hotelOwnerId = localStorage.getItem("demoHotelOwnerId");
    
    // Invalidate queries to refresh data
    if (hotelOwnerId) {
      queryClient.invalidateQueries({ queryKey: [`/api/hotel-owner/${hotelOwnerId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subscription/active/${hotelOwnerId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/${hotelOwnerId}`] });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto mt-16 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-500 mb-4">
              Your subscription has been activated successfully. Thank you for choosing HotelHub!
            </p>
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p className="text-sm text-gray-600">
                You can view your subscription details and manage your account from the dashboard.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
