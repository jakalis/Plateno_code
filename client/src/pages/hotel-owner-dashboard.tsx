import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import ErrorBanner from "@/components/ui/error-banner";
import CurrentMenu from "@/components/hotel-owner/current-menu";
import PendingRequests from "@/components/hotel-owner/pending-requests";
import AddMenuItem from "@/components/hotel-owner/add-menu-item";
import QRCodeView from "@/components/hotel-owner/qr-code-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Subscription } from "@/lib/types";
import SubscriptionStatus from "@/components/hotel-owner/subscription-status";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseISO, intervalToDuration, differenceInCalendarDays, Duration, format } from "date-fns";

export default function HotelOwnerDashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("currentMenu");

  const { data: hotel, isLoading, error } = useQuery<Hotel>({
    queryKey: ['/api/my-hotel'],
  });



  if (!user || user.role !== "hotel_owner") {
    return <Redirect to="/auth" />;
  }

  const hotelId = hotel?.id;

  const endDate = hotel?.subscription_end_date;

  const daysLeft = endDate ? differenceInCalendarDays(endDate, new Date()) : null;

  const duration =
    endDate && daysLeft !== null && daysLeft >= 0
      ? intervalToDuration({ start: new Date(), end: endDate })
      : null;

  const statusColor =
    daysLeft !== null && daysLeft < 10
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800";

  const formatDuration = (duration: Duration) => {
    const parts = [];
    if (duration.years) parts.push(`${duration.years} year${duration.years > 1 ? "s" : ""}`);
    if (duration.months) parts.push(`${duration.months} month${duration.months > 1 ? "s" : ""}`);
    if (duration.days) parts.push(`${duration.days} day${duration.days > 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  const remainingText = duration ? `${formatDuration(duration)} left` : "Unknown";
  const endDateFormatted = endDate ? format(endDate, "MMMM d, yyyy") : "N/A";

  const { data: activeSubscription, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useQuery<{ subscription: Subscription | null }>({
    queryKey: [hotelId ? `/api/subscription/active/${hotelId}` : null],
    enabled: !!hotelId,
  });

  const { data: subscriptionHistory, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery<Subscription[]>({
    queryKey: [hotelId ? `/api/subscriptions/${hotelId}` : null],
    enabled: !!hotelId,
  });

  const [open, setOpen] = useState(false);
  const refreshData = () => {
    refetchSubscription();
    refetchHistory();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-7xl mx-auto">
          <ErrorBanner
            title="Error loading hotel data"
            message={(error as Error)?.message || "Failed to load hotel data"}
          />
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Responsive header fix */}
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Plateno</h1>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm border-gray-300 shadow-sm hover:bg-gray-100 transition-all duration-200"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-1.5 h-4 w-4 text-gray-600" />
            <span className="text-gray-700">Logout</span>
          </Button>
        </div>
      </div>

      <main className="pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hotel.is_active && (
            <ErrorBanner
              title="Subscription Expired"
              message="Your subscription has expired. Please renew to access your menu dashboard."
            />
          )}


          {!hotel.is_active && (
            <div className="p-6">
              {isLoadingSubscription ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <SubscriptionStatus
                  hotelOwner={hotel}
                  activeSubscription={activeSubscription?.subscription}
                  onRefresh={refreshData}
                />
              )}
            </div>
          )}



          {hotel.is_active && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hotel Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hotel Name</p>
                  <p className="mt-1 text-lg font-medium text-gray-900">{hotel.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="mt-1 text-lg font-medium text-gray-900">{hotel.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">QR Code URL</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-1">
                    <p className="text-sm text-primary-600 break-all">{hotel.qr_code_url}</p>
                    <div className="flex flex-wrap mt-2 sm:mt-0 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}${hotel.qr_code_url}`)}
                      >
                        Copy
                      </Button>
                      <QRCodeView hotelId={hotel.id} qrCodeUrl={hotel.qr_code_url} />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border p-5 shadow-sm bg-white">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Subscription Status</p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      Active — {remainingText}
                    </span>
                    <span className="text-xs text-gray-500">
                      Ends on {endDateFormatted}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Button that triggers the modal */}
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button>View Subscription</Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Subscription Details</DialogTitle>
                      </DialogHeader>

                      {isLoadingSubscription ? (
                        <Skeleton className="h-40 w-full" />
                      ) : (
                        <SubscriptionStatus
                          hotelOwner={hotel}
                          activeSubscription={activeSubscription?.subscription}
                          onRefresh={refreshData}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>

              </div>
            </div>
          )}




          {hotel.is_active && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap gap-2 border-b border-gray-200 bg-transparent p-0 mb-6">
                <TabsTrigger
                  value="currentMenu"
                  className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'currentMenu'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Menu
                </TabsTrigger>
                <TabsTrigger
                  value="pendingRequests"
                  className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'pendingRequests'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="addItem"
                  className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'addItem'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Add Items
                </TabsTrigger>
              </TabsList>

              <TabsContent value="currentMenu">
                <CurrentMenu hotelId={hotelId!} />
              </TabsContent>

              <TabsContent value="pendingRequests">
                <PendingRequests hotelId={hotelId!} />
              </TabsContent>

              <TabsContent value="addItem">
                <AddMenuItem hotelId={hotelId!} onSuccess={() => setActiveTab("pendingRequests")} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
