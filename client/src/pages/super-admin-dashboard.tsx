import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import MenuRequests from "@/components/super-admin/menu-requests";
import HotelManagement from "@/components/super-admin/hotel-management";
import AllMenusView from "../components/super-admin/all-menus-view";

export default function SuperAdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("menuRequests");
  
  if (!user || user.role !== "super_admin") {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader 
        title="Plateno - Admin" 
        userEmail={user.email} 
        onLogout={() => logoutMutation.mutate()} 
      />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 border-b border-gray-200 w-full flex space-x-8 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="menuRequests" 
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'menuRequests' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Menu Update Requests
              </TabsTrigger>
              <TabsTrigger 
                value="allMenus" 
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'allMenus' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                View All Menus
              </TabsTrigger>
              <TabsTrigger 
                value="hotelManagement" 
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hotelManagement' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Hotel Management
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="menuRequests">
              <MenuRequests />
            </TabsContent>
            
            <TabsContent value="allMenus">
              <AllMenusView />
            </TabsContent>
            
            <TabsContent value="hotelManagement">
              <HotelManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
