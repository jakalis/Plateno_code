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

import {
  MdRestaurantMenu,
  MdSoupKitchen,
  MdBakeryDining,
  MdLocalDrink,
  MdFastfood,
  MdLocalCafe,
  MdWhatshot,
  MdIcecream,
  MdLocalPizza,
  MdOutdoorGrill,
  MdLocalFlorist,
  MdGrain,
  MdRamenDining,
  MdWaves,
  MdKitchen,
  MdMoreHoriz,
  MdLocalDining
} from "react-icons/md";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";



export default function PublicMenuPage() {
  const { hotelId } = useParams();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  const [spicyLevelFilter, setSpicyLevelFilter] = useState<string>("all");
  const [dietTypeFilter, setDietTypeFilter] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
const [guestName, setGuestName] = useState("");
const [roomNumber, setRoomNumber] = useState("");

const categoryIcons: Record<string, JSX.Element> = {
  all: <MdRestaurantMenu size={24} />,
  starters: <MdFastfood size={24} />,
  soup: <MdSoupKitchen size={24} />,
  salad: <MdLocalFlorist size={24} />,
  mains: <MdRestaurantMenu size={24} />,
  curry: <MdWhatshot size={24} />,
  bread: <MdBakeryDining size={24} />,
  rice: <MdGrain size={24} />,
  noodles: <MdRamenDining size={24} />,
  bbq: <MdOutdoorGrill size={24} />,
  pizza: <MdLocalPizza size={24} />,
  burger: <MdFastfood size={24} />,
  seafood: <MdWaves size={24} />,
  desserts: <MdIcecream size={24} />,
  drinks: <MdLocalDrink size={24} />,
  coffee: <MdLocalCafe size={24} />,
  sides: <MdKitchen size={24} />,
  other: <MdMoreHoriz size={24} />, 
};


  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${hotelId}`],
  });

  const { data: menuItems, isLoading: menuLoading, error: menuError } = useQuery<MenuItem[]>({
    queryKey: [`/api/hotels/${hotelId}/menu-items`],
    enabled: !!hotel && hotel.is_active,
  });

  const isSoldOut = (available_till?: string) => {
    if (!available_till) return false;

    const [hours, minutes] = available_till.split(":").map(Number);

    const now = new Date();
    const tillTime = new Date();
    tillTime.setHours(hours, minutes, 0, 0);

    return now > tillTime;
  };


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

const handleSendWhatsApp = () => {
  if (!guestName || !roomNumber) {
    setConfirmOpen(true);
    return;
  }

  const itemsText = cart
    .map(item => `• ${item.name} × ${item.quantity}  –  ₹${item.price * item.quantity}`)
    .join("\n");

  const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);

const message = 
`Room Service Order

Name: ${guestName}
Room: ${roomNumber}

Items
${cart.map(i => `• ${i.name} × ${i.quantity}  –  ₹${i.price * i.quantity}`).join("\n")}

Total: ₹${total}

——————————————
Served with care by Plater — Good food, right to your room.`;


  const phone = hotel.contact?.Restaurant ?? "";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
};



  const filteredMenuItems = (menuItems || []).filter(item => {
    const matchesMealType =
      mealTypeFilter === "all" ||
      item.meal_type.toLowerCase().includes(mealTypeFilter) ||
      item.meal_type.toLowerCase() === "all day";

    const matchesCategory =
      categoryFilter === "all" ||
      item.category?.trim().toLowerCase() === categoryFilter.trim().toLowerCase();

    const matchesSpicy =
      spicyLevelFilter === "all" || item.spicy_level === spicyLevelFilter;

    const matchesDiet =
      dietTypeFilter === "all" || item.diet_type === dietTypeFilter;

    return matchesMealType && matchesCategory && matchesSpicy && matchesDiet;
  });

  const groupedItems: Record<string, MenuItem[]> = {};
  filteredMenuItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  return (
    <PublicLayout hotelId={hotelId!} hotelName={hotel.name}>
      <div className="min-h-screen bg-slate-50 relative">
        {/* Cart Button */}
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

          <div className="mt-6 space-y-4">
            {/* 📞 Call Option */}
            <div className="flex flex-col items-center bg-yellow-100 text-yellow-800 rounded-lg p-2 shadow-sm">
              <p className="text-sm font-medium flex items-center gap-1">
                📞 Dial <span className="font-semibold text-base">
                  {hotel.contact?.Restaurant}
                </span> from your room to order
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center justify-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-3 text-gray-500 text-sm font-semibold">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* ✅ WhatsApp Button */}
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-md"
              onClick={handleSendWhatsApp}
            >
              💬 Send on WhatsApp
            </Button>
          </div>





              </div>
            )}
          </SheetContent>
        </Sheet>


        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Your Stay</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 mt-2">
      <Input
        placeholder="Your Name"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
      />
      <Input
        placeholder="Room Number"
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
      />
    </div>

    <DialogFooter>
      <Button
        onClick={() => {
          if (guestName && roomNumber) {
            setConfirmOpen(false);
            handleSendWhatsApp(); // re-invoke after user input
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Send
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
          {/* <div className="relative bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 sm:p-6 md:p-8 mb-8   text-center">
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
                <p className="text-base sm:text-lg text-gray-600 mb-2 break-words line-clamp-1">
                  {hotel.description}
                </p>
              </div>
            </div>
          </div> */}











<div className="mb-4 overflow-x-auto scrollbar-hide">
  <div className="flex gap-4 min-w-max px-2">
    {/* "All" tab */}
    <button
      className={`flex flex-col items-center justify-center cursor-pointer w-16 h-16 rounded-md border transition-colors duration-200 ${
        categoryFilter === "all"
          ? "border-[#ef4f5f] bg-[#ef4f5f]  text-white"
          : "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"
      }`}
      onClick={() => setCategoryFilter("all")}
      aria-label="All Categories"
    >
      <div className="mb-1">{categoryIcons["all"]}</div>
      <span className="text-xs font-semibold">All</span>
    </button>

    {/* Dynamically render categories */}
    {categories.map((category) => {
      const key = category.toLowerCase();
      return (
        <button
          key={category}
          className={`flex flex-col items-center justify-center cursor-pointer w-16 h-16 rounded-md border transition-colors duration-200 ${
            categoryFilter === key
              ? "border-[#ef4f5f] bg-[#ef4f5f] text-white"
              : "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"
          }`}
          onClick={() => setCategoryFilter(key)}
          aria-label={category}
        >
          <div className="mb-1">{categoryIcons[key] || <MdLocalDining size={24} />}</div>
          <span className="text-xs font-semibold">{category}</span>
        </button>
      );
    })}


  </div>
</div>






              {/* <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[100px] focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue>{categoryFilter === "all" ? "Course" : categoryFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}











          {/* Filters */}
<div className="mb-6 overflow-x-auto scrollbar-hide">
  <div className="flex gap-4 min-w-max px-1">

    {/* Meal Type Filter */}
    <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
      <SelectTrigger
        className={`w-20 h-8 px-2 flex items-center justify-center border transition-colors duration-200 rounded-sm focus:outline-none focus:ring-0
          ${
            mealTypeFilter === "all"
              ? "border-gray-300 text-gray-700 hover:border-red-500"
              : "bg-red-100 border-red-500 text-red-700"
          }`}
      >
        <SelectValue>{mealTypeFilter === "all" ? "Meal" : mealTypeFilter}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="breakfast">Breakfast</SelectItem>
        <SelectItem value="lunch">Lunch</SelectItem>
        <SelectItem value="dinner">Dinner</SelectItem>
      </SelectContent>
    </Select>

    {/* Spicy Level Filter */}
    <Select value={spicyLevelFilter} onValueChange={setSpicyLevelFilter}>
      <SelectTrigger
        className={`w-20 h-8 px-2 flex items-center justify-center border transition-colors duration-200 rounded-sm focus:outline-none focus:ring-0
          ${
            spicyLevelFilter === "all"
              ? "border-gray-300 text-gray-700 hover:border-red-500"
              : "bg-red-100 border-red-500 text-red-700"
          }`}
      >
        <SelectValue>{spicyLevelFilter === "all" ? "Spicy" : spicyLevelFilter}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="sweet">Sweet</SelectItem>
        <SelectItem value="mild">Mild</SelectItem>
        <SelectItem value="spicy">Spicy</SelectItem>
      </SelectContent>
    </Select>

    {/* Diet Type Filter */}
    <Select value={dietTypeFilter} onValueChange={setDietTypeFilter}>
      <SelectTrigger
        className={`w-20 h-8 px-2 flex items-center justify-center border transition-colors duration-200 rounded-sm focus:outline-none focus:ring-0
          ${
            dietTypeFilter === "all"
              ? "border-gray-300 text-gray-700 hover:border-red-500"
              : "bg-red-100 border-red-500 text-red-700"
          }`}
      >
        <SelectValue>{dietTypeFilter === "all" ? "Diet" : dietTypeFilter}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="veg">Veg</SelectItem>
        <SelectItem value="non-veg">Non-Veg</SelectItem>
        <SelectItem value="vegan">Vegan</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>



          {/* <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max px-1">
              <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                <SelectTrigger className="w-[100px] focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue>{mealTypeFilter === "all" ? "Meal" : mealTypeFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>

              <Select value={spicyLevelFilter} onValueChange={setSpicyLevelFilter}>
                <SelectTrigger className="w-[100px] focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue>{spicyLevelFilter === "all" ? "Spicy" : spicyLevelFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sweet">Sweet</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="spicy">Spicy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dietTypeFilter} onValueChange={setDietTypeFilter}>
                <SelectTrigger className="w-[100px] focus:outline-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue>{dietTypeFilter === "all" ? "Diet" : dietTypeFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="veg">Veg</SelectItem>
                  <SelectItem value="non-veg">Non-Veg</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div> */}


          {/* Menu Items */}
          <div className="space-y-3 pb-28">
            {Object.keys(groupedItems).map(category => (
              <div key={category} className="mt-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 px-2">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-1">





                  {groupedItems[category].map(item => {
                    const cartItem = cart.find(c => c.id === item.id);
                    const quantity = cartItem?.quantity || 0;
                    const soldOut = isSoldOut(item.available_till);






                    return (
                      <div
                        key={item.id}
                        className="relative flex flex-row-reverse  bg-white border border-gray-100 shadow-sm rounded-md   items-stretch h-[140px] sm:h-[160px]"
                      >
                        {/* Sold Out Overlay */}
                        {soldOut && (
                          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-md shadow-sm border border-gray-300">
                              Time’s Up!
                            </span>
                          </div>
                        )}

                        {/* Image */}
                        <div className="w-[130px] sm:w-[150px] h-full relative">
                          <img
                            src={item.photo_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />

                          {/* Add/Qty Buttons */}
                          {!soldOut && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[96px] h-[32px]">
                              {quantity === 0 ? (
                                <button
                                  onClick={() =>
                                    addToCart({ id: item.id, name: item.name, price: +item.price })
                                  }
                                  className="w-full h-full bg-[#fff5f6] text-[#ef5463] rounded-md border border-[#ef5463] font-semibold text-sm shadow-sm hover:bg-gray-200 transition flex items-center justify-center"
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
                                  <span className="text-sm text-white font-semibold w-5 text-center">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      addToCart({ id: item.id, name: item.name, price: +item.price })
                                    }
                                    className="w-6 h-6 flex items-center justify-center rounded-md text-white transition font-bold"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Text and Icons */}
                        <div className="flex-1 h-full p-3 flex flex-col justify-between">
                          {/* Top Icons */}
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2 items-center">


                              {/* Diet Type */}
                              <div
                                className={`w-5 h-5 rounded-sm border flex items-center justify-center bg-white ${item.diet_type === "non-veg"
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


                              {/* Spicy Level */}
                              <span className="text-sm" title={`Spicy: ${item.spicy_level}`}>
                                {item.spicy_level === "sweet" && "🧊"}
                                {item.spicy_level === "mild" && "🌶️"}
                                {item.spicy_level === "spicy" && "🌶️🌶️"}
                              </span>

                            </div>
                          </div>

                          {/* Name & Desc */}
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                              {item.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-sm sm:text-base font-semibold text-gray-800 mt-1">
                            ₹{item.price}
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
