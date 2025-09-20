import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MenuUpdateRequest, Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, X, Loader2 } from "lucide-react";

export default function MenuRequests() {
  const [hotelFilter, setHotelFilter] = useState<string>("");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("");
  const { toast } = useToast();

  // Fetch all requests
  const {
    data: requests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch,
  } = useQuery<MenuUpdateRequest[]>({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/menu-update-requests`],
  });

  // Fetch all hotels
  const {
    data: hotels,
    isLoading: hotelsLoading,
    error: hotelsError,
  } = useQuery<Hotel[]>({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/hotels`],
  });

  const isLoading = requestsLoading || hotelsLoading;
  const error = requestsError || hotelsError;

  // Handle approving a request
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `${import.meta.env.VITE_API_URL}/api/menu-update-requests/${requestId}`, {
        status: "approved",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request approved",
        description: "The menu item has been approved and published",
      });

      // Refresh all relevant queries
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [`${import.meta.env.VITE_API_URL}/api/menu-update-requests`],
        }),
        queryClient.invalidateQueries({ queryKey: [`${import.meta.env.VITE_API_URL}/api/menu-items`] }),
        queryClient.invalidateQueries({ queryKey: [`${import.meta.env.VITE_API_URL}/api/hotels`] }),
      ]).then(() => {
        // Force refetch
        queryClient.refetchQueries({ queryKey: [`${import.meta.env.VITE_API_URL}/api/menu-update-requests`] });
        queryClient.refetchQueries({ queryKey: [`${import.meta.env.VITE_API_URL}/api/menu-items`] });
      });

      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not approve request",
        variant: "destructive",
      });
    },
  });

  // Handle rejecting a request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `${import.meta.env.VITE_API_URL}/api/menu-update-requests/${requestId}`, {
        status: "rejected",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request rejected",
        description: "The menu item request has been rejected",
      });
      queryClient.invalidateQueries({
        queryKey: [`${import.meta.env.VITE_API_URL}/api/menu-update-requests`],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not reject request",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-10">Loading pending requests...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">Error loading data</div>
    );
  }

  // Filter requests based on status
  const pendingRequests =
    requests?.filter((req) => req.status === "pending") || [];

  // Log for debugging
  console.log("All requests:", requests);
  console.log("Pending requests:", pendingRequests);

  // Apply filters
  const filteredRequests = pendingRequests.filter((req) => {
    // Always show everything if no filter is applied
    if (!hotelFilter && !requestTypeFilter) return true;

    // Apply hotel filter
    if (
      hotelFilter &&
      hotelFilter !== "all_hotels" &&
      req.hotel_id !== hotelFilter
    )
      return false;

    // Apply request type filter
    if (requestTypeFilter === "new" && req.item_id) return false;
    if (requestTypeFilter === "update" && !req.item_id) return false;

    return true;
  });

  // Get hotel name by ID
  const getHotelName = (hotelId: string) => {
    return hotels?.find((h) => h.id === hotelId)?.name || "Unknown Hotel";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Pending Menu Update Requests
        </h3>
        <div className="flex space-x-4">
          <Select value={hotelFilter} onValueChange={setHotelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Hotels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_hotels">All Hotels</SelectItem>
              {hotels?.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={requestTypeFilter}
            onValueChange={setRequestTypeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Request Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">All Request Types</SelectItem>
              <SelectItem value="new">New Item</SelectItem>
              <SelectItem value="update">Update</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg  mb-6">
        {filteredRequests.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No pending requests at the moment.
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {filteredRequests.map((request) => {
              const changes = request.requested_changes as any;
              const isNewItem = !request.item_id;

              return (
                <li key={request.id} className="p-4">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-16 w-16 rounded-md   bg-gray-200 flex items-center justify-center">
                          {changes.photo_url ? (
                            <img
                              src={changes.photo_url}
                              alt={changes.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">
                              No Image
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center flex-wrap">
                            <h4 className="text-md font-medium text-gray-900">
                              {changes.name} {!isNewItem ? "(Update)" : ""}
                            </h4>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {isNewItem ? "New Item" : "Update"}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getHotelName(request.hotel_id)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {changes.description}
                          </p>



                          <div className="mt-1 flex items-center flex-wrap gap-x-2 text-xs text-gray-500">
                            <span className="text-sm font-medium text-gray-700">₹{changes.price}</span>
                            <span>|</span>
                            <span>{changes.category}</span>
                            <span>|</span>
                            <span>{changes.meal_type}</span>
                            <span>|</span>
                            <span>Available till {changes.available_till}</span>

                            {changes.spicy_level && (
                              <>
                                <span>|</span>
                                <span className="flex items-center gap-1">
                                  🌶️
                                  <span className="capitalize">{changes.spicy_level}</span>
                                </span>
                              </>
                            )}

                            {changes.diet_type && (
                              <>
                                <span>|</span>
                                <span className="capitalize">{changes.diet_type}</span>
                              </>
                            )}
                          </div>





                          <div className="mt-2 text-xs text-gray-500">
                            Submitted:{" "}
                            {format(
                              new Date(request.submitted_at),
                              "MMM d, yyyy",
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate(request.id)}
                        disabled={
                          approveMutation.isPending || rejectMutation.isPending
                        }
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate(request.id)}
                        disabled={
                          approveMutation.isPending || rejectMutation.isPending
                        }
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
