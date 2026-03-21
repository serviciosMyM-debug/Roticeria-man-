'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const found = state.items.find((i) => i.id === item.id);
          if (found) {
            const quantity = Math.min(found.quantity + 1, found.stock);
            return { items: state.items.map((i) => (i.id === item.id ? { ...i, quantity } : i)) };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i))
            .filter((i) => i.quantity > 0)
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] })
    }),
    { name: 'gastro-cart' }
  )
);
