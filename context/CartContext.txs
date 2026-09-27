"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  images: { url: string }[];
}

export interface CartItemType {
  id?: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartContextType {
  cart: CartItemType[];
  addToCart: (product: CartProduct, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartItemType[]>([]);

  // Load initial cart
  useEffect(() => {
    if (status === "authenticated") {
      const guestStored = localStorage.getItem("shopsphere_guest_cart");
      const guestItems = guestStored ? JSON.parse(guestStored) : [];

      if (guestItems.length > 0) {
        // Sync guest items into user account
        fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestItems }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.items) setCart(data.items);
            localStorage.removeItem("shopsphere_guest_cart");
          })
          .catch(console.error);
      } else {
        // Just fetch user's database cart
        fetch("/api/cart")
          .then((res) => res.json())
          .then((data) => {
            if (data.items) setCart(data.items);
          })
          .catch(console.error);
      }
    } else if (status === "unauthenticated") {
      const guestStored = localStorage.getItem("shopsphere_guest_cart");
      if (guestStored) {
        try {
          setCart(JSON.parse(guestStored));
        } catch {
          setCart([]);
        }
      }
    }
  }, [status]);

  const persistGuestCart = (newCart: CartItemType[]) => {
    setCart(newCart);
    localStorage.setItem("shopsphere_guest_cart", JSON.stringify(newCart));
  };

  const addToCart = async (product: CartProduct, quantity = 1) => {
    const existingIndex = cart.findIndex((i) => i.productId === product.id);
    const newQty = existingIndex > -1 ? cart[existingIndex].quantity + quantity : quantity;

    if (status === "authenticated") {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: newQty }),
      });
      const data = await res.json();
      if (data.items) setCart(data.items);
    } else {
      let updated: CartItemType[];
      if (existingIndex > -1) {
        updated = [...cart];
        updated[existingIndex].quantity = newQty;
      } else {
        updated = [...cart, { productId: product.id, quantity, product }];
      }
      persistGuestCart(updated);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (status === "authenticated") {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (data.items) setCart(data.items);
    } else {
      let updated: CartItemType[];
      if (quantity <= 0) {
        updated = cart.filter((i) => i.productId !== productId);
      } else {
        updated = cart.map((i) => (i.productId === productId ? { ...i, quantity } : i));
      }
      persistGuestCart(updated);
    }
  };

  const removeFromCart = async (productId: string) => {
    await updateQuantity(productId, 0);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("shopsphere_guest_cart");
  };

  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => {
    const unitPrice = item.product.discountPrice ?? item.product.price;
    return acc + unitPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}