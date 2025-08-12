import { useQuery } from "@tanstack/react-query";
import { MenuUpdateRequest } from "@shared/schema";
import { useEffect, useRef, useState } from "react";

interface PendingRequestsProps {
  hotelId: string;
}

const spicyMap = {
  sweet: "🧊",
  mild: "🌶️",
  spicy: "🌶️🌶️",
};

export default function PendingRequests({ hotelId }: PendingRequestsProps) {
  const {
    data: requests,
    isLoading,
    error,
  } = useQuery<MenuUpdateRequest[]>({
    queryKey: ["/api/menu-update-requests"],
  });

  const hotelRequests = requests?.filter((req) => req.hotel_id === hotelId) || [];
  const pendingRequests = hotelRequests.filter((req) => req.status === "pending");

  const categories = Array.from(
    new Set(pendingRequests.map((req) => (req.requested_changes as any).category))
  );

  return (
    <div className="px-4">
      <div className="mb-8 text-center">
        <p className="text-sm sm:text-xs md:text-xs lg:text-sm text-gray-500 mt-1 pt-3">
          🍽️ These items are pending for admin review 🍽️
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-600">Loading pending requests...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-600">Error loading pending requests</div>
      ) : pendingRequests.length === 0 ? (
        <div className="p-12 text-center text-gray-500 border border-gray-200 rounded-lg">
          No pending requests at the moment.
        </div>
      ) : (
        <>
          {categories.map((category) => {
            const itemsInCategory = pendingRequests.filter(
              (req) => (req.requested_changes as any).category === category
            );
            if (itemsInCategory.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {itemsInCategory.map((request) => {
                    const item = request.requested_changes as any;

                    return (
                      <div
                        key={request.id}
                        className="relative flex flex-row-reverse bg-white border border-gray-100 shadow-sm rounded-md items-stretch h-[140px] sm:h-[160px] w-full max-w-[400px] transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      >
                        {/* Image */}
                        <div className="w-[120px] sm:w-[140px] h-full relative">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 h-full p-3 flex flex-col justify-between">
                          {/* Top Icons */}
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2 items-center">
                              <span className="text-sm" title={`Spicy: ${item.spicy_level}`}>
                                {spicyMap[item.spicy_level as keyof typeof spicyMap] ?? "N/A"}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-sm border flex items-center justify-center bg-white ${
                                  item.diet_type === "non-veg"
                                    ? "border-red-600"
                                    : "border-green-600"
                                }`}
                                title={item.diet_type}
                              >
                                {item.diet_type === "veg" && (
                                  <div className="w-2 h-2 rounded-full bg-green-600" />
                                )}
                                {item.diet_type === "non-veg" && (
                                  <div className="w-2 h-2 rounded-full bg-red-600" />
                                )}
                                {item.diet_type === "vegan" && (
                                  <div className="text-[10px] leading-none">🥦</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Title and Description */}
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          {/* Price & Metadata */}
                          <div className="text-sm text-gray-700 flex items-center gap-2 mt-1">
                            ₹{item.price}
                            <span className="text-gray-400">|</span>
                            {item.meal_type}
                            <span className="text-gray-400">|</span>
                            <span className="text-xs text-gray-500">Till {item.available_till}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
