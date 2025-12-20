import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, ArrowUpDown, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { PriceRange } from "@/components/ui/price-range";

interface FilterMenuProps {
  categories: { id: string; name: string }[] | undefined;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  filter: 'all' | 'in_stock' | 'on_sale';
  setFilter: (value: 'all' | 'in_stock' | 'on_sale') => void;
  sortBy: 'name' | 'price_low' | 'price_high';
  setSortBy: (value: 'name' | 'price_low' | 'price_high') => void;
  minPrice: number | '';
  setMinPrice: (value: number | '') => void;
  maxPrice: number | '';
  setMaxPrice: (value: number | '') => void;
  minProductPrice?: number;
  maxProductPrice?: number;
}

export function FilterMenu({ 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  filter, 
  setFilter,
  sortBy,
  setSortBy,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minProductPrice = 0,
  maxProductPrice = 10000
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Initialize sliderValue with minProductPrice and maxProductPrice or default values
  const defaultMin = minProductPrice ?? 0;
  const defaultMax = maxProductPrice ?? 10000;
  
  // Initialize sliderValue state
  const [sliderValue, setSliderValue] = useState<[number, number]>([
    minPrice === '' ? defaultMin : Number(minPrice),
    maxPrice === '' ? defaultMax : Number(maxPrice)
  ]);
  
  // Update sliderValue when minPrice or maxPrice changes
  useEffect(() => {
    setSliderValue([
      minPrice === '' ? defaultMin : Number(minPrice),
      maxPrice === '' ? defaultMax : Number(maxPrice)
    ]);
  }, [minPrice, maxPrice, defaultMin, defaultMax]);
  
  const getCategoryName = () => {
    if (selectedCategory === 'all') return 'All Categories';
    const category = categories?.find(cat => cat.id === selectedCategory);
    return category ? category.name : 'All Categories';
  };

  const getFilterName = () => {
    switch (filter) {
      case 'in_stock': return 'In Stock';
      case 'on_sale': return 'On Sale';
      default: return 'All Products';
    }
  };

  const getSortName = () => {
    switch (sortBy) {
      case 'price_low': return 'Price: Low to High';
      case 'price_high': return 'Price: High to Low';
      default: return 'Sort by Name';
    }
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setMinPrice('');
    } else {
      // Get the current input value as string
      const currentValue = minPrice === '' ? '' : minPrice.toString();
      // If the new value is a single digit and we already have a value, append it
      if (value.length === 1 && currentValue !== '') {
        const newValue = currentValue + value;
        setMinPrice(parseInt(newValue, 10));
      } else {
        // Otherwise, handle as normal
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
          setMinPrice(numValue);
        }
      }
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setMaxPrice('');
    } else {
      // Get the current input value as string
      const currentValue = maxPrice === '' ? '' : maxPrice.toString();
      // If the new value is a single digit and we already have a value, append it
      if (value.length === 1 && currentValue !== '') {
        const newValue = currentValue + value;
        setMaxPrice(parseInt(newValue, 10));
      } else {
        // Otherwise, handle as normal
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
          setMaxPrice(numValue);
        }
      }
    }
  };

  const handlePriceChange = (value: [number, number]) => {
    const [newMin, newMax] = value;
    setSliderValue([newMin, newMax]);
    setMinPrice(newMin === defaultMin ? '' : newMin);
    setMaxPrice(newMax === defaultMax ? '' : newMax);
  };

  // Mobile filter panel
  const MobileFilterPanel = () => (
    <div className="space-y-6 py-4">
      {/* Category Filter */}
      <div>
        <h3 className="font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          <Button
            variant={selectedCategory === 'all' ? 'royal' : 'outline'}
            className="w-full justify-start"
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'royal' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      
      <hr className="border-border" />
      
      {/* Product Filters */}
      <div>
        <h3 className="font-medium mb-3">Product Filters</h3>
        <div className="space-y-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => setFilter('all')}
          >
            All Products
          </Button>
          <Button
            variant={filter === 'in_stock' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => setFilter('in_stock')}
          >
            In Stock
          </Button>
          <Button
            variant={filter === 'on_sale' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => setFilter('on_sale')}
          >
            On Sale
          </Button>
        </div>
      </div>
      
      <hr className="border-border" />
      
      {/* Price Range */}
      <div className="space-y-4">
        <PriceRange
          value={sliderValue}
          onChange={handlePriceChange}
          min={defaultMin}
          max={defaultMax}
        />
      </div>
      
      <hr className="border-border" />
      
      {/* Sort Options */}
      <div>
        <h3 className="font-medium mb-3">Sort By</h3>
        <div className="space-y-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
          <Button
            variant={sortBy === 'price_low' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => setSortBy('price_low')}
          >
            Price: Low to High
          </Button>
          <Button
            variant={sortBy === 'price_high' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => setSortBy('price_high')}
          >
            Price: High to Low
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {/* Filter Sheet - now shown on all devices */}
      <div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="royal" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 h-[calc(100vh-64px)] overflow-y-auto">
              <MobileFilterPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Current Selection Display */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="royalOutline" size="sm" disabled>
          {getCategoryName()}
        </Button>
        {filter !== 'all' && (
          <Button variant="outline" size="sm" disabled>
            {getFilterName()}
          </Button>
        )}
        {(minPrice !== '' || maxPrice !== '') && (
          <Button variant="outline" size="sm" disabled>
            ₹{minPrice !== '' ? minPrice : '0'} - ₹{maxPrice !== '' ? maxPrice : '∞'}
          </Button>
        )}
        <Button variant="outline" size="sm" disabled>
          {getSortName()}
        </Button>
      </div>
    </div>
  );
}