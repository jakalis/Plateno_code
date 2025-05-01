import { useQuery } from "@tanstack/react-query";
import { MenuUpdateRequest } from "@shared/schema";
import { format } from "date-fns";

interface PendingRequestsProps {
  hotelId: string;
}

export default function PendingRequests({ hotelId }: PendingRequestsProps) {
  // Fetch pending requests
  const {
    data: requests,
    isLoading,
    error,
  } = useQuery<MenuUpdateRequest[]>({
    queryKey: ["/api/menu-update-requests"],
  });

  if (isLoading) {
    return <div className="text-center py-10">Loading pending requests...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading pending requests
      </div>
    );
  }

  // Filter requests for this hotel
  const hotelRequests =
    requests?.filter((req) => req.hotel_id === hotelId) || [];

  // Filter pending requests
  const pendingRequests = hotelRequests.filter(
    (req) => req.status === "pending",
  );

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Pending Menu Update Requests
      </h3>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {pendingRequests.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No pending requests at the moment.
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {pendingRequests.map((request) => {
              const changes = request.requested_changes as any;

              return (
                <li key={request.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                      {changes.photo_url ? (
                        <img
                          src={changes.photo_url}
                          alt={changes.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h4 className="text-md font-medium text-gray-900">
                          {changes.name} {request.item_id ? "(Update)" : ""}
                        </h4>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {changes.description}
                      </p>
                      <div className="mt-1 flex items-center flex-wrap">
                        <span className="text-sm font-medium text-gray-700">
                          ₹{changes.price}
                        </span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-xs text-gray-500">
                          {changes.category}
                        </span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-xs text-gray-500">
                          {changes.meal_type}
                        </span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-xs text-gray-500">
                          Available till {changes.available_till}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Submitted:{" "}
                        {format(new Date(request.submitted_at), "MMM d, yyyy")}
                      </div>
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
