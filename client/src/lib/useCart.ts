import { useEffect, useState } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(item: { id: string; name: string; price: number }) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function increaseQuantity(id: string) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  }

  function decreaseQuantity(id: string) {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        if (i.quantity === 1) {
          return null; // remove if quantity becomes 0
        }
        return { ...i, quantity: i.quantity - 1 };
      }
      return i;
    }).filter(Boolean) as CartItem[]);
  }

  return { cart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity };
}
