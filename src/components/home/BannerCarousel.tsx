import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
}

// Function to transform image URL for better quality
const getTransformedImageUrl = (imageUrl: string, width: number, height: number) => {
  try {
    const url = new URL(imageUrl);
    // Check if it's a Supabase storage URL
    if (url.hostname.includes('supabase')) {
      // Add transformation parameters for better quality
      url.searchParams.set('width', width.toString());
      url.searchParams.set('height', height.toString());
      url.searchParams.set('quality', '90');
      url.searchParams.set('resize', 'cover');
    }
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    return imageUrl;
  }
};

export function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const nextSlide = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners]);

  const prevSlide = useCallback(() => {
    if (!banners || banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners]);

  // Auto-advance slides
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners, nextSlide]);

  if (isLoading) {
    return <Skeleton className="w-full aspect-[21/9] rounded-2xl" />;
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const BannerContent = () => (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden">
      <img
        // Use transformed image URL for better quality
        src={getTransformedImageUrl(currentBanner.image_url, 1920, 1080)}
        alt={currentBanner.title || 'Banner'}
        className="w-full h-full object-cover transition-transform duration-700"
        // Add loading optimization
        loading="eager"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      
      {/* Content */}
      {(currentBanner.title || currentBanner.subtitle) && (
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-lg animate-fade-in">
              {currentBanner.title && (
                <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
                  <span className="gradient-gold-text">{currentBanner.title}</span>
                </h2>
              )}
              {currentBanner.subtitle && (
                <p className="text-sm md:text-lg text-muted-foreground">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prevSlide(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); nextSlide(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-primary/30 hover:bg-primary/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (currentBanner.link_url) {
    return (
      <Link to={currentBanner.link_url} className="block">
        <BannerContent />
      </Link>
    );
  }

  return <BannerContent />;
}