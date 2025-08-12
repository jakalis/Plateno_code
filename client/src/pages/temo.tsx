import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import ErrorBanner from "@/components/ui/error-banner";
import CurrentMenu from "@/components/hotel-owner/current-menu";
import PendingRequests from "@/components/hotel-owner/pending-requests";
import AddMenuItem from "@/components/hotel-owner/add-menu-item";
import QRCodeView from "@/components/hotel-owner/qr-code-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Subscription } from "@/lib/types";
import SubscriptionStatus from "@/components/hotel-owner/subscription-status";
import { parseISO, intervalToDuration, differenceInCalendarDays, Duration, format } from "date-fns";
import logo from "@/assets/logo_icon.svg"; // For logo
import current_menu from "@/assets/current_menu.svg";
import add_menu from "@/assets/add_menu.svg";
import pending_menu from "@/assets/pending_menu.svg";
import hotel_information from "@/assets/hotel_information.svg";
import membership from "@/assets/membership.svg";
import qr from "@/assets/qr.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft } from "lucide-react";
import { MoreVertical } from "lucide-react";
import { APP_NAME, SLOGAN} from "@/pages/constants";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      <button
        onClick={onClick}
        className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300 flex items-center justify-center transition-all pointer-events-auto"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}


export default function HotelOwnerDashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<null | string>(null);

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

  const formatDuration = (duration: Duration) => {
    const parts = [];
    if (duration.years) parts.push(`${duration.years} year${duration.years > 1 ? "s" : ""}`);
    if (duration.months) parts.push(`${duration.months} month${duration.months > 1 ? "s" : ""}`);
    if (duration.days) parts.push(`${duration.days} day${duration.days > 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  const remainingText = duration ? `${formatDuration(duration)} left` : "Unknown";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full text-gray-900 hover:bg-gray-300 flex items-center justify-center"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  const handleCardClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50">



      {/* NavBar */}
      <nav className="bg-gray-100 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 items-center w-full">

            {/* Left - Logo */}
            <div className="flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-10 object-contain rounded-full border border-gray-300 shadow-sm"
              />
            </div>

            {/* Center - Title */}
            <div className="text-center">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-700 md:text-gray-700 tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {APP_NAME}
              </h1>
            </div>

            {/* Right - Dropdown */}
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full text-gray-900 hover:bg-gray-300 border-none flex items-center justify-center"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </div>
      </nav>




      <main className="pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hotel.is_active ? (
            <>
              <ErrorBanner
                title="Subscription Expired"
                message="Your subscription has expired. Please renew to access your menu dashboard."
              />
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
            </>
          ) : (
            <>
              {!activeTab && (
                <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <DashboardCard
                    title="Current Menu"
                    onClick={() => handleCardClick("currentMenu")}
                    active={activeTab === "currentMenu"}
                    imageSrc={current_menu}
                  />
                  <DashboardCard
                    title="Pending Menu"
                    onClick={() => handleCardClick("pendingRequests")}
                    active={activeTab === "pendingRequests"}
                    imageSrc={pending_menu}
                  />
                  <DashboardCard
                    title="Add Menu"
                    onClick={() => handleCardClick("addItem")}
                    active={activeTab === "addItem"}
                    imageSrc={add_menu}
                  />
                  <DashboardCard
                    title="Hotel Information"
                    onClick={() => handleCardClick("info")}
                    active={activeTab === "info"}
                    imageSrc={hotel_information}
                  />
                  <DashboardCard
                    title="Membership"
                    onClick={() => handleCardClick("subscription")}
                    active={activeTab === "subscription"}
                    imageSrc={membership}
                  />
                  <DashboardCard
                    title="Show QR Code"
                    onClick={() => handleCardClick("qr")}
                    active={activeTab === "qr"}
                    imageSrc={qr}
                  />
                </div>
              )}

              {activeTab === "currentMenu" && (
                <>
                  <BackButton onClick={() => setActiveTab(null)} />
                  <CurrentMenu hotelId={hotelId!} />
                </>
              )}

              {activeTab === "pendingRequests" && (
                <>
                  <BackButton onClick={() => setActiveTab(null)} />
                  <PendingRequests hotelId={hotelId!} />
                </>
              )}

              {activeTab === "addItem" && (
                <>
                  <BackButton onClick={() => setActiveTab(null)} />
                  <AddMenuItem hotelId={hotelId!} onSuccess={() => setActiveTab("pendingRequests")} />
                </>
              )}

              {activeTab === "info" && (
                <>
                  <BackButton onClick={() => setActiveTab(null)} />
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-6 space-y-6">

                    {/* Title and Location */}
                    <div className="text-center">
                      <h2
                        className="text-3xl font-semibold text-gray-800"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {hotel.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">{hotel.location}</p>
                    </div>

                    {/* Description */}
                    {hotel.description && (
                      <p className="text-base text-gray-600 leading-relaxed text-center max-w-2xl mx-auto">
                        {hotel.description}
                      </p>
                    )}

                    {/* Contact Details */}
                    {hotel.contact && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">📞 Contact Details</h3>
                        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-100">

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {Object.entries(hotel.contact).map(([key, value]) => (
                              <div
                                key={key}
                                className="group p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="text-gray-500 text-sm capitalize">{key.replace(/_/g, ' ')}</div>
                                <div className="text-gray-900 font-medium group-hover:underline">{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Services/Activities */}

                    {hotel.service && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🏨 Hotel Services</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(hotel.service).map(([key, value]) => (
                            <div
                              key={key}
                              className="relative bg-white shadow-md rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:scale-[1.01] transition-transform"
                            >
                              <h4 className="text-md font-semibold text-gray-800 mb-2 capitalize text-center">
                                {key.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-sm text-gray-600 leading-relaxed text-center">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}



                  </div>
                </>
              )}


              {activeTab === "subscription" && (
                <>
                  <BackButton onClick={() => setActiveTab(null)} />
                  <div className="mt-6">
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
                </>
              )}

              {activeTab === "qr" && (
                <>
                  <BackButton onClick={() => setActiveTab(null)} />
                  <div className="mt-6">
                    <QRCodeView hotelId={hotel.id} qrCodeUrl={hotel.qr_code_url} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  onClick,
  active,
  imageSrc,   // new optional prop
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  imageSrc?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border px-6 py-8 text-center font-semibold shadow-sm transition duration-200
        ${active ? "bg-gray-900 text-white shadow-md" : "bg-white text-gray-800 hover:bg-gray-100 hover:shadow-md"}
      `}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={title}
          className="mx-auto mb-4 w-12 sm:w-16 md:w-20 h-auto object-contain max-h-24"
        />
      )}
      <h3 className="text-sm sm:text-base text-gray-600 font-medium">{title}</h3>
    </div>
  );
}
