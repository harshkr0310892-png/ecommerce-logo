import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VariantAttributeValue {
  attribute_value_id: string;
  product_attribute_values: {
    id: string;
    value: string;
    attribute_id: string;
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
      values: Map<string, { id: string; value: string; sort_order: number }>;
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
            attrEntry.values.set(attrVal.id, { id: attrVal.id, value: attrVal.value, sort_order: 0 });
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
    <div className="space-y-6">
      {productAttributes.map(attr => (
        <div key={attr.id}>
          <div className="flex items-center gap-2 mb-3">
            {attr.icon_url && (
              <img src={attr.icon_url} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className="font-medium">{attr.name}:</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {attr.values.map(val => {
              const isSelected = selectedAttributes[attr.id] === val.id;
              const available = isValueAvailable(attr.id, val.id);
              const outOfStock = available && isValueOutOfStock(attr.id, val.id);
              
              // If not available (meaning no variant exists with this combination), disable it.
              // We might want to allow clicking it to reset other selections, but for now disable.
              
              return (
                <button
                  key={val.id}
                  onClick={() => handleSelect(attr.id, val.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50",
                    !available && !isSelected && "opacity-50 border-dashed bg-muted/50", // Unavailable but not selected
                    !available && isSelected && "bg-destructive/10 border-destructive/50 text-destructive", // Should not happen with smart switch, but fallback
                    outOfStock && !isSelected && "opacity-60 bg-muted text-muted-foreground decoration-dashed"
                  )}
                  title={!available ? "Switch to this option" : outOfStock ? "Out of stock" : ""}
                >
                  {val.value}
                  {outOfStock && <span className="ml-1 text-[10px] text-destructive">(Out)</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

