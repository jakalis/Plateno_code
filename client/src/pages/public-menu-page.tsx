import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Hotel, MenuItem } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Minus, Trash } from "lucide-react";
import ErrorBanner from "@/components/ui/error-banner";
import { useCart } from "@/lib/useCart";
import background from "@/assets/background.png"; 
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function PublicMenuPage() {
  const { hotelId } = useParams();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);

  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${hotelId}`],
  });

  const { data: menuItems, isLoading: menuLoading, error: menuError } = useQuery<MenuItem[]>({
    queryKey: [`/api/hotels/${hotelId}/menu-items`],
    enabled: !!hotel && hotel.is_active,
  });

  const isLoading = hotelLoading || menuLoading;
  const error = hotelError || menuError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <ErrorBanner
            title="Error loading menu"
            message={(error as Error)?.message || "This hotel's menu is currently unavailable."}
          />
        </div>
      </div>
    );
  }

  if (!hotel.is_active) {
    return (
      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <ErrorBanner
            title="Menu Unavailable"
            message="This hotel's menu is currently unavailable."
          />
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(menuItems?.map(item => item.category) || []));

  const filteredMenuItems = menuItems?.filter(item => {
    if (mealTypeFilter === "all") return true;
    if (mealTypeFilter === "breakfast" || mealTypeFilter === "lunch" || mealTypeFilter === "dinner") {
      return item.meal_type.toLowerCase().includes(mealTypeFilter.toLowerCase()) || item.meal_type.toLowerCase() === "all day";
    }
  }) || [];

  const categoryFilteredMenuItems = filteredMenuItems.filter(item => {
    if (categoryFilter === "all") return true;
    return item.category.toLowerCase().includes(categoryFilter.toLowerCase());
  }) || [];

  const groupedItems: Record<string, MenuItem[]> = {};

  categoryFilteredMenuItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  return (
    <PublicLayout hotelId={hotelId!}>
      <div className="min-h-screen bg-slate-50 py-6 relative">
        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="fixed top-20 right-4 flex items-center gap-2 bg-white/80 text-gray-700 font-medium px-4 py-2 rounded-full border border-gray-300 shadow-md backdrop-blur-sm hover:bg-white transition-all duration-200 z-50"
        >
          <span>Cart</span>
          <span className="bg-gray-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        </button>

        {/* Cart modal */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent className="w-[400px] sm:w-[450px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
            </SheetHeader>

            {cart.length === 0 ? (
              <div className="mt-6 text-gray-500">Your cart is empty.</div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {/* Cart Items */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="border border-gray-300 hover:bg-gray-100"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="border border-gray-300 hover:bg-gray-100"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="border border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal - Appears naturally after list */}
                <div className="pt-4 text-sm font-medium text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      ₹
                      {cart.reduce((total, item) => total + item.price * item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hotel Info */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hotel Info */}
            <div className="relative bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-8 mb-8 overflow-hidden">
              {/* Background Image */}
              <img
                src={background} // Replace with your image path
                alt="Decorative background"
                className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none rounded-xl"
              />

              {/* Content on top */}
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{hotel.name}</h1>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl">{hotel.description}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
                <SelectItem value="all">All Meal Types</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Menu Display */}
          <div className="w-full px-0 mx-0">
            {Object.keys(groupedItems).map(category => (
              <div key={category} className="mb-6">
                <h2 className="text-2xl font-semibold mb-4 px-2">{category}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-2">
                  {groupedItems[category].map(item => {
                    const cartItem = cart.find(c => c.id === item.id);
                    const quantity = cartItem?.quantity || 0;
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col w-full">
                        {/* Image */}
                        <img
                          src={item.photo_url}
                          alt={item.name}
                          className="h-32 w-full object-contain rounded-md mb-3"
                        />

                        {/* Name */}
                        <h3 className="text-sm font-semibold mb-1">{item.name}</h3>

                        {/* Description */}
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                        {/* Price and Buttons */}
                        <div className="mt-auto flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-800">₹{item.price}</div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              disabled={quantity === 0}
                              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-200 text-sm ${quantity === 0
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                                }`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="text-sm font-semibold w-6 text-center">{quantity}</span>

                            <button
                              onClick={() =>
                                addToCart({ id: item.id, name: item.name, price: +item.price })
                              }
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-green-600 border border-green-300 hover:bg-green-50 hover:border-green-400 transition-colors duration-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
