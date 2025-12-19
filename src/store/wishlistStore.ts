import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  discount_percentage: number;
  image_url: string | null;
  cash_on_delivery?: boolean;
  variant_info?: {
    variant_id: string;
    attribute_name: string;
    attribute_value: string;
  } | null;
  // Animation flag for newly added items
  isNewlyAdded?: boolean;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
  // Method to clear the animation flag
  clearNewItemFlag: (id: string) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          // Check if item already exists in wishlist
          const exists = state.items.some((i) => i.id === item.id);
          if (exists) {
            // If it exists, just make sure the animation flag is cleared
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, isNewlyAdded: false } : i
              ),
            };
          }
          
          // Add item with animation flag
          const newItem = { ...item, isNewlyAdded: true };
          return { items: [...state.items, newItem] };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      isInWishlist: (id) => {
        return get().items.some((item) => item.id === id);
      },
      
      clearWishlist: () => set({ items: [] }),
      
      getItemCount: () => {
        return get().items.length;
      },
      
      clearNewItemFlag: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isNewlyAdded: false } : item
          ),
        }));
      },
    }),
    {
      name: 'royal-wishlist-storage',
    }
  )
);