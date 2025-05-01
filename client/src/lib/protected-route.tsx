import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

type ProtectedRouteProps = {
  path: string;
  role: "hotel_owner" | "super_admin";
  component: () => React.JSX.Element;
};

export function ProtectedRoute({
  path,
  role,
  component: Component,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check role for specific routes
        if (role && user.role !== role) {
          // Redirect hotel owners to their dashboard
          if (user.role === "hotel_owner") {
            setLocation("/");
            return null;
          }
          
          // Redirect super admins to their dashboard
          if (user.role === "super_admin") {
            setLocation("/admin");
            return null;
          }
          
          // Fallback redirect
          return <Redirect to="/auth" />;
        }

        return <Component />;
      }}
    </Route>
  );
}
