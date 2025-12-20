import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { FilterMenu } from "@/components/products/FilterMenu";
import { SearchBar } from "@/components/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";

type FilterType = 'all' | 'in_stock' | 'on_sale';
type SortType = 'name' | 'price_low' | 'price_high';

interface Category {
  id: string;
  name: string;
}

export default function Products() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const productsPerPage = 8;

  // Handle URL search parameter
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
    }
  }, [searchParams]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate min and max prices from products
  const priceRange = useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 10000 };
    
    const prices = products.map(p => Number(p.price)).filter(price => !isNaN(price));
    if (prices.length === 0) return { min: 0, max: 10000 };
    
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100, // Round down to nearest 100
      max: Math.ceil(Math.max(...prices) / 100) * 100   // Round up to nearest 100
    };
  }, [products]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
    
    // Update URL with search parameter
    if (term) {
      setSearchParams({ search: encodeURIComponent(term) });
    } else {
      setSearchParams({});
    }
  };

  const filteredProducts = products?.filter((product) => {
    // Search filter - case insensitive
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory !== 'all' && product.category_id !== selectedCategory) {
      return false;
    }
    
    // Stock/Sale filter
    if (filter === 'in_stock') return product.stock_status === 'in_stock';
    if (filter === 'on_sale') return (product.discount_percentage || 0) > 0;
    
    // Price range filter
    const productPrice = Number(product.price);
    if (minPrice !== '' && productPrice < minPrice) return false;
    if (maxPrice !== '' && productPrice > maxPrice) return false;
    
    return true;
  }).sort((a, b) => {
    // Sorting
    switch (sortBy) {
      case 'price_low':
        return Number(a.price) - Number(b.price);
      case 'price_high':
        return Number(b.price) - Number(a.price);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Pagination logic
  const totalPages = filteredProducts ? Math.ceil(filteredProducts.length / productsPerPage) : 0;
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts?.slice(startIndex, startIndex + productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(1)}>
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Our <span className="gradient-gold-text">Collection</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Explore our curated selection of premium products, crafted with excellence and designed for royalty.
          </p>
          
          {/* Search Bar */}
          <div className="flex justify-center mb-6">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search products..." 
              initialValue={searchTerm}
              context="collection"
            />
          </div>
        </div>

        {/* Filter Menu */}
        <FilterMenu
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filter={filter}
            setFilter={setFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            minProductPrice={priceRange.min}
            maxProductPrice={priceRange.max}
          />

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : paginatedProducts && paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {paginatedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  discount_percentage={product.discount_percentage || 0}
                  image_url={product.image_url}
                  cash_on_delivery={(product as any).cash_on_delivery}
                  stock_status={product.stock_status}
                  index={index}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border/50">
            <Crown className="w-20 h-20 text-primary/30 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-semibold text-muted-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No products match "${searchTerm}". Try a different search term.` 
                : filter !== 'all' || selectedCategory !== 'all' || minPrice !== '' || maxPrice !== ''
                ? 'Try adjusting your filters or check back later.' 
                : 'Check back soon for our royal collection!'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}