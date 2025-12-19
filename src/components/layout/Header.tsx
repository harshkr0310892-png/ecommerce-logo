import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ShoppingCart, Leaf, Heart, Search, TreePine } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBar } from "@/components/SearchBar";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (term: string) => {
    // Navigate to products page with search term
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-gradient-to-r from-green-50/20 via-card/10 to-emerald-50/20 dark:from-green-900/10 dark:via-card/5 dark:to-emerald-900/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-display text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-800 dark:from-green-400 dark:to-emerald-300 bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px] sm:max-w-none">
              Royal Eco<span className="hidden sm:inline"> Store</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link 
              to="/products" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Collection
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link 
              to="/track-order" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Track Order
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link 
              to="/contact-us" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Contact Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="scale-90 sm:scale-100">
              <ThemeToggle />
            </div>
            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="relative hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
        )}>
          <nav className="flex flex-col gap-4 mb-4">
            <Link 
              to="/" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Collection
            </Link>
            <Link 
              to="/wishlist" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wishlist
            </Link>
            <Link 
              to="/track-order" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Track Order
            </Link>
            <Link 
              to="/contact-us" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
          </nav>
          
          {/* Mobile Search Bar */}
          <div className="px-2">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search eco products..." 
              context="collection"
            />
          </div>
          
          {/* Eco Badge for Mobile */}
          <div className="mt-4 px-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <TreePine className="w-4 h-4" />
            <span>Sustainable & Eco-Friendly</span>
          </div>
        </div>
      </div>
    </header>
  );
};