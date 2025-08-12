import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const spicyLevels = ["sweet", "mild", "spicy"];
const dietTypes = ["veg", "non-veg", "vegan"];

export default function CurrentMenu({ hotelId }: CurrentMenuProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("");
  const [spicyLevelFilter, setSpicyLevelFilter] = useState("");
  const [dietTypeFilter, setDietTypeFilter] = useState("");
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
          item.meal_type === mealTypeFilter) &&
        (spicyLevelFilter === "" ||
          spicyLevelFilter === "all_spicy_levels" ||
          item.spicy_level === spicyLevelFilter) &&
        (dietTypeFilter === "" ||
          dietTypeFilter === "all_diet_types" ||
          item.diet_type === dietTypeFilter)
      );
    });

    const slice = filtered.slice(0, page * ITEMS_PER_PAGE);
    setVisibleItems(slice);
  }, [
    menuItems,
    categoryFilter,
    mealTypeFilter,
    spicyLevelFilter,
    dietTypeFilter,
    page,
  ]);

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
      spicy_level: item.spicy_level || "",
      diet_type: item.diet_type || "",
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
    <div className="bg-slate-50 relative min-h-[calc(100vh-80px)] pb-10">
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto flex-nowrap items-center mb-6 mt-4 scrollbar-hide">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs focus:outline-none focus:ring-0 focus:ring-offset-0">
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
          <SelectTrigger className="w-[140px] h-8 text-xs focus:outline-none focus:ring-0 focus:ring-offset-0">
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

        {/* Spicy Level Filter */}
        <Select value={spicyLevelFilter} onValueChange={setSpicyLevelFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs focus:outline-none focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Spicy Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_spicy_levels">All Spicy Levels</SelectItem>
            {spicyLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Diet Type Filter */}
        <Select value={dietTypeFilter} onValueChange={setDietTypeFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs focus:outline-none focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Diet Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_diet_types">All Diet Types</SelectItem>
            {dietTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
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

        <>
          {categories.map((category) => {
            const itemsInCategory = visibleItems.filter(item => item.category === category);
            if (itemsInCategory.length === 0) return null;

            return (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {itemsInCategory.map((item) => (




                    <div
                      key={item.id}
                      className="relative flex flex-row-reverse bg-white border border-gray-100 shadow-sm rounded-md items-stretch h-[140px] sm:h-[160px] w-full max-w-[400px] transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      onClick={() => handleEditClick(item)}
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
                        {/* Top Right Icons */}
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2 items-center">
                            <span className="text-sm" title={`Spicy: ${item.spicy_level}`}>
                              {item.spicy_level === "sweet" && "🧊"}
                              {item.spicy_level === "mild" && "🌶️"}
                              {item.spicy_level === "spicy" && "🌶️🌶️"}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-sm border flex items-center justify-center bg-white ${item.diet_type === "non-veg" ? "border-red-600" : "border-green-600"
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








                  ))}
                </div>
              </div>
            );
          })}

        </>



      )}

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Edit Dialog */}
      <Dialog open={!!activeItem} onOpenChange={(open) => setActiveItem(open ? activeItem : null)}>
        <DialogTrigger asChild>
          <div />
        </DialogTrigger>
        <DialogContent
  className="sm:max-w-md w-full sm:rounded-lg rounded-none sm:h-auto h-[100vh] max-h-[100vh] overflow-y-auto"
>

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

              {/* New Select for Spicy Level */}
              <div className="space-y-2">
                <Label>Spicy Level</Label>
                <Select
                  value={formValues.spicy_level}
                  onValueChange={(value) =>
                    setFormValues({ ...formValues, spicy_level: value })
                  }
                >
                  <SelectTrigger className="w-full focus:outline-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Select Spicy Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {spicyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Select for Diet Type */}
              <div className="space-y-2">
                <Label>Diet Type</Label>
                <Select
                  value={formValues.diet_type}
                  onValueChange={(value) =>
                    setFormValues({ ...formValues, diet_type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Diet Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dietTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
