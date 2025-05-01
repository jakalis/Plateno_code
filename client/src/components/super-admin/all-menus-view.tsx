import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, Hotel } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function AllMenusView() {
  const [selectedHotel, setSelectedHotel] = useState<string>("all_hotels");
  const [categoryFilter, setCategoryFilter] = useState<string>("all_categories");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all_meal_types");
  
  // Fetch all hotels
  const { data: hotels, isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });
  
  // Fetch all menu items
  const { data: allMenuItems, isLoading: menuItemsLoading, error } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items'],
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
    return hotels?.find(h => h.id === hotelId)?.name || "Unknown Hotel";
  };
  
  // Filter menu items by hotel (if selected)
  const filteredByHotel = selectedHotel === "all_hotels" 
    ? allMenuItems || []
    : (allMenuItems || []).filter(item => item.hotel_id === selectedHotel);
  
  // Get unique categories and meal types
  const categories = Array.from(new Set(filteredByHotel.map(item => item.category)));
  const mealTypes = Array.from(new Set(filteredByHotel.map(item => item.meal_type)));
  
  // Apply additional filters
  // Remove duplicates by ID
const uniqueItems = filteredByHotel.reduce((acc, current) => {
  const x = acc.find(item => item.id === current.id);
  if (!x) {
    return acc.concat([current]);
  } else {
    return acc;
  }
}, []);

const finalFilteredItems = uniqueItems.filter(item => {
    if (categoryFilter && categoryFilter !== "all_categories" && item.category !== categoryFilter) return false;
    if (mealTypeFilter && mealTypeFilter !== "all_meal_types" && item.meal_type !== mealTypeFilter) return false;
    return true;
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">All Menus</h3>
        <div className="flex space-x-4">
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Hotels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_hotels">All Hotels</SelectItem>
              {hotels?.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Meal Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_meal_types">All Meal Types</SelectItem>
              {mealTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
        {finalFilteredItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No menu items available for the selected filters.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meal Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Till
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finalFilteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-200">
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