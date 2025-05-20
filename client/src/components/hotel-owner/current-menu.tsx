import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CurrentMenuProps {
  hotelId: string;
}

const ITEMS_PER_PAGE = 10;

export default function CurrentMenu({ hotelId }: CurrentMenuProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [formValues, setFormValues] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [visibleItems, setVisibleItems] = useState<MenuItem[]>([]);
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: menuItems,
    isLoading,
    error,
    refetch,
  } = useQuery<MenuItem[]>({
    queryKey: [`/api/hotels/${hotelId}/menu-items`],
  });

  useEffect(() => {
    if (!menuItems) return;
    const approved = menuItems.filter((item) => item.is_approved);
    const filtered = approved.filter((item) => {
      return (
        (categoryFilter === "" ||
          categoryFilter === "all_categories" ||
          item.category === categoryFilter) &&
        (mealTypeFilter === "" ||
          mealTypeFilter === "all_meal_types" ||
          item.meal_type === mealTypeFilter)
      );
    });

    const slice = filtered.slice(0, page * ITEMS_PER_PAGE);
    setVisibleItems(slice);
  }, [menuItems, categoryFilter, mealTypeFilter, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreRef.current]);

  const categories = Array.from(
    new Set(menuItems?.map((item) => item.category) ?? [])
  );
  const mealTypes = Array.from(
    new Set(menuItems?.map((item) => item.meal_type) ?? [])
  );

  const handleEditClick = (item: MenuItem) => {
    setActiveItem(item);
    setFormValues({
      name: item.name,
      price: String(item.price),
      category: item.category,
      meal_type: item.meal_type,
      available_till: item.available_till,
      description: item.description,
      photo_url: item.photo_url || "",
    });
  };

  const handleUpdate = async () => {
    if (!activeItem) return;
  
    const res = await fetch("/api/menu-update-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: activeItem.id,
        requested_changes: {
          ...formValues,
          price: parseFloat(formValues.price),
        },
      }),
    });
  
    if (res.ok) {
      toast({
        title: "Submitted for Review",
        description: "Your changes have been sent to the admin for approval.",
      });
      setActiveItem(null);
      await refetch();
    } else {
      toast({
        title: "Error",
        description: "Failed to submit update for review.",
      });
    }
  };
  
  

  const handleDelete = async () => {
    if (!activeItem) return;

    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/menu-items/${activeItem.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast({ title: "Deleted", description: "Item deleted successfully." });
      setActiveItem(null);
      await refetch();
    } else {
      toast({ title: "Error", description: "Failed to delete item." });
    }
  };

  return (
    <div className="px-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-6 mt-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_categories">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
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

      {/* Menu Items */}
      {isLoading ? (
        <div className="text-center py-10">Loading menu items...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          Error loading menu items
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          No menu items available. Add new items from the "Add New Item" tab.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-4 flex gap-4 items-start transition-transform duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
              onClick={() => handleEditClick(item)}
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
                    {/* <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Approved
                    </span> */}
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
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Edit Dialog */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>

          {formValues && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues({ ...formValues, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={formValues.price}
                  onChange={(e) =>
                    setFormValues({ ...formValues, price: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formValues.category}
                  onChange={(e) =>
                    setFormValues({ ...formValues, category: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Input
                  value={formValues.meal_type}
                  onChange={(e) =>
                    setFormValues({ ...formValues, meal_type: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Available Till</Label>
                <Input
                  value={formValues.available_till}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      available_till: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
                <Button onClick={handleUpdate}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
