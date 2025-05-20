import { useQuery } from "@tanstack/react-query";
import { MenuUpdateRequest } from "@shared/schema";
import { format } from "date-fns";

interface PendingRequestsProps {
  hotelId: string;
}

export default function PendingRequests({ hotelId }: PendingRequestsProps) {
  const {
    data: requests,
    isLoading,
    error,
  } = useQuery<MenuUpdateRequest[]>({
    queryKey: ["/api/menu-update-requests"],
  });

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading pending requests...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Error loading pending requests
      </div>
    );
  }

  const hotelRequests = requests?.filter((req) => req.hotel_id === hotelId) || [];
  const pendingRequests = hotelRequests.filter((req) => req.status === "pending");

  return (
    <div className="px-4">
      <div className="mb-8 text-center">
        {/* <h3
          className="text-2xl font-semibold text-gray-800 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pending Menu Requests
        </h3> */}
<p className="text-sm sm:text-xs md:text-xs lg:text-sm text-gray-500 mt-1 pt-3">
  🍽️ These items are pending for admin review 🍽️ 
</p>
      </div>
      {pendingRequests.length === 0 ? (
        <div className="p-12 text-center text-gray-500 border border-gray-200 rounded-lg">
          No pending requests at the moment.
        </div>
      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.map((request) => {
            const item = request.requested_changes as any;

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-md p-4 flex gap-4 items-start transition-transform duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">
                        {item.name}
                      </h4>
                      {/* Future status badge, if needed */}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-2 text-sm text-gray-700 space-x-2">
                      <span>₹{item.price}</span>
                      <span>|</span>
                      <span>{item.category}</span>
                      <span>|</span>
                      <span>{item.meal_type}</span>
                      <span>|</span>
                      <span className="text-xs text-gray-500">
                        Till {item.available_till}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>



      )}
    </div>
  );
}
