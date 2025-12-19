import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchStore {
  // Separate search histories for different contexts
  collectionSearchHistory: string[];
  wishlistSearchHistory: string[];
  
  addSearchTerm: (term: string, context: 'collection' | 'wishlist') => void;
  removeSearchTerm: (term: string, context: 'collection' | 'wishlist') => void;
  clearSearchHistory: (context: 'collection' | 'wishlist') => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      collectionSearchHistory: [],
      wishlistSearchHistory: [],
      
      addSearchTerm: (term, context) => {
        const trimmedTerm = term.trim();
        if (!trimmedTerm) return;
        
        set((state) => {
          if (context === 'collection') {
            // Remove duplicates and add to the beginning
            const filteredHistory = state.collectionSearchHistory.filter(
              (item) => item.toLowerCase() !== trimmedTerm.toLowerCase()
            );
            return {
              collectionSearchHistory: [trimmedTerm, ...filteredHistory].slice(0, 10) // Keep only last 10 items
            };
          } else {
            // Remove duplicates and add to the beginning
            const filteredHistory = state.wishlistSearchHistory.filter(
              (item) => item.toLowerCase() !== trimmedTerm.toLowerCase()
            );
            return {
              wishlistSearchHistory: [trimmedTerm, ...filteredHistory].slice(0, 10) // Keep only last 10 items
            };
          }
        });
      },
      
      removeSearchTerm: (term, context) => {
        set((state) => {
          if (context === 'collection') {
            return {
              collectionSearchHistory: state.collectionSearchHistory.filter(
                (item) => item.toLowerCase() !== term.toLowerCase()
              )
            };
          } else {
            return {
              wishlistSearchHistory: state.wishlistSearchHistory.filter(
                (item) => item.toLowerCase() !== term.toLowerCase()
              )
            };
          }
        });
      },
      
      clearSearchHistory: (context) => {
        if (context === 'collection') {
          set({ collectionSearchHistory: [] });
        } else {
          set({ wishlistSearchHistory: [] });
        }
      },
    }),
    {
      name: 'royal-search-history',
    }
  )
);