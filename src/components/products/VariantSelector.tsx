import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Attribute {
  id: string;
  name: string;
  icon_url: string | null;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  attribute_value_id: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_urls?: string[];
}

interface VariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantChange: (variant: ProductVariant | null, attributeName: string, valueName: string) => void;
}

export function VariantSelector({ productId, basePrice, onVariantChange }: VariantSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  // Fetch attributes
  const { data: attributes } = useQuery({
    queryKey: ['product-attributes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Attribute[];
    },
  });

  // Fetch attribute values
  const { data: attributeValues } = useQuery({
    queryKey: ['product-attribute-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_attribute_values')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as AttributeValue[];
    },
  });

  // Fetch variants for this product
  const { data: variants } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, product_id, attribute_value_id, price, stock_quantity, is_available, image_urls')
        .eq('product_id', productId);
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });

  // Get unique attributes that have variants for this product
  const availableAttributes = (() => {
    if (!variants || !attributeValues || !attributes) return [];
    
    const variantValueIds = variants.map(v => v.attribute_value_id);
    const attributeIds = new Set<string>();
    
    attributeValues
      .filter(v => variantValueIds.includes(v.id))
      .forEach(v => attributeIds.add(v.attribute_id));
    
    return attributes.filter(a => attributeIds.has(a.id));
  })();

  // Get values for an attribute that are available as variants
  const getValuesForAttribute = (attributeId: string) => {
    if (!variants || !attributeValues) return [];
    
    const variantValueIds = variants.map(v => v.attribute_value_id);
    return attributeValues.filter(
      v => v.attribute_id === attributeId && variantValueIds.includes(v.id)
    );
  };

  // Get variant for selected value
  const getVariantForValue = (valueId: string) => {
    return variants?.find(v => v.attribute_value_id === valueId);
  };

  // Handle selection
  const handleSelect = (attributeId: string, valueId: string) => {
    const newSelected = { ...selectedValues, [attributeId]: valueId };
    setSelectedValues(newSelected);
    
    const variant = getVariantForValue(valueId);
    const value = attributeValues?.find(v => v.id === valueId);
    const attr = attributes?.find(a => a.id === attributeId);
    
    onVariantChange(variant || null, attr?.name || '', value?.value || '');
  };

  // Auto-select first variant if only one attribute
  useEffect(() => {
    if (availableAttributes.length === 1 && Object.keys(selectedValues).length === 0) {
      const attrId = availableAttributes[0].id;
      const values = getValuesForAttribute(attrId);
      if (values.length > 0) {
        handleSelect(attrId, values[0].id);
      }
    }
  }, [availableAttributes, variants]);

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {availableAttributes.map(attr => {
        const values = getValuesForAttribute(attr.id);
        if (values.length === 0) return null;

        return (
          <div key={attr.id}>
            <div className="flex items-center gap-2 mb-3">
              {attr.icon_url && (
                <img src={attr.icon_url} alt="" className="w-5 h-5 object-contain" />
              )}
              <span className="font-medium">{attr.name}:</span>
            </div>
            
            <div className="space-y-2">
              {values.map(val => {
                const variant = getVariantForValue(val.id);
                const isSelected = selectedValues[attr.id] === val.id;
                const isUnavailable = variant && !variant.is_available;
                const isOutOfStock = variant && variant.stock_quantity === 0;

                return (
                  <button
                    key={val.id}
                    onClick={() => !isUnavailable && handleSelect(attr.id, val.id)}
                    disabled={isUnavailable}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50",
                      isUnavailable && "opacity-50 cursor-not-allowed line-through",
                      isOutOfStock && !isUnavailable && "bg-muted"
                    )}
                  >
                    <span className="font-medium">{val.value}</span>
                    <div className="flex items-center gap-2">
                      {variant && (
                        <span className="text-sm font-medium">
                          ₹{variant.price}
                        </span>
                      )}
                      {isOutOfStock && !isUnavailable && (
                        <span className="text-xs text-destructive">(Out)</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
