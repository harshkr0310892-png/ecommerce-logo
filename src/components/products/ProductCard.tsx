import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Eye, Share2, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  discount_percentage: number;
  image_url: string | null;
  images?: string[] | null;
  stock_status: string;
  stock_quantity?: number | null;
  index?: number;
  cash_on_delivery?: boolean;
}

export function ProductCard({ 
  id, 
  name, 
  price, 
  discount_percentage, 
  image_url,
  images,
  stock_status,
  stock_quantity,
  index = 0,
  cash_on_delivery
}: ProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist, clearNewItemFlag } = useWishlistStore();
  const discountedPrice = price * (1 - discount_percentage / 100);
  const isSoldOut = stock_status === 'sold_out';
  const isLowStock = stock_status === 'low_stock';
  const displayImage = (images && images.length > 0) ? images[0] : image_url;
  const isWishlisted = isInWishlist(id);

  // Check if product has variants
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants-check', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', id)
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const hasVariants = variants && variants.length > 0;

  // Clear animation flag after initial render
  useEffect(() => {
    if (isWishlisted) {
      // Set a timeout to clear the animation flag
      const timer = setTimeout(() => {
        clearNewItemFlag(id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isWishlisted, id, clearNewItemFlag]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSoldOut) return;
    
    // If still loading variant info, show loading state
    if (variantsLoading) {
      toast.info('Checking product details...');
      return;
    }
    
    // If product has variants, redirect to product page to select them
    if (hasVariants) {
      toast.info('Please select options before adding to cart');
      navigate(`/product/${id}`);
      return;
    }
    
    // If no variants, add directly to cart
    addItem({
      id,
      name,
      price,
      discount_percentage,
      image_url: displayImage,
      cash_on_delivery: cash_on_delivery,
    });
    toast.success(`${name} added to cart!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(id);
      toast.success(`${name} removed from wishlist`);
    } else {
      // If still loading variant info, show loading state
      if (variantsLoading) {
        toast.info('Checking product details...');
        return;
      }
      
      // If product has variants, redirect to product page to select them
      if (hasVariants) {
        toast.info('Please select options before adding to wishlist');
        navigate(`/product/${id}`);
        return;
      }
      
      // If no variants, add directly to wishlist
      addToWishlist({
        id,
        name,
        price,
        discount_percentage,
        image_url: displayImage,
        cash_on_delivery: cash_on_delivery,
      });
      toast.success(`${name} added to wishlist!`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productUrl = `${window.location.origin}/product/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Check out this amazing product: ${name}`,
          url: productUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        copyToClipboard(productUrl);
      }
    } else {
      copyToClipboard(productUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy link');
    });
  };

  const getStockDisplay = () => {
    if (isSoldOut) return "Sold Out";
    if (isLowStock) return "Low Stock";
    return "In Stock";
  };

  return (
    <div className="group relative bg-card rounded-lg border border-border/80 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="relative aspect-square overflow-hidden">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <Crown className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount_percentage > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-bold gradient-gold text-white shadow-md">
              -{discount_percentage}%
            </span>
          )}
          {isSoldOut && (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground shadow-md">
              Sold Out
            </span>
          )}
          {isLowStock && !isSoldOut && (
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
              Low Stock
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className={cn(
          "absolute bottom-2 right-2 flex gap-1",
          "transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          "transition-all duration-300"
        )}>
          <Link to={`/product/${id}`}>
            <Button size="icon" variant="secondary" className="rounded-full w-8 h-8 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background">
              <Eye className="w-3 h-3 text-primary" />
            </Button>
          </Link>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full w-8 h-8 bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background"
            onClick={handleShare}
          >
            <Share2 className="w-3 h-3 text-primary" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className={cn(
              "rounded-full w-8 h-8 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-light-blue-500/20 hover:border-blue-500/50 transition-all duration-300",
              isWishlisted && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={handleToggleWishlist}
          >
            <Heart className={cn("w-3 h-3", isWishlisted && "fill-current animate-pulse")} />
          </Button>
          <Button 
            size="icon" 
            variant="royal" 
            className="rounded-full w-8 h-8"
            onClick={handleAddToCart}
            disabled={isSoldOut}
          >
            <ShoppingBag className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Link to={`/product/${id}`} className="block p-3">
        <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        <div className="mt-1 flex items-center gap-2">
          {discount_percentage > 0 ? (
            <>
              <span className="font-display text-base font-bold text-primary">
                ₹{discountedPrice.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                ₹{price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-display text-base font-bold text-primary">
              ₹{price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock indicator */}
        <div className="mt-2 flex items-center gap-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isSoldOut ? "bg-destructive" : isLowStock ? "bg-yellow-500" : "bg-green-500"
          )} />
          <span className={cn(
            "text-xs",
            isSoldOut ? "text-destructive" : isLowStock ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
          )}>
            {getStockDisplay()}
          </span>
        </div>
      </Link>
    </div>
  );
}