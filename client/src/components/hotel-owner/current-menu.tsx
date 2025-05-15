import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditMenuItem from "./utils-menu-item"; // Adjust the path if needed

interface CurrentMenuProps {
  hotelId: string;
}

export default function CurrentMenu({ hotelId }: CurrentMenuProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null); // Added state for active item
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch menu items
  const {
    data: menuItems,
    isLoading,
    error,
    refetch, // Destructure refetch from the query
  } = useQuery<MenuItem[]>({
    queryKey: [`/api/hotels/${hotelId}/menu-items`],
  });

  if (isLoading) {
    return <div className="text-center py-10">Loading menu items...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading menu items
      </div>
    );
  }

  const approvedItems = menuItems?.filter((item) => item.is_approved) || [];

  // Get unique categories and meal types for filters
  const categories = Array.from(
    new Set(approvedItems.map((item) => item.category)),
  );
  const mealTypes = Array.from(
    new Set(approvedItems.map((item) => item.meal_type)),
  );

  // Apply filters
  const filteredItems = approvedItems.filter((item) => {
    if (
      categoryFilter &&
      categoryFilter !== "all_categories" &&
      item.category !== categoryFilter
    )
      return false;
    if (
      mealTypeFilter &&
      mealTypeFilter !== "all_meal_types" &&
      item.meal_type !== mealTypeFilter
    )
      return false;
    return true;
  });

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/menu-items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        // Show success toast
        toast({
          title: "Success",
          description: "Menu item deleted successfully",
          variant: "success",
          duration: 1000,
        });

        // Trigger refetch to reload the data
        refetch(); // This will trigger the query to fetch the updated list of items
      } else {
        // Show error toast
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Show error toast in case of network or other errors
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
<div className="flex flex-nowrap gap-2 items-center mb-4 overflow-x-auto">
  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
    <SelectTrigger className="w-[140px] h-8 px-2 text-xs rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition">
      <SelectValue placeholder="Category" />
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
    <SelectTrigger className="w-[140px] h-8 px-2 text-xs rounded-md border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition">
      <SelectValue placeholder="Meal Type" />
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
</div>



      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No menu items available. Add new items from the "Add New Item" tab.
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className="p-4 flex items-start justify-between hover:bg-gray-50"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
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
                    <div className="flex items-center">
                      <h4 className="text-md font-medium text-gray-900">
                        {item.name}
                      </h4>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-1 flex items-center flex-wrap">
                      <span className="text-sm font-medium text-gray-700">
                        ₹{item.price}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-xs text-gray-500">
                        {item.category}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-xs text-gray-500">
                        {item.meal_type}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-xs text-gray-500">
                        Available till {item.available_till}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      setActiveItem(item);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {activeItem && (
        <EditMenuItem
          open={!!activeItem}
          onClose={() => setActiveItem(null)}
          initialValues={{
            name: activeItem.name,
            price: String(activeItem.price),
            category: activeItem.category,
            meal_type: activeItem.meal_type,
            available_till: activeItem.available_till,
            description: activeItem.description,
            photo_url: activeItem.photo_url || "",
          }}
          itemId={activeItem.id}
          hotelId={hotelId}
          onSuccess={() => {
            setActiveItem(null);
          }}
        />
      )}
    </div>
  );
}
