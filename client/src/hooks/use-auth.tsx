import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  type UseMutationResult
} from "@tanstack/react-query";
import { InsertUser, User, loginSchema } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import z from "zod";

type LoginData = z.infer<typeof loginSchema>;

type RegisterData = {
  email: string;
  password: string;
  role: "hotel_owner" | "super_admin";
  hotel_name?: string;
  hotel_description?: string;
  hotel_location?: string;
  contact?: Record<string, string>;
  service?: Record<string, string>;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: Infinity,
    // Don't show not authenticated as an error
    refetchOnMount: false,
    // We want to handle 401 gracefully
    throwOnError: false,
    // Transform 401 responses to null user
    select: (data) => data || null
  });

  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Logged in successfully",
        description: `Welcome ${user.email}!`,
      });
      
      // Redirect based on user role
      if (user.role === "super_admin") {
        window.location.href = "/admin";
      } else if (user.role === "hotel_owner") {
        window.location.href = "/";
      }
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<User, Error, RegisterData>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registered successfully",
        description: `Welcome ${user.email}!`,
      });
      
      // Redirect based on user role - for registration it should always be hotel_owner
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
      // Force redirect to auth page
      window.location.href = "/auth";
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
