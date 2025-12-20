import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Loader2, Tag, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Attribute {
  id: string;
  name: string;
  icon_url: string | null;
  sort_order: number;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  sort_order: number;
  value_icon_url?: string | null;
  value_icon_shape?: 'circle' | 'square' | 'rectangle' | 'triangle' | null;
}

export function AttributesManager() {
  const queryClient = useQueryClient();
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [attributeForm, setAttributeForm] = useState({ name: '', icon_url: '' });
  const [valueForm, setValueForm] = useState({ value: '', value_icon_url: '', value_icon_shape: 'circle' as 'circle' | 'square' | 'rectangle' | 'triangle' });

  // Fetch attributes
  const { data: attributes, isLoading: attributesLoading } = useQuery({
    queryKey: ['product-attributes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Attribute[];
    },
  });

  // Fetch all attribute values
  const { data: attributeValues } = useQuery({
    queryKey: ['product-attribute-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_attribute_values')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as AttributeValue[];
    },
  });

  // Add/Edit attribute mutation
  const attributeMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string; icon_url: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('product_attributes')
          .update({ name: data.name, icon_url: data.icon_url || null })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_attributes')
          .insert({ name: data.name, icon_url: data.icon_url || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
      toast.success(editingAttribute ? 'Attribute updated!' : 'Attribute added!');
      resetAttributeForm();
      setAttributeDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('An attribute with this name already exists');
      } else {
        toast.error('Failed to save attribute');
      }
    },
  });

  // Delete attribute mutation
  const deleteAttributeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_attributes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
      queryClient.invalidateQueries({ queryKey: ['product-attribute-values'] });
      toast.success('Attribute deleted!');
    },
    onError: () => toast.error('Failed to delete attribute'),
  });

  // Add/Edit value mutation
  const valueMutation = useMutation({
    mutationFn: async (data: { id?: string; attribute_id: string; value: string; value_icon_url?: string | null; value_icon_shape?: 'circle' | 'square' | 'rectangle' | 'triangle' | null }) => {
      if (data.id) {
        const { error } = await supabase
          .from('product_attribute_values')
          .update({ value: data.value, value_icon_url: data.value_icon_url ?? null, value_icon_shape: data.value_icon_shape ?? null })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_attribute_values')
          .insert({ attribute_id: data.attribute_id, value: data.value, value_icon_url: data.value_icon_url ?? null, value_icon_shape: data.value_icon_shape ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attribute-values'] });
      toast.success(editingValue ? 'Value updated!' : 'Value added!');
      resetValueForm();
      setValueDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This value already exists for this attribute');
      } else {
        toast.error('Failed to save value');
      }
    },
  });

  // Delete value mutation
  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_attribute_values').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attribute-values'] });
      toast.success('Value deleted!');
    },
    onError: () => toast.error('Failed to delete value'),
  });

  const resetAttributeForm = () => {
    setAttributeForm({ name: '', icon_url: '' });
    setEditingAttribute(null);
  };

  const resetValueForm = () => {
    setValueForm({ value: '', value_icon_url: '', value_icon_shape: 'circle' });
    setEditingValue(null);
    setSelectedAttributeId(null);
  };

  const openEditAttribute = (attr: Attribute) => {
    setEditingAttribute(attr);
    setAttributeForm({ name: attr.name, icon_url: attr.icon_url || '' });
    setAttributeDialogOpen(true);
  };

  const openAddValue = (attributeId: string) => {
    setSelectedAttributeId(attributeId);
    setEditingValue(null);
    setValueForm({ value: '', value_icon_url: '', value_icon_shape: 'circle' });
    setValueDialogOpen(true);
  };

  const openEditValue = (val: AttributeValue) => {
    setEditingValue(val);
    setSelectedAttributeId(val.attribute_id);
    setValueForm({ value: val.value, value_icon_url: val.value_icon_url || '', value_icon_shape: (val.value_icon_shape as any) || 'circle' });
    setValueDialogOpen(true);
  };

  const getValuesForAttribute = (attributeId: string) => {
    return attributeValues?.filter(v => v.attribute_id === attributeId) || [];
  };

  if (attributesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Product Attributes</h2>
          <p className="text-sm text-muted-foreground">
            Manage attributes like Size, Color, Material, etc.
          </p>
        </div>
        <Button
          variant="royal"
          onClick={() => {
            resetAttributeForm();
            setAttributeDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Attributes List */}
      {!attributes || attributes.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
          <Tag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No attributes created yet</p>
          <p className="text-sm text-muted-foreground">Add attributes like Size, Color, Material</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {attributes.map((attr) => (
            <AccordionItem
              key={attr.id}
              value={attr.id}
              className="bg-card rounded-xl border border-border/50 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  {attr.icon_url ? (
                    <img src={attr.icon_url} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="font-medium">{attr.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({getValuesForAttribute(attr.id).length} values)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={() => openEditAttribute(attr)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteAttributeMutation.mutate(attr.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openAddValue(attr.id)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Value
                  </Button>
                </div>

                {/* Values */}
                <div className="flex flex-wrap gap-2">
                  {getValuesForAttribute(attr.id).map((val) => (
                    <div
                      key={val.id}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
                    >
                      {val.value_icon_url ? (
                        <img
                          src={val.value_icon_url}
                          alt=""
                          className={
                            `object-cover ${val.value_icon_shape === 'circle' ? 'rounded-full' : val.value_icon_shape === 'square' ? 'rounded-md' : 'rounded-sm'} ${val.value_icon_shape === 'rectangle' ? 'w-8 h-5' : 'w-6 h-6'}`
                          }
                          style={val.value_icon_shape === 'triangle' ? { clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' } : undefined}
                        />
                      ) : null}
                      <span>{val.value}</span>
                      <button
                        onClick={() => openEditValue(val)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteValueMutation.mutate(val.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {getValuesForAttribute(attr.id).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No values added yet</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Attribute Dialog */}
      <Dialog open={attributeDialogOpen} onOpenChange={setAttributeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAttribute ? 'Edit Attribute' : 'Add Attribute'}</DialogTitle>
            <DialogDescription>
              Create attributes like Size, Color, Material that can be assigned to products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Attribute Name</Label>
              <Input
                value={attributeForm.name}
                onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                placeholder="e.g., Size, Color, Material"
              />
            </div>
            <div>
              <Label>Icon URL (optional)</Label>
              <Input
                value={attributeForm.icon_url}
                onChange={(e) => setAttributeForm({ ...attributeForm, icon_url: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
            </div>
            <Button
              variant="royal"
              className="w-full"
              onClick={() =>
                attributeMutation.mutate({
                  id: editingAttribute?.id,
                  name: attributeForm.name,
                  icon_url: attributeForm.icon_url,
                })
              }
              disabled={!attributeForm.name.trim() || attributeMutation.isPending}
            >
              {attributeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingAttribute ? 'Update Attribute' : 'Add Attribute'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingValue ? 'Edit Value' : 'Add Value'}</DialogTitle>
            <DialogDescription>
              Add values like S, M, L, XL for Size or Red, Blue, Green for Color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Value</Label>
              <Input
                value={valueForm.value}
                onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                placeholder="e.g., S, M, L, Red, Blue"
              />
            </div>
            <div>
              <Label>Logo URL (optional)</Label>
              <Input
                value={valueForm.value_icon_url}
                onChange={(e) => setValueForm({ ...valueForm, value_icon_url: e.target.value })}
                placeholder="https://...logo.png"
              />
              <p className="text-xs text-muted-foreground mt-1">Paste a URL or upload below to auto-fill.</p>
            </div>
            <div>
              <Label>Logo Shape</Label>
              <Select value={valueForm.value_icon_shape} onValueChange={(v) => setValueForm({ ...valueForm, value_icon_shape: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="triangle">Triangle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer text-sm hover:bg-muted/50">
                <Plus className="w-4 h-4" /> Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const ext = file.name.split('.').pop();
                      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                      const filePath = `attribute-values/${fileName}`;
                      const { error } = await supabase.storage.from('product-images').upload(filePath, file);
                      if (error) throw error;
                      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
                      setValueForm((prev) => ({ ...prev, value_icon_url: data.publicUrl }));
                      toast.success('Logo uploaded');
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to upload logo');
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              {valueForm.value_icon_url ? (
                <img src={valueForm.value_icon_url} className="w-8 h-8 rounded object-cover border" alt="preview" />
              ) : null}
            </div>
            <Button
              variant="royal"
              className="w-full"
              onClick={() =>
                valueMutation.mutate({
                  id: editingValue?.id,
                  attribute_id: selectedAttributeId!,
                  value: valueForm.value,
                  value_icon_url: valueForm.value_icon_url || null,
                  value_icon_shape: valueForm.value_icon_shape || 'circle',
                })
              }
              disabled={!valueForm.value.trim() || !selectedAttributeId || valueMutation.isPending}
            >
              {valueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingValue ? 'Update Value' : 'Add Value'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
