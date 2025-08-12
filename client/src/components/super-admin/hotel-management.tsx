import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, QrCode, Power, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import QRCodeView from "@/components/hotel-owner/qr-code-view";

const hotelSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  is_active: z.boolean().default(true),
});

type HotelFormValues = z.infer<typeof hotelSchema>;

export default function HotelManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentHotelId, setCurrentHotelId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      is_active: true,
    }
  });

  // Fetch all hotels
  const { data: hotels, isLoading, error } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Create new hotel
  const createMutation = useMutation({
    mutationFn: async (data: HotelFormValues) => {
      return apiRequest("POST", `/api/hotels`, data);
    },
    onSuccess: () => {
      toast({
        title: "Hotel created",
        description: "The hotel has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not create hotel",
        variant: "destructive",
      });
    }
  });

  // Update hotel
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<HotelFormValues> }) => {
      return apiRequest("PATCH", `/api/hotels/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Hotel updated",
        description: "The hotel has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not update hotel",
        variant: "destructive",
      });
    }
  });

  // Toggle hotel status (active/inactive)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      return apiRequest("PATCH", `/api/hotels/${id}`, { is_active: isActive });
    },
    onSuccess: (_, variables) => {
      toast({
        title: `Hotel ${variables.isActive ? 'activated' : 'deactivated'}`,
        description: `The hotel has been ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not update hotel status",
        variant: "destructive",
      });
    }
  });

  const openNewHotelDialog = () => {
    setCurrentHotelId(null);
    form.reset({
      name: "",
      description: "",
      location: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditHotelDialog = (hotel: Hotel) => {
    setCurrentHotelId(hotel.id);
    form.reset({
      name: hotel.name,
      description: hotel.description,
      location: hotel.location,
      is_active: hotel.is_active,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: HotelFormValues) => {
    if (currentHotelId) {
      updateMutation.mutate({ id: currentHotelId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleHotelStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading hotels...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error loading hotels</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Hotel Management</h3>
        <Button onClick={openNewHotelDialog}>
          Add New Hotel
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        {!hotels?.length ? (
          <div className="p-10 text-center text-gray-500">
            No hotels available. Add a new hotel to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menu Link
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hotels.map(hotel => (
                <tr key={hotel.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {hotel.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{hotel.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      hotel.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {hotel.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link 
                      to={`/menu/${hotel.id}`}
                      className="flex items-center text-primary-600 hover:text-primary-900"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Menu
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <QRCodeView hotelId={hotel.id} qrCodeUrl={hotel.qr_code_url} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary-600 hover:text-primary-900 mr-2"
                      onClick={() => openEditHotelDialog(hotel)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={hotel.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      onClick={() => toggleHotelStatus(hotel.id, hotel.is_active)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {hotel.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hotel Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentHotelId ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
            <DialogDescription>
              {currentHotelId 
                ? 'Update the hotel details below.' 
                : 'Fill in the details to add a new hotel.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
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
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street, New York, NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A luxury hotel in the heart of the city" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {currentHotelId ? 'Update Hotel' : 'Add Hotel'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}