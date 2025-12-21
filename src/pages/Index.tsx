import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { SpecialOfferPopup } from "@/components/SpecialOfferPopup";
import { Crown, Sparkles, Truck, Shield, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ElementType> = {
  crown: Crown,
  truck: Truck,
  shield: Shield,
  gift: Gift,
  sparkles: Sparkles,
};

export default function Index() {

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const heroSection = sections?.find(s => s.section_type === 'hero');
  const featuresSection = sections?.find(s => s.section_type === 'features');
  const featuredProductsSection = sections?.find(s => s.section_type === 'featured_products');
  const ctaSection = sections?.find(s => s.section_type === 'cta');

  // Show only first 4 products
  const featuredProducts = products?.slice(0, 4);


  return (
    <Layout>
      <SpecialOfferPopup />
      
      {/* Banner Carousel */}
      <section className="container mx-auto px-4 py-6">
        <BannerCarousel />
      </section>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Premium Collection</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in stagger-1">
            <span className="text-foreground">
              {heroSection?.title?.split(' ')[0] || 'Discover'}
            </span>
            <br />
            <span className="gradient-gold-text">
              {heroSection?.title?.split(' ').slice(1).join(' ') || 'Royal Elegance'}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in stagger-2">
            {heroSection?.subtitle || 'Experience luxury shopping with our curated collection of premium products. No account needed — simply browse, order, and enjoy.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-3">
            <Link to={(heroSection?.content as any)?.buttonLink || '/products'}>
              <Button variant="royal" size="xl" className="w-full sm:w-auto">
                <Crown className="w-5 h-5 mr-2" />
                {(heroSection?.content as any)?.buttonText || 'Explore Collection'}
              </Button>
            </Link>
            <Link to="/track-order">
              <Button variant="royalOutline" size="xl" className="w-full sm:w-auto">
                Track Your Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {featuresSection && (
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            {featuresSection.title && (
              <h2 className="font-display text-3xl font-bold text-center mb-10">
                <span className="gradient-gold-text">{featuresSection.title}</span>
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {((featuresSection.content as any)?.features || [
                { icon: 'truck', title: 'Fast Delivery', description: 'Quick and reliable shipping to your doorstep' },
                { icon: 'shield', title: 'Secure Checkout', description: 'Shop with confidence — your data is protected' },
                { icon: 'gift', title: 'Guest Checkout', description: 'No account required — order instantly' },
              ]).map((feature: any, index: number) => {
                const IconComponent = iconMap[feature.icon] || Gift;
                return (
                  <div 
                    key={index}
                    className={`flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border/50 animate-fade-in stagger-${index + 1}`}
                  >
                    <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mb-4">
                      <IconComponent className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-gold-text">{featuredProductsSection?.title || 'Featured'}</span> Products
            </h2>
            <p className="text-muted-foreground">
              {featuredProductsSection?.subtitle || 'Handpicked treasures from our collection'}
            </p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {featuredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={Number(product.price)}
                    discount_percentage={product.discount_percentage || 0}
                    image_url={product.image_url}
                    cash_on_delivery={(product as any).cash_on_delivery}
                    images={product.images}
                    stock_status={product.stock_status}
                    stock_quantity={product.stock_quantity}
                    index={index}
                  />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border/50">
              <Crown className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-muted-foreground mb-2">
                No products yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Check back soon for our royal collection!
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="royalOutline" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {ctaSection && (
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-gold-text">{ctaSection.title}</span>
            </h2>
            {ctaSection.subtitle && (
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {ctaSection.subtitle}
              </p>
            )}
            <Link to={(ctaSection.content as any)?.buttonLink || '/products'}>
              <Button variant="royal" size="lg">
                {(ctaSection.content as any)?.buttonText || 'Shop Now'}
              </Button>
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}