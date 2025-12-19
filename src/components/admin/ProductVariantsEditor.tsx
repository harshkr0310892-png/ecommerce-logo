import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

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
  attribute_value_id: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  image_urls?: string[];
}

interface ProductVariantsEditorProps {
  productId: string;
  basePrice: number;
  onVariantImagesStatusChange?: (hasVariantImages: boolean) => void;
}

export function ProductVariantsEditor({ productId, basePrice, onVariantImagesStatusChange }: ProductVariantsEditorProps) {
  const queryClient = useQueryClient();
  const [newVariant, setNewVariant] = useState({
    attribute_id: '',
    attribute_value_id: '',
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

  // Fetch variants for this product
  const { data: variants, isLoading: variantsLoading } = useQuery({
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
    mutationFn: async (data: typeof newVariant) => {
      const { error } = await supabase.from('product_variants').insert({
        product_id: productId,
        attribute_value_id: data.attribute_value_id,
        price: parseFloat(data.price),
        stock_quantity: parseInt(data.stock_quantity) || 0,
        is_available: data.is_available,
        image_urls: data.image_urls || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      toast.success('Variant added!');
      setNewVariant({
        attribute_id: '',
        attribute_value_id: '',
        price: basePrice.toString(),
        stock_quantity: '0',
        is_available: true,
        image_urls: [] as string[],
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This variant already exists for this product');
      } else {
        toast.error('Failed to add variant');
      }
    },
  });

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
    
    // Reset input
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
    
    // Reset input
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

  const getAttributeName = (attributeValueId: string) => {
    const value = attributeValues?.find(v => v.id === attributeValueId);
    if (!value) return '';
    const attr = attributes?.find(a => a.id === value.attribute_id);
    return attr?.name || '';
  };

  const getValueName = (attributeValueId: string) => {
    const value = attributeValues?.find(v => v.id === attributeValueId);
    return value?.value || '';
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Attribute</Label>
              <Select
                value={newVariant.attribute_id}
                onValueChange={(val) => setNewVariant({ ...newVariant, attribute_id: val, attribute_value_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes?.map(attr => (
                    <SelectItem key={attr.id} value={attr.id}>{attr.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Value</Label>
              <Select
                value={newVariant.attribute_value_id}
                onValueChange={(val) => setNewVariant({ ...newVariant, attribute_value_id: val })}
                disabled={!newVariant.attribute_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {getValuesForAttribute(newVariant.attribute_id).map(val => (
                    <SelectItem key={val.id} value={val.id}>{val.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              onClick={() => addVariantMutation.mutate(newVariant)}
              disabled={!newVariant.attribute_value_id || addVariantMutation.isPending}
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
                  onClick={() => removeImageFromNewVariant(index)}
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
          <div className="space-y-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="p-4 bg-card rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="font-medium">
                      {getAttributeName(variant.attribute_value_id)}: {getValueName(variant.attribute_value_id)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <Switch
                      checked={variant.is_available}
                      onCheckedChange={(checked) => updateVariantMutation.mutate({ id: variant.id, is_available: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteVariantMutation.mutate(variant.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image Upload for Existing Variant */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <Label className="text-xs">Variant Images</Label>
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Array.isArray(variant.image_urls) && variant.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Variant ${index + 1}`} 
                          className="w-full h-16 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImageFromVariant(variant.id, index)}
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      </div>
                    ))}
                    {(Array.isArray(variant.image_urls) ? variant.image_urls.length : 0) < 6 && (
                      <label className="flex items-center justify-center w-full h-16 border-2 border-dashed rounded cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => addImageToVariant(variant.id, e)}
                          disabled={(Array.isArray(variant.image_urls) ? variant.image_urls.length : 0) >= 6}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No variants added yet. This product will use the base price.
          </p>
        )}
      </div>
    </div>
  );
}
