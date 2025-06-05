import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Hotel, MenuItem } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Minus, Trash } from "lucide-react";
import ErrorBanner from "@/components/ui/error-banner";
import { useCart } from "@/lib/useCart";
import background from "@/assets/background.png";
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
    if (["breakfast", "lunch", "dinner"].includes(mealTypeFilter)) {
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
      <div className="min-h-screen bg-slate-50 relative">
        {/* Cart Button */}
        {/* Mini Cart Preview Bottom Sheet */}


        {cart.length > 0 && (
          <div
            onClick={() => setCartOpen(true)}
            className="fixed bottom-0 left-0 w-full z-50 cursor-pointer"
          >
            <div className="w-full bg-[#ef4f5f] text-white px-4 py-3 flex justify-between text-center items-center sm:py-4 sm:px-6 transition-all">
              <div className="w-full text-center">
                <p className="text-sm sm:text-base font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} item{cart.reduce((sum, item) => sum + item.quantity, 0) > 1 ? "s" : ""} added
                </p>
                <p className="text-xs sm:text-sm text-red-100">
                  ₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)} total
                </p>
              </div>
            </div>
          </div>
        )}

        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent
            side="bottom"
            className="w-full sm:w-[450px] max-h-[70vh] overflow-y-auto rounded-t-xl"
          >
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
            </SheetHeader>

            {cart.length === 0 ? (
              <div className="mt-6 text-gray-500">Your cart is empty.</div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="border" onClick={() => decreaseQuantity(item.id)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <Button size="icon" variant="ghost" className="border" onClick={() => increaseQuantity(item.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="border border-red-300 text-red-600" onClick={() => removeFromCart(item.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 text-sm font-medium text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)}</span>
                  </div>
                </div>
                <div className="p-4 bg-yellow-100 text-yellow-800 text-sm rounded-lg text-center">

                  📞 Dial <span className="font-semibold">{hotel.contact.Restaurant}</span> from your room to order.
                </div>






              </div>
            )}
          </SheetContent>
        </Sheet>


        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
          {/* Hotel Header */}


          <div className="relative bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 sm:p-6 md:p-8 mb-8 overflow-hidden text-center">
            <img
              src={background}
              alt="Decorative background"
              className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none rounded-xl"
            />
            <div className="flex justify-center px-4">
              <div className="relative z-0 text-center max-w-full sm:max-w-xl md:max-w-2xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-700 mb-2 break-words">
                  {hotel.name}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-2 break-words">
                  {hotel.description}
                </p>
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





          {/* Menu Items */}
          <div className="space-y-3">
            {Object.keys(groupedItems).map(category => (
              <div key={category} className="mt-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 px-2">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                  {groupedItems[category].map(item => {
                    const cartItem = cart.find(c => c.id === item.id);
                    const quantity = cartItem?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="flex gap-3 bg-white border border-gray-100 shadow-sm overflow-hidden p-0 items-center"
                      // style={{ height: '160px' }}
                      >
                        {/* Image + Button */}
                        <div className="flex flex-col items-center gap-1 w-[140px] sm:w-[160px] relative pb-6">
                          <div className="w-full aspect-[4/3]">
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div
                            className="absolute bottom-1 left-1/2 transform -translate-x-1/2"
                            style={{ width: '96px', height: '32px' }}
                          >
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart({ id: item.id, name: item.name, price: +item.price })}
                                className="w-full h-full bg-[#fff5f6] text-[#ef5463] rounded-md border border-[#ef5463] font-semibold text-sm shadow-sm hover:bg-gray-200 transition flex items-center justify-center"
                                style={{ padding: 0 }}
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="bg-[#ef5463] rounded-md shadow-sm px-2 py-1 flex items-center gap-1 w-full h-full">
                                <button
                                  onClick={() => decreaseQuantity(item.id)}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-sm text-white transition font-bold"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm text-white font-semibold w-5 text-center">{quantity}</span>
                                <button
                                  onClick={() => addToCart({ id: item.id, name: item.name, price: +item.price })}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-white transition font-bold"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg md:text-lg font-semibold text-gray-700">{item.name}</h3>
                          <p className="text-xs sm:text-sm md:text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                          <div className="text-sm sm:text-base md:text-base text-gray-700 mt-2">₹{item.price}</div>
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
