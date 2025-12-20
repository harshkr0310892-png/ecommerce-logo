import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";

interface VariantAttributeValue {
  attribute_value_id: string;
  product_attribute_values: {
    id: string;
    value: string;
    attribute_id: string;
    value_icon_url?: string | null;
    value_icon_shape?: 'circle' | 'square' | 'rectangle' | 'triangle' | null;
    product_attributes: {
      id: string;
      name: string;
      icon_url: string | null;
      sort_order: number | null;
    };
  };
}

interface ProductVariant {
  id: string;
  product_id: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_urls: string[] | null;
  product_variant_values: VariantAttributeValue[];
}

interface VariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantChange: (variant: ProductVariant | null, attributeName: string, valueName: string) => void;
}

export function VariantSelector({ productId, basePrice, onVariantChange }: VariantSelectorProps) {
  // selectedAttributes: map of attribute_id -> attribute_value_id
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [openAttributes, setOpenAttributes] = useState<Record<string, boolean>>({});

  // Fetch variants with all nested attribute data
  const { data: variants, isLoading } = useQuery({
    queryKey: ['product-variants-extended', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          price,
          stock_quantity,
          is_available,
          image_urls,
          product_variant_values (
            attribute_value_id,
            product_attribute_values (
              id,
              value,
              attribute_id,
              value_icon_url,
              value_icon_shape,
              product_attributes (
                id,
                name,
                icon_url,
                sort_order
              )
            )
          )
        `)
        .eq('product_id', productId);

      if (error) throw error;
      return data as unknown as ProductVariant[];
    },
    enabled: !!productId,
  });

  // Derived state: All available attributes for this product
  const productAttributes = useMemo(() => {
    if (!variants) return [];
    
    const attributesMap = new Map<string, {
      id: string;
      name: string;
      icon_url: string | null;
      sort_order: number;
      values: Map<string, { id: string; value: string; sort_order: number; value_icon_url?: string | null; value_icon_shape?: 'circle' | 'square' | 'rectangle' | 'triangle' | null }>;
    }>();

    variants.forEach(variant => {
      // Skip unavailable variants if needed, but usually we want to show them as out of stock
      variant.product_variant_values.forEach(pvv => {
        const attrVal = pvv.product_attribute_values;
        const attr = attrVal.product_attributes;
        
        if (!attributesMap.has(attr.id)) {
          attributesMap.set(attr.id, {
            id: attr.id,
            name: attr.name,
            icon_url: attr.icon_url,
            sort_order: attr.sort_order || 0,
            values: new Map()
          });
        }
        
        const attrEntry = attributesMap.get(attr.id)!;
        if (!attrEntry.values.has(attrVal.id)) {
            // We don't have sort_order for value in this query, defaulting to 0 or we could fetch it
            // Actually, product_attribute_values table has sort_order, but we didn't select it above.
            // Let's rely on default sorting or index for now.
            attrEntry.values.set(attrVal.id, { id: attrVal.id, value: attrVal.value, sort_order: 0, value_icon_url: attrVal.value_icon_url ?? null, value_icon_shape: (attrVal as any).value_icon_shape ?? null });
        }
      });
    });

    return Array.from(attributesMap.values())
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(attr => ({
        ...attr,
        values: Array.from(attr.values.values()) // Convert values map to array
      }));
  }, [variants]);

  useEffect(() => {
    if (productAttributes.length === 0) return;
    setOpenAttributes(prev => {
      const next = { ...prev };
      let changed = false;

      for (const attr of productAttributes) {
        if (next[attr.id] === undefined) {
          next[attr.id] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [productAttributes]);

  // Handle selection with smart switching for incompatible attributes
  const handleSelect = (attributeId: string, valueId: string) => {
    // 1. Proposed new selection
    const nextSelection = { ...selectedAttributes, [attributeId]: valueId };

    // 2. Check if this exact combination exists in any variant
    const hasExactMatch = variants.some(v =>
      Object.entries(nextSelection).every(([attrId, valId]) =>
        v.product_variant_values.some(pvv =>
          pvv.product_attribute_values.attribute_id === attrId &&
          pvv.product_attribute_values.id === valId
        )
      )
    );

    if (hasExactMatch) {
      setSelectedAttributes(nextSelection);
      return;
    }

    // 3. Smart Switch: Find the best matching variant that has the NEW attribute value
    // We want to keep the new selection (attributeId = valueId) and preserve as many OTHER existing selections as possible.
    
    // Filter variants that have the target attribute value
    const candidates = variants.filter(v => 
      v.product_variant_values.some(pvv => 
        pvv.product_attribute_values.attribute_id === attributeId && 
        pvv.product_attribute_values.id === valueId
      )
    );

    if (candidates.length === 0) {
        // This shouldn't happen if the value came from the list of available attributes
        // But if it does, just set the single attribute
        setSelectedAttributes({ [attributeId]: valueId });
        return;
    }

    // Find the candidate that matches the most *other* current selections
    let bestCandidate = candidates[0];
    let maxMatches = -1;

    candidates.forEach(candidate => {
        let matches = 0;
        Object.entries(selectedAttributes).forEach(([key, val]) => {
            if (key === attributeId) return; // Skip the one we are changing
            
            const hasMatch = candidate.product_variant_values.some(pvv => 
                pvv.product_attribute_values.attribute_id === key && 
                pvv.product_attribute_values.id === val
            );
            if (hasMatch) matches++;
        });

        if (matches > maxMatches) {
            maxMatches = matches;
            bestCandidate = candidate;
        }
    });

    // Construct the new selection from the best candidate
    const newResolvedSelection: Record<string, string> = {};
    bestCandidate.product_variant_values.forEach(pvv => {
        newResolvedSelection[pvv.product_attribute_values.attribute_id] = pvv.product_attribute_values.id;
    });

    setSelectedAttributes(newResolvedSelection);
  };

  // Determine the selected variant based on current selection
  useEffect(() => {
    if (!variants || productAttributes.length === 0) return;

    // Check if we have a selection for every attribute
    const allAttributesSelected = productAttributes.every(attr => selectedAttributes[attr.id]);

    if (allAttributesSelected) {
      // Find the variant that matches ALL selected attributes
      const matchedVariant = variants.find(variant => {
        return productAttributes.every(attr => {
          const selectedValueId = selectedAttributes[attr.id];
          // Does this variant have this attribute value?
          return variant.product_variant_values.some(pvv => 
            pvv.product_attribute_values.attribute_id === attr.id && 
            pvv.product_attribute_values.id === selectedValueId
          );
        });
      });

      if (matchedVariant) {
        // Construct display strings
        const attrNames = productAttributes.map(a => a.name).join(', ');
        const valueNames = productAttributes.map(a => {
           const valId = selectedAttributes[a.id];
           return a.values.find(v => v.id === valId)?.value || '';
        }).join(', ');

        onVariantChange(matchedVariant, attrNames, valueNames);
      } else {
        onVariantChange(null, '', '');
      }
    } else {
      onVariantChange(null, '', '');
    }
  }, [selectedAttributes, variants, productAttributes, onVariantChange]);

  // Auto-select defaults if only one option exists for an attribute
  useEffect(() => {
    if (productAttributes.length > 0) {
        const newSelection = { ...selectedAttributes };
        let changed = false;
        productAttributes.forEach(attr => {
            if (attr.values.length === 1 && !newSelection[attr.id]) {
                newSelection[attr.id] = attr.values[0].id;
                changed = true;
            }
        });
        if (changed) {
            setSelectedAttributes(newSelection);
        }
    }
  }, [productAttributes]); // careful with dependencies

  if (isLoading || !variants || variants.length === 0) {
    return null;
  }

  // Helper to check if a value is available given OTHER selections
  const isValueAvailable = (attributeId: string, valueId: string) => {
    // We want to know if there is ANY variant that has (attributeId = valueId)
    // AND matches all OTHER currently selected attributes.
    
    return variants.some(variant => {
      // 1. Must have the target value
      const hasTarget = variant.product_variant_values.some(pvv => 
        pvv.product_attribute_values.attribute_id === attributeId &&
        pvv.product_attribute_values.id === valueId
      );
      if (!hasTarget) return false;

      // 2. Must match other selected attributes
      for (const [key, selectedVal] of Object.entries(selectedAttributes)) {
        if (key === attributeId) continue; // Skip the attribute we are testing
        
        const hasSelection = variant.product_variant_values.some(pvv => 
          pvv.product_attribute_values.attribute_id === key &&
          pvv.product_attribute_values.id === selectedVal
        );
        if (!hasSelection) return false;
      }

      return true;
    });
  };
  
  // Helper to check if a value is fully out of stock (variant exists but stock=0)
  // This is tricky because "out of stock" applies to the final variant.
  // We can only say it's definitely out of stock if ALL matching variants are out of stock.
  const isValueOutOfStock = (attributeId: string, valueId: string) => {
     // Similar logic to isValueAvailable, but check stock > 0
     const matchingVariants = variants.filter(variant => {
        const hasTarget = variant.product_variant_values.some(pvv => 
            pvv.product_attribute_values.attribute_id === attributeId &&
            pvv.product_attribute_values.id === valueId
        );
        if (!hasTarget) return false;

        for (const [key, selectedVal] of Object.entries(selectedAttributes)) {
            if (key === attributeId) continue;
            const hasSelection = variant.product_variant_values.some(pvv => 
                pvv.product_attribute_values.attribute_id === key &&
                pvv.product_attribute_values.id === selectedVal
            );
            if (!hasSelection) return false;
        }
        return true;
     });

     // If no matching variants, it's "unavailable" (not just out of stock)
     if (matchingVariants.length === 0) return false;

     // If all matching variants are out of stock
     return matchingVariants.every(v => v.stock_quantity === 0 || !v.is_available);
  };


  return (
    <div className="space-y-4">
      {productAttributes.map(attr => (
        <Collapsible
          key={attr.id}
          open={openAttributes[attr.id] ?? true}
          onOpenChange={(open) => setOpenAttributes(prev => ({ ...prev, [attr.id]: open }))}
          className="group"
        >
          <div className="flex items-center justify-between rounded-lg transition-colors duration-300 hover:bg-muted/50">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {attr.icon_url && (
                    <img 
                      src={attr.icon_url} 
                      alt="" 
                      className="w-5 h-5 object-contain transition-transform duration-300 group-data-[state=open]:rotate-180"
                    />
                  )}
                  <span className="font-medium text-foreground/90">{attr.name}:</span>
                </div>
                <span className="text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180">
                  {(openAttributes[attr.id] ?? true) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              </button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent 
            className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transitionProperty: 'max-height, opacity',
              willChange: 'max-height, opacity'
            }}
          >
            <div className="flex flex-wrap gap-2 p-1">
              {attr.values.map(val => {
                const isSelected = selectedAttributes[attr.id] === val.id;
                const available = isValueAvailable(attr.id, val.id);
                const outOfStock = available && isValueOutOfStock(attr.id, val.id);
                const isColor = attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour');
                
                // Try to parse color from value (e.g., "Red" -> red color)
                let colorStyle = {};
                if (isColor) {
                  try {
                    // Color mapping with unique keys
                    const colorMap: Record<string, string> = {
                      // Basic colors
                      'red': 'bg-red-500',
                      'blue': 'bg-blue-500',
                      'green': 'bg-green-500',
                      'black': 'bg-black',
                      'white': 'bg-white border',
                      'yellow': 'bg-yellow-400',
                      'pink': 'bg-pink-400',
                      'purple': 'bg-purple-500',
                      'gray': 'bg-gray-400',
                      'brown': 'bg-amber-800',
                      'beige': 'bg-amber-100',
                      'navy': 'bg-blue-900',
                      'maroon': 'bg-red-800',
                      'teal': 'bg-teal-500',
                      'olive': 'bg-yellow-600',
                      'lime': 'bg-lime-400',
                      'orange': 'bg-orange-400',
                      'violet': 'bg-violet-600',
                      'indigo': 'bg-indigo-600',
                      'cyan': 'bg-cyan-400',
                      'fuchsia': 'bg-fuchsia-500',
                      'rose': 'bg-rose-400',
                      'amber': 'bg-amber-400',
                      'emerald': 'bg-emerald-400',
                      'sky': 'bg-sky-400',
                      
                      // Color variations
                      'light blue': 'bg-sky-300',
                      'dark blue': 'bg-blue-800',
                      'light green': 'bg-green-300',
                      'dark green': 'bg-green-800',
                      'light gray': 'bg-gray-300',
                      'dark gray': 'bg-gray-600',
                      'charcoal': 'bg-gray-700',
                      'cream': 'bg-amber-50',
                      'gold': 'bg-yellow-400',
                      'silver': 'bg-gray-300',
                      'bronze': 'bg-amber-700',
                      'copper': 'bg-orange-700',
                      'burgundy': 'bg-red-900',
                      'mint': 'bg-emerald-200',
                      'lavender': 'bg-purple-200',
                      'coral': 'bg-coral-400',
                      'peach': 'bg-orange-200',
                      'mauve': 'bg-pink-200',
                      'mustard': 'bg-yellow-600',
                      'taupe': 'bg-stone-400',
                      'khaki': 'bg-khaki-400',
                      'ivory': 'bg-ivory-100',
                      'off white': 'bg-amber-50',
                      'navy blue': 'bg-blue-900',
                      'royal blue': 'bg-blue-600',
                      'baby blue': 'bg-blue-200',
                      'forest green': 'bg-green-700',
                      'olive green': 'bg-yellow-800',
                      'lime green': 'bg-lime-500',
                      'teal blue': 'bg-teal-400',
                      'turquoise': 'bg-cyan-400',
                      'aqua': 'bg-cyan-300',
                      'magenta': 'bg-fuchsia-500',
                      'hot pink': 'bg-pink-500',
                      'dusty rose': 'bg-rose-300',
                      'blush': 'bg-rose-200',
                      'nude': 'bg-amber-100',
                      'camel': 'bg-amber-300',
                      'cognac': 'bg-amber-700',
                      'espresso': 'bg-amber-900',
                      'wine': 'bg-red-900',
                      'plum': 'bg-purple-800',
                      'eggplant': 'bg-purple-900',
                      'moss': 'bg-lime-700',
                      'sage': 'bg-green-200',
                      'seafoam': 'bg-teal-200',
                      'denim': 'bg-blue-600',
                      'chambray': 'bg-blue-400',
                      'heather': 'bg-gray-300',
                      'stone': 'bg-stone-400',
                      'sand': 'bg-amber-100',
                      'oatmeal': 'bg-amber-50',
                      'linen': 'bg-linen-100',
                      'ecru': 'bg-eggshell-50',
                      'champagne': 'bg-amber-100',
                      'blonde': 'bg-yellow-100',
                      'caramel': 'bg-amber-200',
                      'honey': 'bg-amber-300',
                      'chestnut': 'bg-amber-800',
                      'auburn': 'bg-red-800',
                      'mahogany': 'bg-red-900',
                      'mocha': 'bg-amber-800',
                      'cocoa': 'bg-brown-800',
                      'mink': 'bg-gray-500',
                      'pewter': 'bg-gray-400',
                      'slate': 'bg-slate-500',
                      'steel': 'bg-slate-400',
                      'graphite': 'bg-gray-700',
                      'ink': 'bg-gray-900',
                      'jet black': 'bg-black',
                      'onyx': 'bg-gray-900',
                      'snow': 'bg-white',
                      'pearl': 'bg-gray-100',
                      'frost': 'bg-blue-50',
                      'ice': 'bg-cyan-50',
                      'periwinkle': 'bg-indigo-200',
                      'lilac': 'bg-purple-200',
                      'orchid': 'bg-purple-300',
                      'berry': 'bg-red-700',
                      'brick': 'bg-red-700',
                      'salmon': 'bg-orange-300',
                      'apricot': 'bg-orange-200',
                      'mango': 'bg-yellow-300',
                      'lemon': 'bg-yellow-200',
                      'banana': 'bg-yellow-100',
                      'rust': 'bg-orange-800',
                      'terracotta': 'bg-orange-700',
                      'cinnamon': 'bg-amber-700',
                      'chocolate': 'bg-brown-700'
                    };
                    
                    // Try to find a matching color name
                    const colorName = Object.keys(colorMap).find(color => 
                      val.value.toLowerCase().includes(color)
                    );
                    
                    if (colorName) {
                      colorStyle = { backgroundColor: colorMap[colorName] };
                    } else {
                      // Fallback to a default color if no match
                      colorStyle = { backgroundColor: '#e5e7eb' };
                    }
                  } catch (e) {
                    console.error('Error setting color:', e);
                  }
                }

                return (
                  <button
                    key={val.id}
                    onClick={() => handleSelect(attr.id, val.id)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-all duration-300 ease-out",
                      "transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
                      "rounded-full border-2 flex items-center justify-center min-h-10 min-w-10",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-muted/30",
                      !available && !isSelected && "opacity-50 border-dashed bg-muted/50",
                      !available && isSelected && "bg-destructive/10 border-destructive/50 text-destructive",
                      outOfStock && !isSelected && "opacity-60 bg-muted/50 text-muted-foreground decoration-dashed"
                    )}
                    title={!available ? "Switch to this option" : outOfStock ? "Out of stock" : val.value}
                    >
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      {val.value_icon_url ? (
                        <img
                          src={val.value_icon_url}
                          alt=""
                          className={
                            `object-cover ${val.value_icon_shape === 'circle' ? 'rounded-full' : val.value_icon_shape === 'square' ? 'rounded-md' : 'rounded-sm'} ${val.value_icon_shape === 'rectangle' ? 'w-8 h-5' : 'w-7 h-7'}`
                          }
                          style={val.value_icon_shape === 'triangle' ? { clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' } : undefined}
                        />
                      ) : null}
                      <span>{val.value}</span>
                      {outOfStock && <span className="ml-1 text-[10px] text-destructive">(Out)</span>}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

