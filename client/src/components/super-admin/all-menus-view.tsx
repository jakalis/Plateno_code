import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, Hotel } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AllMenusView() {
  const [selectedHotel, setSelectedHotel] = useState<string>("all_hotels");
  const [categoryFilter, setCategoryFilter] = useState<string>("all_categories");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all_meal_types");
  const [spicyLevelFilter, setSpicyLevelFilter] = useState<string>("all_spicy_levels");
  const [dietTypeFilter, setDietTypeFilter] = useState<string>("all_diet_types");

  // Fetch all hotels
  const { data: hotels, isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });

  // Fetch all menu items
  const { data: allMenuItems, isLoading: menuItemsLoading, error } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const isLoading = hotelsLoading || menuItemsLoading;

  if (isLoading) {
    return <div className="text-center py-10">Loading menu items...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error loading menu items</div>;
  }

  // Get hotel name by id
  const getHotelName = (hotelId: string) => {
    return hotels?.find((h) => h.id === hotelId)?.name || "Unknown Hotel";
  };

  // Filter menu items by hotel (if selected)
  const filteredByHotel =
    selectedHotel === "all_hotels"
      ? allMenuItems || []
      : (allMenuItems || []).filter((item) => item.hotel_id === selectedHotel);

  // Get unique categories, meal types, spicy levels, and diet types from filteredByHotel
  const categories = Array.from(new Set(filteredByHotel.map((item) => item.category)));
  const mealTypes = Array.from(new Set(filteredByHotel.map((item) => item.meal_type)));
  const spicyLevels = Array.from(new Set(filteredByHotel.map((item) => item.spicy_level))).filter(Boolean);
  const dietTypes = Array.from(new Set(filteredByHotel.map((item) => item.diet_type))).filter(Boolean);

  // Remove duplicates by ID
  const uniqueItems = filteredByHotel.reduce<MenuItem[]>((acc, current) => {
    const x = acc.find((item) => item.id === current.id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  // Apply all filters
  const finalFilteredItems = uniqueItems.filter((item) => {
    if (categoryFilter && categoryFilter !== "all_categories" && item.category !== categoryFilter) return false;
    if (mealTypeFilter && mealTypeFilter !== "all_meal_types" && item.meal_type !== mealTypeFilter) return false;
    if (spicyLevelFilter && spicyLevelFilter !== "all_spicy_levels" && item.spicy_level !== spicyLevelFilter) return false;
    if (dietTypeFilter && dietTypeFilter !== "all_diet_types" && item.diet_type !== dietTypeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">All Menus</h3>
        <div className="flex space-x-4 flex-wrap">
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Meal Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_meal_types">All Meal Types</SelectItem>
              {mealTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={spicyLevelFilter} onValueChange={setSpicyLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Spicy Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_spicy_levels">All Spicy Levels</SelectItem>
              {spicyLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dietTypeFilter} onValueChange={setDietTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Diet Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_diet_types">All Diet Types</SelectItem>
              {dietTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg mb-6">
        {finalFilteredItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No menu items available for the selected filters.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Item
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hotel
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Meal Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Spicy Level
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Diet Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Available Till
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finalFilteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200">
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
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getHotelName(item.hotel_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.meal_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.spicy_level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.diet_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{item.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.available_till}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
