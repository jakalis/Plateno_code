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

export default function HotelOwnerDashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("currentMenu");
  
  // Fetch hotel data
  const { data: hotel, isLoading, error } = useQuery<Hotel>({
    queryKey: ['/api/my-hotel'],
  });
  
  if (!user || user.role !== "hotel_owner") {
    return <Redirect to="/auth" />;
  }
  
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
      <PageHeader 
        title="Hotel Menu Manager" 
        userEmail={user.email} 
        onLogout={() => logoutMutation.mutate()} 
      />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Subscription Status Warning */}
          {!hotel.is_active && (
            <ErrorBanner 
              title="Subscription Expired" 
              message="Your subscription has expired. Please renew to access your menu dashboard." 
            />
          )}
          
          {/* Hotel Information */}
          {hotel.is_active && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hotel Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="flex items-center mt-1">
                    <p className="text-sm text-primary-600 mr-2">{hotel.qr_code_url}</p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${hotel.qr_code_url}`);
                        }}
                      >
                        Copy
                      </Button>
                      <QRCodeView hotelId={hotel.id} qrCodeUrl={hotel.qr_code_url} />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subscription Status</p>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Dashboard Tabs */}
          {hotel.is_active && (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 border-b border-gray-200 w-full flex space-x-8 bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="currentMenu" 
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'currentMenu' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Current Menu
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pendingRequests" 
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'pendingRequests' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Pending Requests
                  </TabsTrigger>
                  <TabsTrigger 
                    value="addItem" 
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'addItem' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Add New Item
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="currentMenu">
                  <CurrentMenu hotelId={hotel.id} />
                </TabsContent>
                
                <TabsContent value="pendingRequests">
                  <PendingRequests hotelId={hotel.id} />
                </TabsContent>
                
                <TabsContent value="addItem">
                  <AddMenuItem hotelId={hotel.id} onSuccess={() => setActiveTab("pendingRequests")} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
