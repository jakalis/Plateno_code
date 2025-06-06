import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.literal("hotel_owner"),
  hotel_name: z.string().min(1, "Hotel name is required"),
  hotel_description: z.string().min(1, "Hotel description is required"),
  hotel_location: z.string().min(1, "Hotel location is required"),
  contact: z.record(z.string(), z.string()).optional(),
  service: z.record(z.string(), z.string()).optional(),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Initialize contacts with the first contact fixed as 'Restaurant'
  const [contacts, setContacts] = useState([{ key: "Restaurant", value: "" }]);
  const [services, setServices] = useState([{ key: "", value: "" }]);
  const [contactError, setContactError] = useState<string | null>(null);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "hotel_owner" as const,
      hotel_name: "",
      hotel_description: "",
      hotel_location: "",
    },
  });

  const handleContactChange = (
    index: number,
    field: "key" | "value",
    newValue: string
  ) => {
    // Prevent editing the first key
    if (index === 0 && field === "key") return;

    const updated = [...contacts];
    updated[index][field] = newValue;
    setContacts(updated);
  };

  const addContactField = () => {
    setContacts([...contacts, { key: "", value: "" }]);
  };

  const removeContactField = (index: number) => {
    // Do not remove the first contact ("Restaurant")
    if (index === 0) return;
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
  };

  const handleServiceChange = (
    index: number,
    field: "key" | "value",
    newValue: string
  ) => {
    const updated = [...services];
    updated[index][field] = newValue;
    setServices(updated);
  };

  const addServiceField = () => {
    setServices([...services, { key: "", value: "" }]);
  };

  const removeServiceField = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
  };

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    const contactObj: Record<string, string> = {};
    contacts.forEach(({ key, value }) => {
      if (key) contactObj[key] = value;
    });

    // Check that the first contact is 'Restaurant' and its value is filled
    if (
      !contacts[0] ||
      contacts[0].key.toLowerCase() !== "restaurant" ||
      contacts[0].value.trim() === ""
    ) {
      setContactError("The first contact must have key 'Restaurant' and a non-empty value.");
      return;
    }

    // No need to check others for Restaurant key because first is fixed

    setContactError(null);

    const serviceObj: Record<string, string> = {};
    services.forEach(({ key, value }) => {
      if (key) serviceObj[key] = value;
    });

    registerMutation.mutate({
      ...data,
      contact: contactObj,
      service: serviceObj,
    });
  };

  if (user) {
    if (user.role === "super_admin") return <Redirect to="/admin" />;
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8">
        <div className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg text-white">
          <h1 className="text-3xl font-bold mb-4">Hotel Menu Management Platform</h1>
          <p className="mb-6">
            A comprehensive solution for hotels to digitally manage and display their menus.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">✓ Create and manage digital menus</li>
            <li className="flex items-center">✓ Generate QR codes for your guests</li>
            <li className="flex items-center">✓ Schedule time-based menu availability</li>
            <li className="flex items-center">✓ Track menu performance with analytics</li>
          </ul>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Plateno</CardTitle>
            <CardDescription className="text-center">
              Sign in or register to manage your hotel's digital menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="login"
              value={authTab}
              onValueChange={(value) => setAuthTab(value as "login" | "register")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <input type="hidden" {...registerForm.register("role")} value="hotel_owner" />
                    <FormField
                      control={registerForm.control}
                      name="hotel_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hotel Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Grand Hotel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="hotel_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hotel Description</FormLabel>
                          <FormControl>
                            <Input placeholder="A luxury hotel in the heart of the city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="hotel_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hotel Location</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street, New York, NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <FormLabel>Contact Info (must include key: 'Restaurant')</FormLabel>
                      {contacts.map((entry, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Restaurant"
                            value={entry.key}
                            onChange={(e) => handleContactChange(index, "key", e.target.value)}
                            readOnly={index === 0}
                            className={index === 0 ? "text-black font-semibold" : ""}
                          />
                          <Input
                            placeholder="Value"
                            value={entry.value}
                            onChange={(e) => handleContactChange(index, "value", e.target.value)}
                            required={index === 0}
                          />
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => removeContactField(index)}
                              className="text-red-500 text-sm font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {contactError && <p className="text-red-600 text-sm">{contactError}</p>}
                      <Button type="button" variant="outline" size="sm" onClick={addContactField}>
                        + Add Contact
                      </Button>
                    </div>

                    {/* Service Info */}
                    <div className="space-y-2 mt-6">
                      <FormLabel>Service Info</FormLabel>
                      {services.map((entry, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Key"
                            value={entry.key}
                            onChange={(e) => handleServiceChange(index, "key", e.target.value)}
                          />
                          <Input
                            placeholder="Value"
                            value={entry.value}
                            onChange={(e) => handleServiceChange(index, "value", e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeServiceField(index)}
                            className="text-red-500 text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addServiceField}>
                        + Add Service
                      </Button>
                    </div>

                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
