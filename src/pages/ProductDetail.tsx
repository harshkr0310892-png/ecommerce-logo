import { useParams, Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ArrowLeft, Minus, Plus, Crown, ChevronLeft, ChevronRight, Share2, X, ZoomIn, Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VariantSelector } from "@/components/products/VariantSelector";

interface SelectedVariant {
  id: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  attribute_name: string;
  value_name: string;
  image_urls?: string[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('description');
  const imageRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist, clearNewItemFlag } = useWishlistStore();
  
  const isWishlisted = isInWishlist(id || "");

  // Clear animation flag after initial render
  useEffect(() => {
    if (isWishlisted) {
      // Set a timeout to clear the animation flag
      const timer = setTimeout(() => {
        clearNewItemFlag(id || "");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isWishlisted, id, clearNewItemFlag]);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Parse features from product data
  const productFeatures = product?.features 
    ? Array.isArray(product.features) 
      ? product.features.map((f: any) => typeof f === 'string' ? f : f.feature || '')
      : []
    : [];
  
  // Get height, width, and weight from product data
  const height = (product as any)?.height || null;
  const width = (product as any)?.width || null;
  const weight = (product as any)?.weight || null;

  const handleVariantChange = (variant: any, attributeName: string, valueName: string) => {
    if (variant) {
      setSelectedVariant({
        id: variant.id,
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        is_available: variant.is_available,
        attribute_name: attributeName,
        value_name: valueName,
        image_urls: Array.isArray(variant.image_urls) ? variant.image_urls : [],
      });
    } else {
      setSelectedVariant(null);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const displayImage = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;
    const finalPrice = selectedVariant ? selectedVariant.price : Number(product.price);
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: finalPrice,
        discount_percentage: selectedVariant ? 0 : (product.discount_percentage || 0),
        image_url: displayImage,
        variant_info: selectedVariant ? {
          variant_id: selectedVariant.id,
          attribute_name: selectedVariant.attribute_name,
          attribute_value: selectedVariant.value_name,
        } : undefined,
        cash_on_delivery: (product as any).cash_on_delivery || false,
      });
    }
    toast.success(`Added ${quantity} ${product.name}${selectedVariant ? ` (${selectedVariant.value_name})` : ''} to cart!`);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    
    const displayImage = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;
    const finalPrice = selectedVariant ? selectedVariant.price : Number(product.price);
    
    if (isWishlisted) {
      removeFromWishlist(id || "");
      toast.success(`${product.name} removed from wishlist`);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: finalPrice,
        discount_percentage: selectedVariant ? 0 : (product.discount_percentage || 0),
        image_url: displayImage,
        variant_info: selectedVariant ? {
          variant_id: selectedVariant.id,
          attribute_name: selectedVariant.attribute_name,
          attribute_value: selectedVariant.value_name,
        } : undefined,
        cash_on_delivery: (product as any).cash_on_delivery || false,
      });
      toast.success(`${product.name} added to wishlist!`);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    
    const productUrl = `${window.location.origin}/product/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this amazing product: ${product.name}`,
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

  const actualPrice = selectedVariant ? selectedVariant.price : Number(product?.price || 0);
  const discountedPrice = selectedVariant ? actualPrice : actualPrice * (1 - (product?.discount_percentage || 0) / 100);
  const isSoldOut = selectedVariant 
    ? (!selectedVariant.is_available || selectedVariant.stock_quantity === 0)
    : product?.stock_status === 'sold_out';
  const isLowStock = selectedVariant 
    ? (selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 5)
    : product?.stock_status === 'low_stock';
  const stockQuantity = selectedVariant ? selectedVariant.stock_quantity : (product?.stock_quantity || 0);
  
  // Get all images - combine images array with legacy image_url and variant images
  const allImages = (() => {
    // If a variant is selected and has images, use those
    if (selectedVariant && selectedVariant.image_urls && selectedVariant.image_urls.length > 0) {
      return selectedVariant.image_urls;
    }
    
    // Otherwise use product images
    return product?.images && product.images.length > 0 
      ? product.images 
      : (product?.image_url ? [product.image_url] : []);
  })();

  const nextImage = () => {
    if (!allImages.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    if (!allImages.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const getStockDisplay = () => {
    if (isSoldOut) return "Out of Stock";
    if (isLowStock && stockQuantity > 0) return `Only ${stockQuantity} left!`;
    if (stockQuantity > 0) return `${stockQuantity} in stock`;
    return "In Stock";
  };

  // Fullscreen functions
  const openFullscreen = () => {
    setIsFullscreen(true);
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  // Zoom functions for fullscreen
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - zoomPosition.x,
      y: e.clientY - zoomPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setZoomPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Pan functions for keyboard navigation when zoomed
  const panLeft = () => {
    if (zoomLevel > 1) {
      setZoomPosition(prev => ({ ...prev, x: prev.x + 50 }));
    }
  };

  const panRight = () => {
    if (zoomLevel > 1) {
      setZoomPosition(prev => ({ ...prev, x: prev.x - 50 }));
    }
  };

  const panUp = () => {
    if (zoomLevel > 1) {
      setZoomPosition(prev => ({ ...prev, y: prev.y + 50 }));
    }
  };

  const panDown = () => {
    if (zoomLevel > 1) {
      setZoomPosition(prev => ({ ...prev, y: prev.y - 50 }));
    }
  };

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'Escape') {
          closeFullscreen();
        } else if (e.key === 'ArrowLeft') {
          if (e.shiftKey) {
            panLeft();
          } else {
            prevImage();
          }
        } else if (e.key === 'ArrowRight') {
          if (e.shiftKey) {
            panRight();
          } else {
            nextImage();
          }
        } else if (e.key === 'ArrowUp') {
          panUp();
        } else if (e.key === 'ArrowDown') {
          panDown();
        } else if (e.key === '+' || e.key === '=') {
          handleZoomIn();
        } else if (e.key === '-' || e.key === '_') {
          handleZoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, zoomLevel, currentImageIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFullscreen && zoomLevel <= 1) {
      // For fullscreen navigation
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (!isFullscreen) {
      // For main image gallery navigation
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else {
      // For zoomed image panning
      if (e.touches.length === 1) {
        handleMouseDown(e.touches[0] as unknown as React.MouseEvent);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isFullscreen && zoomLevel <= 1) {
      // Scrolling is prevented by CSS when in fullscreen
      return;
    } else if (!isFullscreen) {
      // Allow normal touch scrolling for main gallery
      return;
    } else {
      // For zoomed image panning or pinch zoom
      if (e.touches.length === 1) {
        handleMouseMove(e.touches[0] as unknown as React.MouseEvent);
      } else if (e.touches.length === 2 && isFullscreen) {
        // Pinch zoom functionality
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (touchStart.x !== 0) {
          const scale = currentDistance / touchStart.x;
          const newZoomLevel = Math.min(Math.max(zoomLevel * scale, 1), 3);
          setZoomLevel(newZoomLevel);
        }
        
        setTouchStart({
          x: currentDistance,
          y: 0
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isFullscreen && zoomLevel <= 1) {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };
      
      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      
      // Minimum swipe distance
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - previous image
          prevImage();
        } else {
          // Swipe left - next image
          nextImage();
        }
      }
    } else if (!isFullscreen) {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };
      
      const deltaX = touchEnd.x - touchStart.x;
      
      // Minimum swipe distance
      if (Math.abs(deltaX) > 50 && allImages.length > 1) {
        if (deltaX > 0) {
          // Swipe right - previous image
          prevImage();
        } else {
          // Swipe left - next image
          nextImage();
        }
      }
    } else {
      // For zoomed image panning
      handleMouseUp();
    }
    
    // Reset touch start position
    setTouchStart({ x: 0, y: 0 });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product || error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Crown className="w-20 h-20 text-primary/30 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Link to="/products">
            <Button variant="royal">Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link 
          to="/products" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collection
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Gallery with Fullscreen */}
          <div className="space-y-4 animate-fade-in">
            {/* Main Image with Click to Fullscreen */}
            <div 
              className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border/50"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {allImages.length > 0 ? (
                <>
                  <div 
                    className="w-full h-full cursor-pointer"
                    onClick={openFullscreen}
                  >
                    <img 
                      src={allImages[currentImageIndex]} 
                      alt={`${product.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
                  <Crown className="w-32 h-32 text-muted-foreground/20" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {(product.discount_percentage || 0) > 0 && (
                  <span className="px-4 py-2 rounded-full text-sm font-bold gradient-gold text-primary-foreground">
                    -{product.discount_percentage}% OFF
                  </span>
                )}
                {isSoldOut && (
                  <span className="px-4 py-2 rounded-full text-sm font-bold bg-destructive text-destructive-foreground">
                    Sold Out
                  </span>
                )}
                {isLowStock && !isSoldOut && (
                  <span className="px-4 py-2 rounded-full text-sm font-bold bg-yellow-500 text-yellow-950">
                    Low Stock
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.slice(0, 3).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                      currentImageIndex === index 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-transparent hover:border-border"
                    )}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {allImages.length > 3 && (
                  <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-muted border-2 border-dashed border-border flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      +{allImages.length - 3} more
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Details */}
          <div className="flex flex-col animate-fade-in stagger-2">
            <div className="flex justify-between items-start">
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                {product.name}
              </h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleToggleWishlist}
                  className={cn(
                    isWishlisted && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  className="ml-2"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              {selectedVariant ? (
                <span className="font-display text-3xl font-bold text-primary">
                  ₹{selectedVariant.price.toFixed(2)}
                </span>
              ) : (product.discount_percentage || 0) > 0 ? (
                <>
                  <span className="font-display text-3xl font-bold text-primary">
                    ₹{discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{Number(product.price).toFixed(2)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                    Save ₹{(Number(product.price) - discountedPrice).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-display text-3xl font-bold text-primary">
                  ₹{Number(product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isSoldOut ? "bg-destructive" : isLowStock ? "bg-yellow-500" : "bg-green-500"
              )} />
              <span className={cn(
                "text-sm font-medium",
                isSoldOut ? "text-destructive" : isLowStock ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
              )}>
                {getStockDisplay()}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {product.description}
              </p>
            )}
            
                        
            {/* Variant Selector */}
            <div className="mb-6">
              <VariantSelector 
                productId={product.id}
                basePrice={Number(product.price)}
                onVariantChange={handleVariantChange}
              />
            </div>

            {/* Quantity Selector */}
            {!isSoldOut && (
              <div className="flex items-center gap-4 mb-8">
                <span className="text-sm font-medium text-foreground">Quantity:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-3 font-display text-lg font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(stockQuantity || 99, quantity + 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {stockQuantity > 0 && (
                  <span className="text-sm text-muted-foreground">
                    (Max: {stockQuantity})
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                variant="royal"
                size="xl"
                className="flex-1 h-16 px-4"
                onClick={handleAddToCart}
                disabled={isSoldOut}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {isSoldOut ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                variant={isWishlisted ? "default" : "outline"}
                size="xl"
                className="flex-1 h-16 px-4 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-light-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
                onClick={handleToggleWishlist}
              >
                <Heart className={cn("w-5 h-5 mr-2", isWishlisted && "fill-current animate-pulse")} />
                {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>

            {/* Product Details Tabs */}
            {(product.detailed_description || productFeatures.length > 0 || height || width || weight) && (
              <div className="mb-6">
                {/* Selected Variant Info */}
                {selectedVariant && (
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {selectedVariant.attribute_name}: {selectedVariant.value_name}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex border-b border-border">
                  {product.detailed_description && (
                    <button
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === 'description' 
                          ? "text-primary border-b-2 border-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setActiveTab('description')}
                    >
                      Description
                    </button>
                  )}
                  
                  {productFeatures.length > 0 && (
                    <button
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === 'features' 
                          ? "text-primary border-b-2 border-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setActiveTab('features')}
                    >
                      Features
                    </button>
                  )}
                  
                  {(height || width || weight) && (
                    <button
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === 'dimensions' 
                          ? "text-primary border-b-2 border-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setActiveTab('dimensions')}
                    >
                      Dimensions
                    </button>
                  )}
                </div>
                
                <div className="mt-4">
                  {activeTab === 'description' && product.detailed_description && (
                    <div>
                      <p className="text-muted-foreground leading-relaxed">
                        {product.detailed_description}
                      </p>
                    </div>
                  )}
                  
                  {activeTab === 'features' && productFeatures.length > 0 && (
                    <div>
                      <ul className="space-y-2">
                        {productFeatures.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Crown className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {activeTab === 'dimensions' && (height || width || weight) && (
                    <div className="grid grid-cols-3 gap-4">
                      {height && (
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Height</h4>
                          <p className="text-muted-foreground">{height}</p>
                        </div>
                      )}
                      {width && (
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Width</h4>
                          <p className="text-muted-foreground">{width}</p>
                        </div>
                      )}
                      {weight && (
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Weight</h4>
                          <p className="text-muted-foreground">{weight}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mt-10 pt-8 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">Premium Quality</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && (
        <div 
          ref={fullscreenRef}
          className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={closeFullscreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={closeFullscreen}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="absolute top-4 left-4 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              disabled={zoomLevel <= 1}
            >
              <Crown className="w-4 h-4 transform rotate-180" />
            </Button>
          </div>
          
          <div
            className={cn(
              "max-w-full max-h-full cursor-grab",
              isDragging && "cursor-grabbing"
            )}
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e); }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              transform: `translate(${zoomPosition.x}px, ${zoomPosition.y}px) scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.2s ease"
            }}
          >
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${product.name} - Fullscreen`}
              className="max-w-full max-h-[80vh] object-contain select-none"
              draggable={false}
            />
          </div>
          
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="flex items-center text-white text-sm px-3 bg-black/30 rounded-full">
                {currentImageIndex + 1} / {allImages.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}