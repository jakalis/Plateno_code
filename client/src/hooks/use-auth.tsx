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

  // ✅ Use apiRequest to include credentials for cookies
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/user`],
    queryFn: async () => {
      const res = await apiRequest("GET", `${import.meta.env.VITE_API_URL}/api/user`);
      return res.json();
    },
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    throwOnError: false,
    select: (data) => data || null
  });

const loginMutation = useMutation<User, Error, LoginData>({
  mutationFn: async (credentials) => {
    // Login request with credentials included
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include", // important for cookies/session
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }

    return res.json();
  },
  onSuccess: async (user) => {
    // Update React Query cache
    queryClient.setQueryData(["currentUser"], user);

    console.log("Login successful:", user);

    toast({
      title: "Logged in successfully",
      description: `Welcome ${user.email}!`,
    });

    // Redirect based on role
    if (user.role === "super_admin") {
      window.location.href = "/admin";
    } else if (user.role === "hotel_owner") {
      window.location.href = "/";
    }
  },
  onError: (error: any) => {
    toast({
      title: "Login failed",
      description: error.message || "Something went wrong",
      variant: "destructive",
    });
  },
});


  const registerMutation = useMutation<User, Error, RegisterData>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/register`, data);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([`${import.meta.env.VITE_API_URL}/api/user`], user);
      toast({
        title: "Registered successfully",
        description: `Welcome ${user.email}!`,
      });
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
      await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/logout`);
    },
    onSuccess: () => {
      queryClient.setQueryData([`${import.meta.env.VITE_API_URL}/api/user`], null);
      toast({ title: "Logged out successfully" });
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
