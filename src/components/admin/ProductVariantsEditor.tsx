import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X } from "lucide-react";

interface Attribute {
  id: string;
  name: string;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_urls?: string[];
  product_variant_values?: {
    attribute_value_id: string;
    product_attribute_values?: {
      id: string;
      value: string;
      attribute_id: string;
      product_attributes?: {
        id: string;
        name: string;
      }
    }
  }[];
}

interface ProductVariantsEditorProps {
  productId: string;
  basePrice: number;
  onVariantImagesStatusChange?: (hasVariantImages: boolean) => void;
}

export function ProductVariantsEditor({ productId, basePrice, onVariantImagesStatusChange }: ProductVariantsEditorProps) {
  const queryClient = useQueryClient();
  
  const [selectedAttributes, setSelectedAttributes] = useState<{ attribute_id: string; attribute_value_id: string }[]>([{ attribute_id: '', attribute_value_id: '' }]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [newVariant, setNewVariant] = useState({
    price: basePrice.toString(),
    stock_quantity: '0',
    is_available: true,
    image_urls: [] as string[],
  });

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

  // Fetch variants for this product with joined data
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
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

  // Notify parent component if any variant has images
  useEffect(() => {
    if (onVariantImagesStatusChange && variants) {
      const hasVariantImages = variants.some(variant => 
        Array.isArray(variant.image_urls) && variant.image_urls.length > 0
      );
      onVariantImagesStatusChange(hasVariantImages);
    }
  }, [variants, onVariantImagesStatusChange]);

  // Add variant mutation
  const addVariantMutation = useMutation({
    mutationFn: async (data: { variant: typeof newVariant, attributes: typeof selectedAttributes }) => {
      // 1. Insert product_variant
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          price: parseFloat(data.variant.price),
          stock_quantity: parseInt(data.variant.stock_quantity) || 0,
          is_available: data.variant.is_available,
          image_urls: data.variant.image_urls || [],
        })
        .select()
        .single();

      if (variantError) throw variantError;

      // 2. Insert product_variant_values
      if (data.attributes.length > 0) {
        const variantValues = data.attributes
          .filter(attr => attr.attribute_value_id)
          .map(attr => ({
            variant_id: variantData.id,
            attribute_value_id: attr.attribute_value_id
          }));
          
        if (variantValues.length > 0) {
          const { error: valuesError } = await supabase
            .from('product_variant_values')
            .insert(variantValues);
            
          if (valuesError) throw valuesError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
    onError: (error: any) => {
      console.error('Failed to add variant:', error);
      // toast.error('Failed to add variant: ' + error.message); // Handle in caller
    },
  });

  const handleAddVariant = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Group attributes to check for multiples
      const attributesMap = new Map<string, string[]>();
      selectedAttributes.forEach(sa => {
        if (!sa.attribute_id || !sa.attribute_value_id) return;
        if (!attributesMap.has(sa.attribute_id)) {
          attributesMap.set(sa.attribute_id, []);
        }
        attributesMap.get(sa.attribute_id)!.push(sa.attribute_value_id);
      });

      const attributeIds = Array.from(attributesMap.keys());
      const valuesArrays = attributeIds.map(id => attributesMap.get(id)!);

      // Cartesian product helper
      const cartesian = (arrays: string[][]) => {
        return arrays.reduce((acc, curr) => 
          acc.flatMap(d => curr.map(e => [...d, e])), 
          [[]] as string[][]
        );
      };

      let combinations: string[][] = [[]];
      if (attributeIds.length > 0) {
        combinations = cartesian(valuesArrays);
      }

      let successCount = 0;
      
      for (const comboValues of combinations) {
        const variantAttributes = comboValues.map((valId, idx) => ({
          attribute_id: attributeIds[idx],
          attribute_value_id: valId
        }));

        // Handle case where no attributes are selected (combinations is [[]])
        if (attributeIds.length === 0) {
           // just empty attributes
        }

        await addVariantMutation.mutateAsync({
          variant: newVariant,
          attributes: variantAttributes
        });
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} variant(s)!`);
        setNewVariant({
          price: basePrice.toString(),
          stock_quantity: '0',
          is_available: true,
          image_urls: [] as string[],
        });
        setSelectedAttributes([{ attribute_id: '', attribute_value_id: '' }]);
      }
    } catch (error: any) {
      toast.error('Failed to add variants: ' + error.message);
    }
  };

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async (data: { id: string; price?: number; stock_quantity?: number; is_available?: boolean; image_urls?: string[] }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant updated!');
    },
    onError: () => toast.error('Failed to update variant'),
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant deleted!');
    },
    onError: () => toast.error('Failed to delete variant'),
  });

  // Add image upload handler
  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `variant-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Error uploading image');
      return null;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Add image to new variant
  const addImageToNewVariant = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const url = await handleImageUpload(file);
    
    if (url) {
      setNewVariant(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, url]
      }));
    }
    
    e.target.value = '';
  };

  // Remove image from new variant
  const removeImageFromNewVariant = (index: number) => {
    setNewVariant(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  // Add image to existing variant
  const addImageToVariant = async (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const url = await handleImageUpload(file);
    
    if (url) {
      const variant = variants?.find(v => v.id === variantId);
      if (variant) {
        const currentImages = Array.isArray(variant.image_urls) ? variant.image_urls : [];
        updateVariantMutation.mutate({
          id: variantId,
          image_urls: [...currentImages, url]
        });
      }
    }
    
    e.target.value = '';
  };

  // Remove image from existing variant
  const removeImageFromVariant = (variantId: string, index: number) => {
    const variant = variants?.find(v => v.id === variantId);
    if (variant) {
      const currentImages = Array.isArray(variant.image_urls) ? variant.image_urls : [];
      const updatedImages = currentImages.filter((_, i) => i !== index);
      updateVariantMutation.mutate({
        id: variantId,
        image_urls: updatedImages
      });
    }
  };

  const getValuesForAttribute = (attributeId: string) => {
    return attributeValues?.filter(v => v.attribute_id === attributeId) || [];
  };

  const addAttributeSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAttributes([...selectedAttributes, { attribute_id: '', attribute_value_id: '' }]);
  };

  const removeAttributeSelection = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAttributes(selectedAttributes.filter((_, i) => i !== index));
  };

  const updateAttributeSelection = (index: number, field: 'attribute_id' | 'attribute_value_id', value: string) => {
    const newAttributes = [...selectedAttributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    if (field === 'attribute_id') {
      newAttributes[index].attribute_value_id = ''; // Reset value when attribute changes
    }
    setSelectedAttributes(newAttributes);
  };

  // Group variants by major attribute (first attribute)
  const groupedVariants = useMemo(() => {
    if (!variants || variants.length === 0) return {};
    
    // If no attributes exist, return a default group
    if (!attributes || attributes.length === 0) {
      return { 'All Variants': variants };
    }

    const majorAttr = attributes[0]; // Use first attribute as major (e.g. Color)
    const groups: Record<string, ProductVariant[]> = {};

    variants.forEach(variant => {
      const match = variant.product_variant_values?.find(
        vv => vv.product_attribute_values?.attribute_id === majorAttr.id
      );

      // key for display
      const groupName = match 
        ? `${majorAttr.name}: ${match.product_attribute_values?.value}`
        : 'Other';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(variant);
    });

    return groups;
  }, [variants, attributes]);

  useEffect(() => {
    if (!variants) return;
    setSelectedVariantIds(prev => prev.filter(id => variants.some(v => v.id === id)));
  }, [variants]);

  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariantIds(prev => {
      if (prev.includes(variantId)) return prev.filter(id => id !== variantId);
      if (prev.length >= 2) {
        toast.error('Select only 2 variants');
        return prev;
      }
      return [...prev, variantId];
    });
  };

  const handleSelectedVariantsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      if (selectedVariantIds.length !== 2) {
        toast.error('Please select exactly 2 variants');
        return;
      }

      const file = e.target.files[0];
      const url = await handleImageUpload(file);
      
      if (url) {
        const variantsToUpdate = (variants || []).filter(v => selectedVariantIds.includes(v.id));
        const promises = variantsToUpdate.map(variant => {
          const currentImages = Array.isArray(variant.image_urls) ? variant.image_urls : [];
          // Avoid duplicates
          if (currentImages.includes(url)) return Promise.resolve(undefined);
          
          return updateVariantMutation.mutateAsync({
            id: variant.id,
            image_urls: [...currentImages, url].slice(0, 6)
          });
        });

        await Promise.all(promises);
        toast.success('Image applied to selected variants');
      }
    } catch (error) {
      console.error('Error updating group images:', error);
      toast.error('Failed to update group images');
    }
    
    e.target.value = '';
  };

  if (!productId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Save the product first to add variants
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-4">Product Variants</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add different sizes, colors, or other variants with custom prices and stock.
        </p>

        {/* Add New Variant Form */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-4 mb-6">
          <h4 className="font-medium text-sm">Add New Variant</h4>
          
          <div className="space-y-3">
            {selectedAttributes.map((attr, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Attribute</Label>
                  <Select
                    value={attr.attribute_id}
                    onValueChange={(val) => updateAttributeSelection(index, 'attribute_id', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {attributes?.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Value</Label>
                  <Select
                    value={attr.attribute_value_id}
                    onValueChange={(val) => updateAttributeSelection(index, 'attribute_value_id', val)}
                    disabled={!attr.attribute_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {getValuesForAttribute(attr.attribute_id).map(val => (
                        <SelectItem key={val.id} value={val.id}>{val.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedAttributes.length > 1 && (
                   <Button type="button" variant="ghost" size="icon" onClick={(e) => removeAttributeSelection(index, e)}>
                     <X className="w-4 h-4" />
                   </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addAttributeSelection} className="mt-2">
              <Plus className="w-4 h-4 mr-2" /> Add Another Attribute
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={newVariant.price}
                onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={newVariant.stock_quantity}
                onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={newVariant.is_available}
                onCheckedChange={(checked) => setNewVariant({ ...newVariant, is_available: checked })}
              />
              <Label>Available</Label>
            </div>
            <Button
              type="button"
              onClick={handleAddVariant}
              disabled={selectedAttributes.some(a => !a.attribute_id || !a.attribute_value_id) || addVariantMutation.isPending}
              size="sm"
            >
              {addVariantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Variant
            </Button>
          </div>
        </div>

        {/* Image Upload for New Variant */}
        <div className="border-t border-border/50 pt-4 mt-4">
          <Label>Variant Images (Max 6)</Label>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {newVariant.image_urls.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Variant ${index + 1}`} 
                  className="w-full h-20 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImageFromNewVariant(index);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {newVariant.image_urls.length < 6 && (
              <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded cursor-pointer hover:bg-muted/50 transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={addImageToNewVariant}
                  disabled={newVariant.image_urls.length >= 6}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Upload up to 6 images for this variant. These will be shown when this variant is selected.
          </p>
        </div>

        {/* Existing Variants List */}
        {variantsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : variants && variants.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedVariants).map(([groupName, groupVariants]) => (
              <div key={groupName} className="space-y-4 border border-border/50 rounded-lg p-4 bg-muted/10">
                {/* Group Header */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary rounded-full inline-block"></span>
                    {groupName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`group-image-${groupName}`}
                      className="cursor-pointer text-xs flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                      onClick={(e) => {
                        if (selectedVariantIds.length !== 2) {
                          e.preventDefault();
                          toast.error('Please select exactly 2 variants');
                        }
                      }}
                    >
                      <Plus className="w-3 h-3" /> Apply Image to Selected {selectedVariantIds.length} Variants
                    </Label>
                    <input
                      id={`group-image-${groupName}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelectedVariantsImageUpload}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="flex-1">Variant Combination</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center">Select</div>
                      <div className="w-24 text-right">Price (₹)</div>
                      <div className="w-20 text-right">Stock</div>
                      <div className="w-12 text-center">Active</div>
                      <div className="w-8"></div>
                    </div>
                  </div>
                  
                  {groupVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="p-4 bg-card rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="font-medium">
                            {(() => {
                                const majorAttrId = attributes?.[0]?.id;
                                const displayValues = variant.product_variant_values?.filter(vv => 
                                  !majorAttrId || vv.product_attribute_values?.attribute_id !== majorAttrId
                                );
                                
                                if (!displayValues || displayValues.length === 0) {
                                  if (variant.product_variant_values?.length === 1 && variant.product_variant_values[0].product_attribute_values?.attribute_id === majorAttrId) {
                                    return "Standard"; 
                                  }
                                  return "Standard";
                                }

                                return displayValues.map(vv => 
                                  `${vv.product_attribute_values?.product_attributes?.name}: ${vv.product_attribute_values?.value}`
                                ).join(', ');
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 flex justify-center">
                            <Checkbox
                              checked={selectedVariantIds.includes(variant.id)}
                              onCheckedChange={() => toggleVariantSelection(variant.id)}
                            />
                          </div>
                          <div className="text-right">
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariantMutation.mutate({ id: variant.id, price: parseFloat(e.target.value) })}
                              className="w-24 text-right"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={variant.stock_quantity}
                              onChange={(e) => updateVariantMutation.mutate({ id: variant.id, stock_quantity: parseInt(e.target.value) || 0 })}
                              className="w-20 text-right"
                            />
                          </div>
                          <div className="w-12 text-center">
                            <Switch
                              checked={variant.is_available}
                              onCheckedChange={(checked) => updateVariantMutation.mutate({ id: variant.id, is_available: checked })}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this variant?')) {
                                deleteVariantMutation.mutate(variant.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Variant Images */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 overflow-x-auto py-2">
                          {variant.image_urls?.map((url, index) => (
                            <div key={index} className="relative group flex-shrink-0">
                              <img 
                                src={url} 
                                alt="Variant" 
                                className="w-16 h-16 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-1 -right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeImageFromVariant(variant.id, index);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {(variant.image_urls?.length || 0) < 6 && (
                            <label className="flex items-center justify-center w-16 h-16 border-2 border-dashed rounded cursor-pointer hover:bg-muted/50 transition-colors flex-shrink-0">
                              <Plus className="w-4 h-4 text-muted-foreground" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => addImageToVariant(variant.id, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No variants added yet. Use the form above to add variants.
          </div>
        )}
      </div>
    </div>
  );
}
