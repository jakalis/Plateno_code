import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import HotelOwnerDashboard from "@/pages/hotel-owner-dashboard";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import PublicMenuPage from "@/pages/public-menu-page";
import { AuthProvider } from "@/hooks/use-auth";
import ContactPage from "@/pages/contact-page";
import ServicePage from "@/pages/service-page";
import Payment from "./pages/payment";
import PaymentSuccess from "./pages/payment-success";
import ResetPasswordPage from "./pages/reset-password";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/menu/:hotelId" component={PublicMenuPage} />
      <Route path="/contact/:hotelId" component={ContactPage} />
      <Route path="/service/:hotelId" component={ServicePage} />
      <Route path="/pay" component={Payment} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <ProtectedRoute path="/admin" role="super_admin" component={SuperAdminDashboard} />
      <ProtectedRoute exact path="/" role="hotel_owner" component={HotelOwnerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}
export default App;