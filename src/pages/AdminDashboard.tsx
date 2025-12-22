import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Crown, LogOut, Plus, Package, ShoppingBag, Trash2, 
  Edit2, Loader2, RefreshCw, Upload, X, Ticket, Send, MessageCircle, Bell, Tag,
  TrendingUp, BarChart3, Calendar, DollarSign, FolderOpen, ZoomIn, Phone
} from "lucide-react";
import { PhotoViewerModal } from "@/components/PhotoViewerModal";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttributesManager } from "@/components/admin/AttributesManager";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  images: string[] | null;
  stock_status: string;
  stock_quantity: number | null;
  category_id: string | null;
  created_at: string;
  cash_on_delivery?: boolean;
  // Add new fields
  features?: { feature: string }[] | null;
  detailed_description?: string | null;
  dimensions?: string | null;
  // Add separate fields for dimensions
  height?: string | null;
  width?: string | null;
  weight?: string | null;
  // Add branding and seller fields
  brand?: string | null;
  brand_logo_url?: string | null;
  seller_name?: string | null;
  seller_description?: string | null;
  // Add GST field
  gst_percentage?: number | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  gst_percentage?: number | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  variant_info?: {
    attribute_name?: string;
    value_name?: string;
    variant_id?: string;
  } | null;
}

interface VariantInfo {
  attribute_name: string;
  value_name: string;
  variant_id: string;
}

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email: string | null;
  status: string;
  payment_method: 'online' | 'cod';
  total: number;
  created_at: string;
  updated_at: string;
}

interface OrderMessage {
  id: string;
  order_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// Add this interface for banned users
interface BannedUser {
  id: string;
  phone: string | null;
  email: string | null;
  reason: string | null;
  banned_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Add interface for contact submissions
interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  photos: string[] | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

// Add interface for COD restrictions
interface CodRestriction {
  id: string;
  phone_order_limit: number;
  ip_daily_order_limit: number;
  online_phone_order_limit: number;
  online_ip_daily_order_limit: number;
  is_active: boolean;
  cod_restrictions_enabled: boolean;
  online_restrictions_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Add interface for individual phone restrictions
interface IndividualPhoneRestriction {
  id: string;
  phone: string;
  cod_daily_limit: number;
  online_daily_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const MAX_IMAGES = 8;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [hasVariantImages, setHasVariantImages] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [orderMessages, setOrderMessages] = useState<Record<string, OrderMessage[]>>({});
  const [newAdminMessage, setNewAdminMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [nowTs, setNowTs] = useState(Date.now());
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discount_percentage: '0',
    stock_status: 'in_stock',
    stock_quantity: '0',
    category_id: '',
    cash_on_delivery: false,
    // Add new fields
    features: [{ feature: '' }],
    detailed_description: '',
    // Replace dimensions with separate fields
    height: '',
    width: '',
    weight: '',
    // Add branding and seller fields
    brand: '',
    brand_logo_url: '',
    seller_name: '',
    seller_description: '',
    // Add GST field
    gst_percentage: '',
  });
  // Add handler functions for features
  const addFeature = () => {
    setProductForm({
      ...productForm,
      features: [...productForm.features, { feature: '' }]
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...productForm.features];
    newFeatures.splice(index, 1);
    setProductForm({
      ...productForm,
      features: newFeatures
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...productForm.features];
    newFeatures[index] = { feature: value };
    setProductForm({
      ...productForm,
      features: newFeatures
    });
  };
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sort_order: '0',
    is_active: true,
    gst_percentage: '0',
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_uses: '',
    is_active: true,
    expires_at: '',
  });

  // Add banned users state variables
  const [bannedUserDialogOpen, setBannedUserDialogOpen] = useState(false);
  const [editingBannedUser, setEditingBannedUser] = useState<BannedUser | null>(null);
  const [bannedUserForm, setBannedUserForm] = useState({
    phone: '',
    email: '',
    reason: '',
    is_active: true,
  });

  // Add COD restrictions state variables
  const [editingCodRestriction, setEditingCodRestriction] = useState<CodRestriction | null>(null);
  const [codRestrictionForm, setCodRestrictionForm] = useState({
    phone_order_limit: '10',
    ip_daily_order_limit: '5',
    online_phone_order_limit: '10',
    online_ip_daily_order_limit: '5',
    is_active: true,
    cod_restrictions_enabled: true,
    online_restrictions_enabled: true,
  });

  // Add individual phone restrictions state variables
  const [individualPhoneRestrictions, setIndividualPhoneRestrictions] = useState<IndividualPhoneRestriction[]>([]);
  const [editingIndividualPhoneRestriction, setEditingIndividualPhoneRestriction] = useState<IndividualPhoneRestriction | null>(null);
  const [individualPhoneRestrictionForm, setIndividualPhoneRestrictionForm] = useState({
    phone: '',
    cod_daily_limit: '2',
    online_daily_limit: '10',
    is_active: true,
  });

  // Photo viewer state
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [currentPhotoUrls, setCurrentPhotoUrls] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Delete confirmation state
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [contactFilter, setContactFilter] = useState('');
    const [contactFilterType, setContactFilterType] = useState('all');
    const [orderFilter, setOrderFilter] = useState('');
    const [orderFilterType, setOrderFilterType] = useState('all');

  // Check admin login on mount
  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
    setIsAdminLoggedIn(isAdmin);
    if (!isAdmin) {
      navigate('/admin');
    }
  }, [navigate]);
  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    navigate('/admin');
  };

  // Fetch products

  // Fetch products
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Transform features data to match the expected type
      return data.map(product => ({
        ...product,
        features: Array.isArray(product.features) ? product.features.map((f: any) => ({ feature: typeof f === 'string' ? f : f.feature || '' })) : [{ feature: '' }],
      })) as unknown as Product[];
    },
  });

  // Fetch orders with realtime
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Fetch coupons
  const { data: coupons, isLoading: couponsLoading, refetch: refetchCoupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  // Add fetch banned users query
  const { data: bannedUsers, isLoading: bannedUsersLoading, refetch: refetchBannedUsers } = useQuery({
    queryKey: ['admin-banned-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BannedUser[];
    },
  });

  // Add fetch contact submissions query
  const { data: contactSubmissions, isLoading: contactSubmissionsLoading, refetch: refetchContactSubmissions } = useQuery({
    queryKey: ['admin-contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactSubmission[];
    },
  });

  // Add fetch COD restrictions query
  const { data: codRestrictions, isLoading: codRestrictionsLoading, refetch: refetchCodRestrictions } = useQuery({
    queryKey: ['admin-cod-restrictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cod_restrictions')
        .select('*')
        .limit(1);
      if (error) throw error;
      return data as CodRestriction[];
    },
  });

  // Add fetch individual phone restrictions query
  const { data: individualPhoneRestrictionsData, isLoading: individualPhoneRestrictionsLoading, refetch: refetchIndividualPhoneRestrictions } = useQuery({
    queryKey: ['admin-individual-phone-restrictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('individual_phone_restrictions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IndividualPhoneRestriction[];
    },
  });

  // Delete all contact submissions
  const handleDeleteAllContactSubmissions = async () => {
    console.log('Delete all button clicked');
    if (!contactSubmissions || contactSubmissions.length === 0) return;
    
    try {
      // Show confirmation dialog
      console.log('Showing delete all confirmation dialog');
      setShowDeleteAllDialog(true);
    } catch (error) {
      console.error('Error preparing to delete all contact submissions:', error);
      toast.error('Failed to prepare deletion');
    }
  };

  // Confirm delete all contact submissions
  const confirmDeleteAllContactSubmissions = () => {
    deleteAllContactSubmissionsMutation.mutate();
  };

  // Delete individual contact submission
  const handleDeleteContactSubmission = (id: string) => {
    deleteContactSubmissionMutation.mutate(id);
  };

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch order items for all orders
  useEffect(() => {
    if (!orders) return;
    
    const fetchOrderItems = async () => {
      const orderIds = orders.map(o => o.id);
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (data) {
        const itemsByOrder: Record<string, OrderItem[]> = {};
        data.forEach(item => {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
          itemsByOrder[item.order_id].push({
            ...item,
            variant_info: item.variant_info as OrderItem['variant_info'],
          });
        });
        setOrderItems(itemsByOrder);
      }
    };

    fetchOrderItems();
  }, [orders]);

  // Setup realtime subscription for orders and messages
  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 5000);

    const ordersChannel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          refetchOrders();
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newOrder = payload.new as Order;
            if (newOrder.status === 'cancelled') {
              setNotifications(prev => [...prev, `Order ${newOrder.order_id} was cancelled by customer!`]);
              toast.error(`Order ${newOrder.order_id} was cancelled by customer!`);
            }
          }
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('admin-messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages' },
        (payload) => {
          const newMsg = payload.new as OrderMessage;
          if (!newMsg.is_admin) {
            toast.info(`New message from customer on order`);
            setOrderMessages(prev => ({
              ...prev,
              [newMsg.order_id]: [...(prev[newMsg.order_id] || []), newMsg]
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(messagesChannel);
      clearInterval(interval);
    };
  }, [refetchOrders]);

  // Filter contact submissions (case-insensitive)
  const filteredContactSubmissions = contactSubmissions?.filter(submission => {
    if (!contactFilter) return true;
    
    const filterUpper = contactFilter.toUpperCase();
    
    switch (contactFilterType) {
      case 'name':
        return submission.name?.toUpperCase().includes(filterUpper);
      case 'email':
        return submission.email?.toUpperCase().includes(filterUpper);
      case 'phone':
        return submission.phone?.toUpperCase().includes(filterUpper);
      case 'subject':
        return submission.subject?.toUpperCase().includes(filterUpper);
      default:
        return (
          submission.name?.toUpperCase().includes(filterUpper) ||
          submission.email?.toUpperCase().includes(filterUpper) ||
          submission.phone?.toUpperCase().includes(filterUpper) ||
          submission.subject?.toUpperCase().includes(filterUpper) ||
          submission.description?.toUpperCase().includes(filterUpper)
        );
    }
  });

  // Filter orders (case-insensitive)
  const filteredOrders = orders?.filter(order => {
    if (!orderFilter) return true;
    
    const filterUpper = orderFilter.toUpperCase();
    
    switch (orderFilterType) {
      case 'orderId':
        return order.order_id?.toUpperCase().includes(filterUpper);
      case 'customer':
        return order.customer_name?.toUpperCase().includes(filterUpper);
      case 'phone':
        return order.customer_phone?.toUpperCase().includes(filterUpper);
      case 'status':
        return order.status?.toUpperCase().includes(filterUpper);
      default:
        return (
          order.order_id?.toUpperCase().includes(filterUpper) ||
          order.customer_name?.toUpperCase().includes(filterUpper) ||
          order.customer_phone?.toUpperCase().includes(filterUpper) ||
          order.status?.toUpperCase().includes(filterUpper) ||
          order.customer_address?.toUpperCase().includes(filterUpper)
        );
    }
  });

  // Fetch messages for selected order
  useEffect(() => {
    if (!selectedOrder) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', selectedOrder.id)
        .order('created_at', { ascending: true });
      
      if (data) {
        setOrderMessages(prev => ({ ...prev, [selectedOrder.id]: data }));
      }
    };

    fetchMessages();
  }, [selectedOrder?.id]);

  // Send admin message
  const sendAdminMessage = async () => {
    if (!newAdminMessage.trim() || !selectedOrder) return;
    setSendingMessage(true);

    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: selectedOrder.id,
          message: newAdminMessage.trim(),
          is_admin: true,
        });

      if (error) throw error;

      setOrderMessages(prev => ({
        ...prev,
        [selectedOrder.id]: [...(prev[selectedOrder.id] || []), {
          id: Date.now().toString(),
          order_id: selectedOrder.id,
          message: newAdminMessage.trim(),
          is_admin: true,
          created_at: new Date().toISOString()
        }]
      }));
      setNewAdminMessage('');
      toast.success('Message sent to customer!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - productImages.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      setProductImages([...productImages, ...newImages]);
      toast.success('Images uploaded successfully!');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingBrandLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `brand-logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setProductForm({ ...productForm, brand_logo_url: publicUrl });
      toast.success('Brand logo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading brand logo:', error);
      toast.error('Failed to upload brand logo');
    } finally {
      setUploadingBrandLogo(false);
      if (brandLogoInputRef.current) {
        brandLogoInputRef.current.value = '';
      }
    }
  };

  // Add/Edit product mutation
  const productMutation = useMutation({
    mutationFn: async (product: typeof productForm & { id?: string }) => {
      const data = {
        name: product.name,
        description: product.description || null,
        price: parseFloat(product.price),
        discount_percentage: parseInt(product.discount_percentage) || 0,
        image_url: productImages[0] || null,
        images: productImages,
        stock_status: product.stock_status,
        stock_quantity: parseInt(product.stock_quantity) || 0,
        category_id: product.category_id || null,
        cash_on_delivery: product.cash_on_delivery || false,
        // Add new fields
        features: product.features,
        detailed_description: product.detailed_description || null,
        // Save dimensions as a combined string for backward compatibility
        dimensions: product.height || product.width || product.weight 
          ? `${product.height || ''} x ${product.width || ''} x ${product.weight || ''}`.replace(/x\s*x/g, 'x').replace(/^\s*x\s*|\s*x\s*$/g, '') || null
          : null,
        // Also save individual fields
        height: product.height || null,
        width: product.width || null,
        weight: product.weight || null,
        // Save branding and seller fields
        brand: product.brand || null,
        brand_logo_url: product.brand_logo_url || null,
        seller_name: product.seller_name || null,
        seller_description: product.seller_description || null,
        // Save GST field
        gst_percentage: product.gst_percentage ? parseFloat(product.gst_percentage) : null,
      };

      if (product.id) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingProduct ? 'Product updated!' : 'Product added!');
      resetProductForm();
      setProductDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted!');
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    },
  });

  // Add/Edit coupon mutation
  const couponMutation = useMutation({
    mutationFn: async (coupon: typeof couponForm & { id?: string }) => {
      const data = {
        code: coupon.code.toUpperCase(),
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value) || 0,
        min_order_amount: parseFloat(coupon.min_order_amount) || 0,
        max_uses: coupon.max_uses ? parseInt(coupon.max_uses) : null,
        is_active: coupon.is_active,
        expires_at: coupon.expires_at || null,
      };

      if (coupon.id) {
        const { error } = await supabase
          .from('coupons')
          .update(data)
          .eq('id', coupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(editingCoupon ? 'Coupon updated!' : 'Coupon added!');
      resetCouponForm();
      setCouponDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted!');
    },
    onError: (error) => {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    },
  });

  // Add/Edit category mutation
  const categoryMutation = useMutation({
    mutationFn: async (category: typeof categoryForm & { id?: string }) => {
      const data = {
        name: category.name,
        description: category.description || null,
        sort_order: parseInt(category.sort_order) || 0,
        is_active: category.is_active,
        gst_percentage: parseFloat(category.gst_percentage) || 0,
      };

      if (category.id) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(editingCategory ? 'Category updated!' : 'Category added!');
      resetCategoryForm();
      setCategoryDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    },
  });

  // Add banned users mutation functions
  const bannedUserMutation = useMutation({
    mutationFn: async (bannedUserData: any) => {
      // Separate the banned_by field as it should not be updated after creation
      const { banned_by, ...dataToSave } = bannedUserData;
      
      const { data, error } = bannedUserData.id
        ? await supabase
            .from('banned_users')
            .update(dataToSave)
            .eq('id', bannedUserData.id)
            .select()
            .single()
        : await supabase
            .from('banned_users')
            .insert({ ...dataToSave, banned_by })
            .select()
            .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banned-users'] });
      setBannedUserDialogOpen(false);
      resetBannedUserForm();
      toast.success(editingBannedUser ? 'Banned user updated successfully' : 'User banned successfully');
    },
    onError: (error: any) => {
      console.error('Error saving banned user:', error);
      toast.error(`Failed to save banned user: ${error.message}`);
    },
  });

  const deleteBannedUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banned-users'] });
      toast.success('Banned user removed successfully');
    },
    onError: (error) => {
      console.error('Error removing banned user:', error);
      toast.error('Failed to remove banned user');
    },
  });

  // Add delete mutation for individual phone restrictions
  const deleteIndividualPhoneRestrictionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('individual_phone_restrictions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-individual-phone-restrictions'] });
      toast.success('Individual phone restriction removed successfully');
    },
    onError: (error) => {
      console.error('Error removing individual phone restriction:', error);
      toast.error('Failed to remove individual phone restriction');
    },
  });

  // Add COD restrictions mutation
  const codRestrictionMutation = useMutation({
    mutationFn: async (codRestrictionData: any) => {
      const data = {
        phone_order_limit: parseInt(codRestrictionData.phone_order_limit) || 10,
        ip_daily_order_limit: parseInt(codRestrictionData.ip_daily_order_limit) || 5,
        online_phone_order_limit: parseInt(codRestrictionData.online_phone_order_limit) || 10,
        online_ip_daily_order_limit: parseInt(codRestrictionData.online_ip_daily_order_limit) || 5,
        is_active: codRestrictionData.is_active,
        cod_restrictions_enabled: codRestrictionData.cod_restrictions_enabled,
        online_restrictions_enabled: codRestrictionData.online_restrictions_enabled,
      };

      // Since there should only be one COD restriction record, we'll update the existing one or insert a new one
      const { data: existingData, error: fetchError } = await supabase
        .from('cod_restrictions')
        .select('id')
        .limit(1);

      if (fetchError) throw fetchError;

      let result;
      if (existingData && existingData.length > 0) {
        // Update existing record
        const { data: updatedData, error } = await supabase
          .from('cod_restrictions')
          .update(data)
          .eq('id', existingData[0].id)
          .select()
          .single();
        
        if (error) throw error;
        result = updatedData;
      } else {
        // Insert new record
        const { data: insertedData, error } = await supabase
          .from('cod_restrictions')
          .insert(data)
          .select()
          .single();
        
        if (error) throw error;
        result = insertedData;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cod-restrictions'] });
      toast.success('COD restrictions updated successfully');
    },
    onError: (error: any) => {
      console.error('Error saving COD restrictions:', error);
      toast.error(`Failed to save COD restrictions: ${error.message}`);
    },
  });

  // Add individual phone restrictions mutation
  const individualPhoneRestrictionMutation = useMutation({
    mutationFn: async (individualPhoneRestrictionData: any) => {
      const data = {
        phone: individualPhoneRestrictionData.phone,
        cod_daily_limit: parseInt(individualPhoneRestrictionData.cod_daily_limit) || 2,
        online_daily_limit: parseInt(individualPhoneRestrictionData.online_daily_limit) || 10,
        is_active: individualPhoneRestrictionData.is_active,
      };

      let result;
      if (individualPhoneRestrictionData.id) {
        // Update existing record
        const { data: updatedData, error } = await supabase
          .from('individual_phone_restrictions')
          .update(data)
          .eq('id', individualPhoneRestrictionData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = updatedData;
      } else {
        // Insert new record
        const { data: insertedData, error } = await supabase
          .from('individual_phone_restrictions')
          .insert(data)
          .select()
          .single();
        
        if (error) throw error;
        result = insertedData;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-individual-phone-restrictions'] });
      toast.success('Individual phone restriction saved successfully');
    },
    onError: (error: any) => {
      console.error('Error saving individual phone restriction:', error);
      toast.error(`Failed to save individual phone restriction: ${error.message}`);
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated!');
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      // Note: Due to RLS policies, only delivered orders can be deleted by non-admin users
      // Canceled orders require admin privileges which aren't available in this frontend context
    },
    onSuccess: (_, id) => {
      // Optimistically remove from cache so UI updates even before refetch
      queryClient.setQueryData<Order[] | undefined>(['admin-orders'], (prev) =>
        prev ? prev.filter((o) => o.id !== id) : prev
      );
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting order:', error);
      toast.error('Deletion failed. Please try again.');
    },
  });

  // Delete all contact submissions mutation (UI only)
  const deleteAllContactSubmissionsMutation = useMutation({
    mutationFn: async () => {
      // UI-only deletion - don't actually delete from database
      // This is intentional per requirements
      return Promise.resolve();
    },
    onSuccess: () => {
      // Optimistically clear the UI
      queryClient.setQueryData<ContactSubmission[] | undefined>(['admin-contact-submissions'], []);
      toast.success('All contact submissions removed from view!');
      setShowDeleteAllDialog(false);
    },
    onError: (error: any) => {
      console.error('Error clearing contact submissions from UI:', error);
      toast.error('Failed to clear contact submissions from view');
      setShowDeleteAllDialog(false);
    },
  });

  // Delete individual contact submission mutation
  const deleteContactSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-submissions'] });
      toast.success('Contact submission deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting contact submission:', error);
      toast.error('Failed to delete contact submission');
    },
  });

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      discount_percentage: '0',
      stock_status: 'in_stock',
      stock_quantity: '0',
      category_id: '',
      cash_on_delivery: false,
      // Add new fields
      features: [{ feature: '' }],
      detailed_description: '',
      // Replace dimensions with separate fields
      height: '',
      width: '',
      weight: '',
      // Add branding and seller fields
      brand: '',
      brand_logo_url: '',
      seller_name: '',
      seller_description: '',
      // Add GST field
      gst_percentage: '',
    });
    setProductImages([]);
    setHasVariantImages(false);
    setEditingProduct(null);
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      max_uses: '',
      is_active: true,
      expires_at: '',
    });
    setEditingCoupon(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount_percentage: (product.discount_percentage || 0).toString(),
      stock_status: product.stock_status,
      stock_quantity: (product.stock_quantity || 0).toString(),
      category_id: product.category_id || '',
      cash_on_delivery: product.cash_on_delivery || false,
      // Add new fields
      features: product.features && product.features.length > 0 ? product.features : [{ feature: '' }],
      detailed_description: product.detailed_description || '',
      // Replace dimensions with separate fields
      height: product.height || '',
      width: product.width || '',
      weight: product.weight || '',
      // Add branding and seller fields
      brand: product.brand || '',
      brand_logo_url: product.brand_logo_url || '',
      seller_name: product.seller_name || '',
      seller_description: product.seller_description || '',
      // Add GST field
      gst_percentage: product.gst_percentage ? product.gst_percentage.toString() : '',
    });
    setProductImages(product.images || (product.image_url ? [product.image_url] : []));
    setHasVariantImages(false); // Will be updated by ProductVariantsEditor
    setProductDialogOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: (coupon.min_order_amount || 0).toString(),
      max_uses: coupon.max_uses?.toString() || '',
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
    });
    setCouponDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', sort_order: '0', is_active: true, gst_percentage: '0' });
    setEditingCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order.toString(),
      is_active: category.is_active,
      gst_percentage: category.gst_percentage ? category.gst_percentage.toString() : '0',
    });
    setCategoryDialogOpen(true);
  };

  // Add handler function for banned users
  const handleEditBannedUser = (bannedUser: BannedUser) => {
    setEditingBannedUser(bannedUser);
    setBannedUserForm({
      phone: bannedUser.phone || '',
      email: bannedUser.email || '',
      reason: bannedUser.reason || '',
      is_active: bannedUser.is_active,
    });
    setBannedUserDialogOpen(true);
  };

  // Add handler function for individual phone restrictions
  const handleEditIndividualPhoneRestriction = (restriction: IndividualPhoneRestriction) => {
    setEditingIndividualPhoneRestriction(restriction);
    setIndividualPhoneRestrictionForm({
      phone: restriction.phone || '',
      cod_daily_limit: restriction.cod_daily_limit.toString(),
      online_daily_limit: restriction.online_daily_limit.toString(),
      is_active: restriction.is_active,
    });
  };

  // Add reset function for banned users
  const resetBannedUserForm = () => {
    setBannedUserForm({ phone: '', email: '', reason: '', is_active: true });
    setEditingBannedUser(null);
  };

  // Add reset function for COD restrictions
  const resetCodRestrictionForm = () => {
    setCodRestrictionForm({ 
      phone_order_limit: '10', 
      ip_daily_order_limit: '5', 
      online_phone_order_limit: '10', 
      online_ip_daily_order_limit: '5', 
      is_active: true,
      cod_restrictions_enabled: true,
      online_restrictions_enabled: true
    });
    setEditingCodRestriction(null);
  };

  // Add reset function for individual phone restrictions
  const resetIndividualPhoneRestrictionForm = () => {
    setIndividualPhoneRestrictionForm({ 
      phone: '', 
      cod_daily_limit: '2', 
      online_daily_limit: '10', 
      is_active: true 
    });
    setEditingIndividualPhoneRestriction(null);
  };

  // Initialize COD restriction form with actual values
  useEffect(() => {
    if (codRestrictions && codRestrictions.length > 0) {
      const restriction = codRestrictions[0];
      setCodRestrictionForm({
        phone_order_limit: restriction.phone_order_limit.toString(),
        ip_daily_order_limit: restriction.ip_daily_order_limit.toString(),
        online_phone_order_limit: restriction.online_phone_order_limit?.toString() || '10',
        online_ip_daily_order_limit: restriction.online_ip_daily_order_limit?.toString() || '5',
        is_active: restriction.is_active,
        cod_restrictions_enabled: restriction.cod_restrictions_enabled !== undefined ? restriction.cod_restrictions_enabled : true,
        online_restrictions_enabled: restriction.online_restrictions_enabled !== undefined ? restriction.online_restrictions_enabled : true,
      });
    }
  }, [codRestrictions]);

  // Update individual phone restrictions state when data is fetched
  useEffect(() => {
    if (individualPhoneRestrictionsData) {
      setIndividualPhoneRestrictions(individualPhoneRestrictionsData);
    }
  }, [individualPhoneRestrictionsData]);

  // Handle form submissions
  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error('Please enter a category name');
      return;
    }
    categoryMutation.mutate({
      ...categoryForm,
      id: editingCategory?.id,
    });
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast.error('Please fill in required fields');
      return;
    }
    productMutation.mutate({
      ...productForm,
      id: editingProduct?.id,
    });
  };

  const handleSubmitCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discount_value) {
      toast.error('Please fill in required fields');
      return;
    }
    couponMutation.mutate({
      ...couponForm,
      id: editingCoupon?.id,
    });
  };

  // Add submit handler for banned users
  const handleSubmitBannedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that either phone or email is provided
    if (!bannedUserForm.phone && !bannedUserForm.email) {
      toast.error('Please provide either a phone number or email address');
      return;
    }
    
    // Normalize phone number if provided
    let normalizedPhone = null;
    if (bannedUserForm.phone) {
      // Remove any non-digit characters and ensure it's a 10-digit Indian number
      const digitsOnly = bannedUserForm.phone.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        normalizedPhone = `+91${digitsOnly}`;
      } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        normalizedPhone = `+${digitsOnly}`;
      } else if (digitsOnly.length === 13 && digitsOnly.startsWith('91')) {
        normalizedPhone = `+${digitsOnly}`;
      } else {
        toast.error('Please enter a valid 10-digit Indian mobile number');
        return;
      }
    }
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    bannedUserMutation.mutate({
      ...bannedUserForm,
      ...(normalizedPhone && { phone: normalizedPhone }), // Use normalized phone if available
      id: editingBannedUser?.id,
      // Only include banned_by if user is authenticated
      ...(user?.id && { banned_by: user.id }),
    });
  };

  // Add submit handler for COD restrictions
  const handleSubmitCodRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const phoneLimit = parseInt(codRestrictionForm.phone_order_limit);
    const ipLimit = parseInt(codRestrictionForm.ip_daily_order_limit);
    const onlinePhoneLimit = parseInt(codRestrictionForm.online_phone_order_limit);
    const onlineIpLimit = parseInt(codRestrictionForm.online_ip_daily_order_limit);
    
    if (isNaN(phoneLimit) || phoneLimit <= 0) {
      toast.error('Please enter a valid phone order limit');
      return;
    }
    
    if (isNaN(ipLimit) || ipLimit <= 0) {
      toast.error('Please enter a valid IP daily order limit');
      return;
    }
    
    if (isNaN(onlinePhoneLimit) || onlinePhoneLimit <= 0) {
      toast.error('Please enter a valid online payment phone order limit');
      return;
    }
    
    if (isNaN(onlineIpLimit) || onlineIpLimit <= 0) {
      toast.error('Please enter a valid online payment IP daily order limit');
      return;
    }
    
    codRestrictionMutation.mutate({
      ...codRestrictionForm,
    });
  };

  // Add submit handler for individual phone restrictions
  const handleSubmitIndividualPhoneRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!individualPhoneRestrictionForm.phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    const codLimit = parseInt(individualPhoneRestrictionForm.cod_daily_limit);
    const onlineLimit = parseInt(individualPhoneRestrictionForm.online_daily_limit);
    
    if (isNaN(codLimit) || codLimit < 0) {
      toast.error('Please enter a valid COD daily limit');
      return;
    }
    
    if (isNaN(onlineLimit) || onlineLimit < 0) {
      toast.error('Please enter a valid online payment daily limit');
      return;
    }
    
    // Normalize phone number
    let normalizedPhone = individualPhoneRestrictionForm.phone.trim();
    // Remove any non-digit characters
    const digitsOnly = normalizedPhone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      normalizedPhone = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      normalizedPhone = `+${digitsOnly}`;
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith('91')) {
      normalizedPhone = `+${digitsOnly}`;
    } else {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    
    individualPhoneRestrictionMutation.mutate({
      ...individualPhoneRestrictionForm,
      phone: normalizedPhone,
      id: editingIndividualPhoneRestriction?.id,
    });
  };

  const getProductById = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary" />
            <span className="font-display text-xl font-bold gradient-gold-text">
              Admin Dashboard
            </span>
          </div>
          <div className="flex gap-1 items-center">
            {notifications.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-destructive animate-pulse" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
            <Button variant="royalOutline" size="sm" onClick={() => navigate('/admin/cms')} className="px-2 py-1 text-sm">
              CMS
            </Button>
            <Button variant="royalOutline" size="sm" onClick={handleLogout} className="px-2 py-1 text-sm">
              <LogOut className="w-4 h-4 mr-1" />
              Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="flex w-max min-w-full sm:min-w-max gap-2">
              <TabsTrigger value="products" className="flex items-center gap-2 whitespace-nowrap">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 whitespace-nowrap">
                <FolderOpen className="w-4 h-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="attributes" className="flex items-center gap-2 whitespace-nowrap">
                <Tag className="w-4 h-4" />
                Attributes
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 whitespace-nowrap">
                <ShoppingBag className="w-4 h-4" />
                Orders
                {orders && orders.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full gradient-gold text-primary-foreground">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-2 whitespace-nowrap">
                <Ticket className="w-4 h-4" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="banned" className="flex items-center gap-2 whitespace-nowrap">
                <X className="w-4 h-4" />
                Banned Users
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2 whitespace-nowrap">
                <TrendingUp className="w-4 h-4" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2 whitespace-nowrap">
                <MessageCircle className="w-4 h-4" />
                Contact Submissions
              </TabsTrigger>
              <TabsTrigger value="cod-restrictions" className="flex items-center gap-2 whitespace-nowrap">
                <DollarSign className="w-4 h-4" />
                COD Restrictions
              </TabsTrigger>
              <TabsTrigger value="individual-phone-restrictions" className="flex items-center gap-2 whitespace-nowrap">
                <Phone className="w-4 h-4" />
                Individual Phone Limits
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Products</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchProducts()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog open={productDialogOpen} onOpenChange={(open) => {
                  setProductDialogOpen(open);
                  if (!open) resetProductForm();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="royal">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitProduct} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="Enter product name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Enter product description"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      
                      {/* Detailed Description */}
                      <div>
                        <Label htmlFor="detailed_description">Detailed Description</Label>
                        <Textarea
                          id="detailed_description"
                          value={productForm.detailed_description}
                          onChange={(e) => setProductForm({ ...productForm, detailed_description: e.target.value })}
                          placeholder="Enter detailed product description"
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      
                      {/* Features Section */}
                      <div>
                        <Label>Features</Label>
                        <div className="space-y-2 mt-1">
                          {productForm.features.map((feature, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={feature.feature}
                                onChange={(e) => updateFeature(index, e.target.value)}
                                placeholder="Enter a feature"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeFeature(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={addFeature}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feature
                          </Button>
                        </div>
                      </div>
                      
                      {/* Branding Section */}
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={productForm.brand}
                          onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                          placeholder="e.g., Nike, Apple, Samsung"
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brand_logo">Brand Logo</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => brandLogoInputRef.current?.click()}
                            disabled={uploadingBrandLogo}
                            className="w-full"
                          >
                            {uploadingBrandLogo ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose Brand Logo
                              </>
                            )}
                          </Button>
                          {productForm.brand_logo_url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setProductForm({ ...productForm, brand_logo_url: '' })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {productForm.brand_logo_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={productForm.brand_logo_url}
                              alt="Brand Logo"
                              className="w-12 h-12 rounded-full object-cover border border-border"
                            />
                            <span className="text-xs text-muted-foreground">Logo uploaded</span>
                          </div>
                        )}
                        <input
                          ref={brandLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBrandLogoUpload}
                          className="hidden"
                          id="brand_logo"
                        />
                      </div>

                      {/* Dimensions - Separate Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="height">Height</Label>
                          <Input
                            id="height"
                            value={productForm.height}
                            onChange={(e) => setProductForm({ ...productForm, height: e.target.value })}
                            placeholder="e.g., 10 cm"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="width">Width</Label>
                          <Input
                            id="width"
                            value={productForm.width}
                            onChange={(e) => setProductForm({ ...productForm, width: e.target.value })}
                            placeholder="e.g., 5 cm"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="weight">Weight</Label>
                          <Input
                            id="weight"
                            value={productForm.weight}
                            onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                            placeholder="e.g., 2 kg"
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Seller Section */}
                      <div>
                        <Label htmlFor="seller_name">Seller Name</Label>
                        <Input
                          id="seller_name"
                          value={productForm.seller_name}
                          onChange={(e) => setProductForm({ ...productForm, seller_name: e.target.value })}
                          placeholder="e.g., ABC Electronics, XYZ Store"
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="seller_description">Seller Description</Label>
                        <Textarea
                          id="seller_description"
                          value={productForm.seller_description}
                          onChange={(e) => setProductForm({ ...productForm, seller_description: e.target.value })}
                          placeholder="Tell us about the seller, their reputation, experience, etc."
                          className="mt-1 text-sm min-h-[80px]"
                        />
                      </div>

                      {/* GST Section */}
                      <div>
                        <Label htmlFor="gst_percentage">GST (%) - Leave empty to use category GST</Label>
                        <Input
                          id="gst_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={productForm.gst_percentage}
                          onChange={(e) => setProductForm({ ...productForm, gst_percentage: e.target.value })}
                          placeholder="e.g., 18, 5, 12"
                          className="mt-1 text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          If set, this will override the category GST
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="price">Price (₹) *</Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="0.00"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="discount">Discount (%)</Label>
                          <Input
                            id="discount"
                            type="number"
                            min="0"
                            max="100"
                            value={productForm.discount_percentage}
                            onChange={(e) => setProductForm({ ...productForm, discount_percentage: e.target.value })}
                            placeholder="0"
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="stock_status">Stock Status</Label>
                          <Select
                            value={productForm.stock_status}
                            onValueChange={(value) => setProductForm({ ...productForm, stock_status: value })}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_stock">In Stock</SelectItem>
                              <SelectItem value="low_stock">Low Stock</SelectItem>
                              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="stock_quantity">Stock Quantity</Label>
                          <Input
                            id="stock_quantity"
                            type="number"
                            min="0"
                            value={productForm.stock_quantity}
                            onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                            placeholder="0"
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={productForm.category_id}
                          onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch checked={productForm.cash_on_delivery} onCheckedChange={(checked) => setProductForm({ ...productForm, cash_on_delivery: Boolean(checked) })} />
                        <Label>Enable Cash on Delivery</Label>
                      </div>

                      {/* Product Images Section - Only show if no variant has images */}
                      {!hasVariantImages && (
                        <div>
                          <Label>Product Images (Max 8)</Label>
                          <div className="mt-2 space-y-3">
                            {productImages.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {productImages.map((url, index) => (
                                  <div key={index} className="relative aspect-square">
                                    <img
                                      src={url}
                                      alt={`Product ${index + 1}`}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {productImages.length < MAX_IMAGES && (
                              <div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full text-sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploadingImages}
                                >
                                  {uploadingImages ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Upload Images ({productImages.length}/{MAX_IMAGES})
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Product Variants Editor - Only for existing products */}
                      {editingProduct && (
                        <ProductVariantsEditor 
                          productId={editingProduct.id} 
                          basePrice={parseFloat(productForm.price) || 0} 
                          onVariantImagesStatusChange={setHasVariantImages}
                        />
                      )}

                      <Button
                        type="submit"
                        variant="royal"
                        className="w-full"
                        disabled={productMutation.isPending}
                      >
                        {productMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {productsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.images?.[0] || product.image_url ? (
                        <img
                          src={product.images?.[0] || product.image_url || ''}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate">{product.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="font-medium">₹{Number(product.price).toFixed(2)}</span>
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <span className="text-green-600">-{product.discount_percentage}%</span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          product.stock_status === 'in_stock' && "bg-green-500/10 text-green-600",
                          product.stock_status === 'low_stock' && "bg-yellow-500/10 text-yellow-600",
                          product.stock_status === 'out_of_stock' && "bg-red-500/10 text-red-600"
                        )}>
                          {product.stock_quantity || 0} left
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No products yet. Add your first product!</p>
              </div>
            )}
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="space-y-6">
            <AttributesManager />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">Orders</h2>
              {orders && orders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Select value={orderFilterType} onValueChange={setOrderFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="orderId">Order ID</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Input
                        placeholder="Filter orders..."
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        className="pr-8"
                      />
                      {orderFilter && (
                        <button 
                          onClick={() => setOrderFilter('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => refetchOrders()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-sm">
                <strong>Note:</strong> Both delivered and canceled orders can now be permanently deleted.
              </p>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders
                  .map((order) => {
                  const items = orderItems[order.id] || [];
                  const messages = orderMessages[order.id] || [];
                  
                  return (
                    <div
                      key={order.id}
                      className={cn(
                        "p-6 bg-card rounded-xl border",
                        order.status === 'cancelled' ? "border-destructive/50" : "border-border/50"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="font-display text-xl font-bold text-black">
                            {order.order_id}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              order.payment_method === 'online' 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            )}>
                              {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                            </span>
                            {order.status === 'cancelled' && (
                              <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-display text-lg font-bold">
                            ₹{Number(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items with Product Details */}
                      <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium mb-3">Products Ordered:</p>
                        <div className="space-y-3">
                          {items.map((item) => {
                            const product = getProductById(item.product_id);
                            const imageUrl = product?.images?.[0] || product?.image_url;
                            return (
                              <div key={item.id} className="flex gap-3 items-start">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={item.product_name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-base truncate text-black">{item.product_name}</p>
                                  {item.variant_info && item.variant_info.attribute_name && (
                                    <p className="text-sm text-black font-medium">
                                      {item.variant_info.attribute_name}: {item.variant_info.value_name}
                                    </p>
                                  )}
                                  {product?.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground">
                                    ₹{Number(item.product_price).toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Customer</p>
                          <p className="font-semibold text-base text-black">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-sm text-black">{order.customer_address}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, status: value })}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="packed">Packed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Message Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                                {messages.filter(m => !m.is_admin).length > 0 && (
                                  <span className="ml-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                                    {messages.filter(m => !m.is_admin).length}
                                  </span>
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Messages - {order.order_id}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="h-60 overflow-y-auto space-y-3 bg-muted/30 rounded-lg p-4">
                                  {messages.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">No messages yet</p>
                                  ) : (
                                    messages.map((msg) => (
                                      <div key={msg.id} className={cn(
                                        "flex",
                                        msg.is_admin ? "justify-end" : "justify-start"
                                      )}>
                                        <div className={cn(
                                          "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
                                          msg.is_admin 
                                            ? "bg-primary text-primary-foreground rounded-br-md" 
                                            : "bg-muted rounded-bl-md"
                                        )}>
                                          <p>{msg.message}</p>
                                          <p className="text-xs opacity-70 mt-1">
                                            {new Date(msg.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Textarea
                                    value={newAdminMessage}
                                    onChange={(e) => setNewAdminMessage(e.target.value)}
                                    placeholder="Send update to customer..."
                                    className="min-h-[60px] resize-none"
                                  />
                                  <Button 
                                    variant="royal" 
                                    onClick={sendAdminMessage}
                                    disabled={sendingMessage || !newAdminMessage.trim()}
                                  >
                                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {(order.status === 'delivered' || order.status === 'cancelled') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteOrderMutation.mutate(order.id)}
                              disabled={deleteOrderMutation.isPending}
                              title="Delete order"
                            >
                              {deleteOrderMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {orderFilter ? 'No matching orders found.' : 'No orders yet.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Coupons</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchCoupons()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog open={couponDialogOpen} onOpenChange={(open) => {
                  setCouponDialogOpen(open);
                  if (!open) resetCouponForm();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="royal">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCoupon} className="space-y-4">
                      <div>
                        <Label htmlFor="code">Coupon Code *</Label>
                        <Input
                          id="code"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., SAVE20"
                          className="mt-1 uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="discount_type">Discount Type</Label>
                          <Select
                            value={couponForm.discount_type}
                            onValueChange={(value) => setCouponForm({ ...couponForm, discount_type: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="discount_value">
                            Discount Value *
                          </Label>
                          <Input
                            id="discount_value"
                            type="number"
                            min="0"
                            step={couponForm.discount_type === 'percentage' ? '1' : '0.01'}
                            max={couponForm.discount_type === 'percentage' ? '100' : undefined}
                            value={couponForm.discount_value}
                            onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="min_order">Min Order (₹)</Label>
                          <Input
                            id="min_order"
                            type="number"
                            min="0"
                            step="0.01"
                            value={couponForm.min_order_amount}
                            onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_uses">Max Uses (Optional)</Label>
                          <Input
                            id="max_uses"
                            type="number"
                            min="1"
                            value={couponForm.max_uses}
                            onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                            placeholder="Unlimited"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
                        <Input
                          id="expires_at"
                          type="date"
                          value={couponForm.expires_at}
                          onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="is_active"
                          checked={couponForm.is_active}
                          onCheckedChange={(checked) => setCouponForm({ ...couponForm, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Coupon is active</Label>
                      </div>
                      <Button
                        type="submit"
                        variant="royal"
                        className="w-full"
                        disabled={couponMutation.isPending}
                      >
                        {couponMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {couponsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : coupons && coupons.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50"
                  >
                    <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg">{coupon.code}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          coupon.is_active
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}% off` 
                            : `₹${coupon.discount_value} off`}
                        </span>
                        {(coupon.min_order_amount || 0) > 0 && (
                          <span>• Min: ₹{coupon.min_order_amount}</span>
                        )}
                        <span>• Used: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                        {coupon.expires_at && (
                          <span>• Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCoupon(coupon)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteCouponMutation.mutate(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No coupons yet. Create your first coupon!</p>
              </div>
            )}
          </TabsContent>

          {/* Banned Users Tab */}
          <TabsContent value="banned" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Banned Users</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchBannedUsers()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog open={bannedUserDialogOpen} onOpenChange={(open) => {
                  setBannedUserDialogOpen(open);
                  if (!open) resetBannedUserForm();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="royal">
                      <Plus className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        {editingBannedUser ? 'Edit Banned User' : 'Ban User'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitBannedUser} className="space-y-4">
                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          value={bannedUserForm.phone}
                          onChange={(e) => setBannedUserForm({ ...bannedUserForm, phone: e.target.value })}
                          placeholder="e.g., +91XXXXXXXXXX"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bannedUserForm.email}
                          onChange={(e) => setBannedUserForm({ ...bannedUserForm, email: e.target.value })}
                          placeholder="e.g., user@example.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                          id="reason"
                          value={bannedUserForm.reason}
                          onChange={(e) => setBannedUserForm({ ...bannedUserForm, reason: e.target.value })}
                          placeholder="Reason for banning this user"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="is_active"
                          checked={bannedUserForm.is_active}
                          onCheckedChange={(checked) => setBannedUserForm({ ...bannedUserForm, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Ban is active</Label>
                      </div>
                      <Button
                        type="submit"
                        variant="royal"
                        className="w-full"
                        disabled={bannedUserMutation.isPending}
                      >
                        {bannedUserMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingBannedUser ? 'Update Ban' : 'Ban User'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {bannedUsersLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : bannedUsers && bannedUsers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bannedUsers.map((bannedUser) => (
                  <div
                    key={bannedUser.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50"
                  >
                    <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                      <X className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg">
                          {bannedUser.phone || bannedUser.email || 'Unknown User'}
                        </h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          bannedUser.is_active
                            ? "bg-red-500/10 text-red-600"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {bannedUser.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {bannedUser.phone && (
                          <span>• Phone: {bannedUser.phone}</span>
                        )}
                        {bannedUser.email && (
                          <span>• Email: {bannedUser.email}</span>
                        )}
                        {bannedUser.reason && (
                          <span>• Reason: {bannedUser.reason}</span>
                        )}
                        <span>• Banned: {new Date(bannedUser.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBannedUser(bannedUser)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteBannedUserMutation.mutate(bannedUser.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <X className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No banned users yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Contact Submissions Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">Contact Submissions</h2>
              {contactSubmissions && contactSubmissions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Select value={contactFilterType} onValueChange={setContactFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="subject">Subject</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Input
                        placeholder="Filter submissions..."
                        value={contactFilter}
                        onChange={(e) => setContactFilter(e.target.value)}
                        className="pr-8"
                      />
                      {contactFilter && (
                        <button 
                          onClick={() => setContactFilter('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAllContactSubmissions}
                      disabled={!contactSubmissions || contactSubmissions.length === 0}
                    >
                      Delete All
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => refetchContactSubmissions()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {contactSubmissionsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredContactSubmissions && filteredContactSubmissions.length > 0 ? (
              <div className="grid gap-3">
                {filteredContactSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-col p-3 bg-card rounded-lg border border-border/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-bold text-base truncate">{submission.subject}</h3>
                          {submission.is_banned && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600">
                              Banned
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{submission.description}</p>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <div className="flex flex-wrap gap-2">
                            <span><span className="font-medium">Name:</span> {submission.name}</span>
                            {submission.email && <span><span className="font-medium">Email:</span> {submission.email}</span>}
                            <span><span className="font-medium">Phone:</span> {submission.phone}</span>
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {submission.photos && submission.photos.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium text-xs block mb-1">Photos ({submission.photos.length}):</span>
                            <div className="flex gap-1">
                              {submission.photos.slice(0, 3).map((photoUrl, index) => (
                                <div 
                                  key={index} 
                                  className="relative group cursor-pointer w-12 h-12"
                                  onClick={() => {
                                    setCurrentPhotoUrls(submission.photos || []);
                                    setCurrentPhotoIndex(index);
                                    setPhotoViewerOpen(true);
                                  }}
                                >
                                  <img 
                                    src={photoUrl} 
                                    alt={`Photo ${index + 1}`} 
                                    className="w-full h-full object-cover rounded border border-border hover:opacity-80 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                              ))}
                              {submission.photos.length > 3 && (
                                <div className="w-12 h-12 rounded border border-border flex items-center justify-center bg-muted">
                                  <span className="text-xs font-medium">+{submission.photos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8 ml-2 flex-shrink-0"
                        onClick={() => handleDeleteContactSubmission(submission.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {contactFilter ? 'No matching submissions found.' : 'No contact submissions yet.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <h2 className="font-display text-2xl font-bold">Sales Analytics</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* This Month Sales */}
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">This Month</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === now.getFullYear() &&
                           o.status !== 'cancelled';
                  }).reduce((sum, o) => sum + Number(o.total), 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === now.getFullYear() &&
                           o.status !== 'cancelled';
                  }).length || 0} orders
                </p>
              </div>

              {/* This Year Sales */}
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">This Year</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const now = new Date();
                    return orderDate.getFullYear() === now.getFullYear() &&
                           o.status !== 'cancelled';
                  }).reduce((sum, o) => sum + Number(o.total), 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const now = new Date();
                    return orderDate.getFullYear() === now.getFullYear() &&
                           o.status !== 'cancelled';
                  }).length || 0} orders
                </p>
              </div>

              {/* Total Sales */}
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">All Time</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders?.filter(o => o.status !== 'cancelled')
                    .reduce((sum, o) => sum + Number(o.total), 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {orders?.filter(o => o.status !== 'cancelled').length || 0} total orders
                </p>
              </div>

              {/* Avg Order Value */}
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Avg Order</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders && orders.filter(o => o.status !== 'cancelled').length > 0
                    ? Math.round(orders.filter(o => o.status !== 'cancelled')
                        .reduce((sum, o) => sum + Number(o.total), 0) / 
                        orders.filter(o => o.status !== 'cancelled').length).toLocaleString()
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">per order</p>
              </div>
            </div>

            {/* Monthly Sales Breakdown */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-display text-lg font-bold mb-4">Monthly Sales ({new Date().getFullYear()})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthName = new Date(2024, i).toLocaleString('default', { month: 'short' });
                  const monthSales = orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.getMonth() === i && 
                           orderDate.getFullYear() === new Date().getFullYear() &&
                           o.status !== 'cancelled';
                  }).reduce((sum, o) => sum + Number(o.total), 0) || 0;
                  const monthOrders = orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.getMonth() === i && 
                           orderDate.getFullYear() === new Date().getFullYear() &&
                           o.status !== 'cancelled';
                  }).length || 0;
                  const isCurrentMonth = i === new Date().getMonth();
                  
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-4 rounded-lg border",
                        isCurrentMonth ? "border-primary bg-primary/5" : "border-border/50"
                      )}
                    >
                      <p className={cn(
                        "text-sm font-medium mb-1",
                        isCurrentMonth ? "text-primary" : "text-muted-foreground"
                      )}>
                        {monthName}
                      </p>
                      <p className="text-xl font-bold">₹{monthSales.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{monthOrders} orders</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Yearly Sales Comparison */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-display text-lg font-bold mb-4">Yearly Sales Comparison</h3>
              <div className="space-y-4">
                {(() => {
                  const yearlyData = orders?.reduce((acc, order) => {
                    if (order.status === 'cancelled') return acc;
                    const year = new Date(order.created_at).getFullYear();
                    if (!acc[year]) {
                      acc[year] = { total: 0, count: 0 };
                    }
                    acc[year].total += Number(order.total);
                    acc[year].count += 1;
                    return acc;
                  }, {} as Record<number, { total: number; count: number }>) || {};
                  
                  const years = Object.keys(yearlyData).sort((a, b) => Number(b) - Number(a));
                  const maxTotal = Math.max(...Object.values(yearlyData).map(y => y.total), 1);
                  
                  if (years.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No sales data available yet
                      </div>
                    );
                  }
                  
                  return years.map(year => {
                    const data = yearlyData[Number(year)];
                    const percentage = (data.total / maxTotal) * 100;
                    const isBestYear = data.total === maxTotal && years.length > 1;
                    
                    return (
                      <div key={year} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{year}</span>
                            {isBestYear && (
                              <span className="px-2 py-0.5 text-xs rounded-full gradient-gold text-primary-foreground">
                                Best Year
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold">₹{data.total.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground ml-2">({data.count} orders)</span>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isBestYear ? "gradient-gold" : "bg-primary/60"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Categories</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchCategories()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
                  setCategoryDialogOpen(open);
                  if (!open) resetCategoryForm();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="royal">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCategory} className="space-y-4">
                      <div>
                        <Label htmlFor="cat_name">Category Name *</Label>
                        <Input
                          id="cat_name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="e.g., Electronics, Home, Fashion"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cat_description">Description</Label>
                        <Textarea
                          id="cat_description"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          placeholder="Category description"
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cat_sort">Sort Order</Label>
                          <Input
                            id="cat_sort"
                            type="number"
                            min="0"
                            value={categoryForm.sort_order}
                            onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cat_gst">Category GST (%)</Label>
                          <Input
                            id="cat_gst"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={categoryForm.gst_percentage}
                            onChange={(e) => setCategoryForm({ ...categoryForm, gst_percentage: e.target.value })}
                            placeholder="e.g., 18"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          id="cat_active"
                          checked={categoryForm.is_active}
                          onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                        />
                        <Label htmlFor="cat_active">Active</Label>
                      </div>
                      <Button
                        type="submit"
                        variant="royal"
                        className="w-full"
                        disabled={categoryMutation.isPending}
                      >
                        {categoryMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingCategory ? 'Update Category' : 'Add Category'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="grid gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{category.name}</h3>
                          {!category.is_active && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {products?.filter(p => p.category_id === category.id).length || 0} products
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No categories yet. Create your first category!</p>
              </div>
            )}
          </TabsContent>

          {/* COD Restrictions Tab */}
          <TabsContent value="cod-restrictions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">COD Restrictions</h2>
              <Button variant="ghost" size="icon" onClick={() => refetchCodRestrictions()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {codRestrictionsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border/50 p-6 max-w-2xl">
                <form onSubmit={handleSubmitCodRestriction} className="space-y-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-4">COD Order Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone_order_limit">Max COD Orders Per Phone Number</Label>
                        <Input
                          id="phone_order_limit"
                          type="number"
                          min="1"
                          value={codRestrictionForm.phone_order_limit}
                          onChange={(e) => setCodRestrictionForm({ ...codRestrictionForm, phone_order_limit: e.target.value })}
                          className="mt-1"
                          placeholder="10"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Maximum number of COD orders allowed per phone number</p>
                      </div>
                      <div>
                        <Label htmlFor="ip_daily_order_limit">Max Daily COD Orders Per IP</Label>
                        <Input
                          id="ip_daily_order_limit"
                          type="number"
                          min="1"
                          value={codRestrictionForm.ip_daily_order_limit}
                          onChange={(e) => setCodRestrictionForm({ ...codRestrictionForm, ip_daily_order_limit: e.target.value })}
                          className="mt-1"
                          placeholder="5"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Maximum number of COD orders allowed per IP address per day</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-4">Online Payment Order Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="online_phone_order_limit">Max Online Orders Per Phone Number</Label>
                        <Input
                          id="online_phone_order_limit"
                          type="number"
                          min="1"
                          value={codRestrictionForm.online_phone_order_limit}
                          onChange={(e) => setCodRestrictionForm({ ...codRestrictionForm, online_phone_order_limit: e.target.value })}
                          className="mt-1"
                          placeholder="10"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Maximum number of online payment orders allowed per phone number</p>
                      </div>
                      <div>
                        <Label htmlFor="online_ip_daily_order_limit">Max Daily Online Orders Per IP</Label>
                        <Input
                          id="online_ip_daily_order_limit"
                          type="number"
                          min="1"
                          value={codRestrictionForm.online_ip_daily_order_limit}
                          onChange={(e) => setCodRestrictionForm({ ...codRestrictionForm, online_ip_daily_order_limit: e.target.value })}
                          className="mt-1"
                          placeholder="5"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Maximum number of online payment orders allowed per IP address per day</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-3">
                      <Switch 
                        id="cod_restrictions_enabled"
                        checked={codRestrictionForm.cod_restrictions_enabled} 
                        onCheckedChange={(checked) => setCodRestrictionForm({ ...codRestrictionForm, cod_restrictions_enabled: checked })} 
                      />
                      <Label htmlFor="cod_restrictions_enabled">Enable COD Restrictions</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch 
                        id="online_restrictions_enabled"
                        checked={codRestrictionForm.online_restrictions_enabled} 
                        onCheckedChange={(checked) => setCodRestrictionForm({ ...codRestrictionForm, online_restrictions_enabled: checked })} 
                      />
                      <Label htmlFor="online_restrictions_enabled">Enable Online Payment Restrictions</Label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="royal"
                      className="w-full sm:w-auto"
                      disabled={codRestrictionMutation.isPending}
                    >
                      {codRestrictionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Restrictions
                    </Button>
                  </div>

                  <div className="pt-4 text-sm text-muted-foreground border-t border-border/50">
                    <p><strong>Note:</strong> These restrictions can be enabled/disabled separately for Cash on Delivery (COD) and Online Payment orders.</p>
                    <p className="mt-1">Current COD settings: {codRestrictions && codRestrictions.length > 0 ? 
                      `${codRestrictions[0].phone_order_limit} orders per phone, ${codRestrictions[0].ip_daily_order_limit} orders per IP daily` : 
                      'Loading...'
                    }</p>
                    <p className="mt-1">Current Online Payment settings: {codRestrictions && codRestrictions.length > 0 ? 
                      `${codRestrictions[0].online_phone_order_limit} orders per phone, ${codRestrictions[0].online_ip_daily_order_limit} orders per IP daily` : 
                      'Loading...'
                    }</p>
                    <p className="mt-1">
                      COD Restrictions: <span className={codRestrictions && codRestrictions.length > 0 && codRestrictions[0].cod_restrictions_enabled ? 'text-green-600' : 'text-red-600'}>
                        {codRestrictions && codRestrictions.length > 0 && codRestrictions[0].cod_restrictions_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {' | '}
                      Online Payment Restrictions: <span className={codRestrictions && codRestrictions.length > 0 && codRestrictions[0].online_restrictions_enabled ? 'text-green-600' : 'text-red-600'}>
                        {codRestrictions && codRestrictions.length > 0 && codRestrictions[0].online_restrictions_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>

          {/* Individual Phone Restrictions Tab */}
          <TabsContent value="individual-phone-restrictions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Individual Phone Limits</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchIndividualPhoneRestrictions()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border border-border/50 p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">
                    {editingIndividualPhoneRestriction ? 'Edit Phone Limit' : 'Add Phone Limit'}
                  </h3>
                  <form onSubmit={handleSubmitIndividualPhoneRestriction} className="space-y-4">
                    <div>
                      <Label htmlFor="individual_phone">Phone Number *</Label>
                      <Input
                        id="individual_phone"
                        value={individualPhoneRestrictionForm.phone}
                        onChange={(e) => setIndividualPhoneRestrictionForm({ ...individualPhoneRestrictionForm, phone: e.target.value })}
                        className="mt-1"
                        placeholder="e.g., 8757226562"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Enter a 10-digit Indian mobile number</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="cod_daily_limit">Daily COD Limit *</Label>
                      <Input
                        id="cod_daily_limit"
                        type="number"
                        min="0"
                        value={individualPhoneRestrictionForm.cod_daily_limit}
                        onChange={(e) => setIndividualPhoneRestrictionForm({ ...individualPhoneRestrictionForm, cod_daily_limit: e.target.value })}
                        className="mt-1"
                        placeholder="2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="online_daily_limit">Daily Online Payment Limit *</Label>
                      <Input
                        id="online_daily_limit"
                        type="number"
                        min="0"
                        value={individualPhoneRestrictionForm.online_daily_limit}
                        onChange={(e) => setIndividualPhoneRestrictionForm({ ...individualPhoneRestrictionForm, online_daily_limit: e.target.value })}
                        className="mt-1"
                        placeholder="10"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                      <Switch 
                        id="individual_phone_active"
                        checked={individualPhoneRestrictionForm.is_active} 
                        onCheckedChange={(checked) => setIndividualPhoneRestrictionForm({ ...individualPhoneRestrictionForm, is_active: checked })} 
                      />
                      <Label htmlFor="individual_phone_active">Active</Label>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        variant="royal"
                        className="flex-1"
                        disabled={individualPhoneRestrictionMutation.isPending}
                      >
                        {individualPhoneRestrictionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingIndividualPhoneRestriction ? 'Update' : 'Add'}
                      </Button>
                      {editingIndividualPhoneRestriction && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetIndividualPhoneRestrictionForm}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
              
              {/* List Section */}
              <div className="lg:col-span-2">
                {individualPhoneRestrictionsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : individualPhoneRestrictions && individualPhoneRestrictions.length > 0 ? (
                  <div className="space-y-3">
                    {individualPhoneRestrictions.map((restriction) => (
                      <div
                        key={restriction.id}
                        className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-medium">{restriction.phone}</h3>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              restriction.is_active
                                ? "bg-green-500/10 text-green-600"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {restriction.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span>COD: {restriction.cod_daily_limit}/day</span>
                            <span>Online: {restriction.online_daily_limit}/day</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditIndividualPhoneRestriction(restriction)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteIndividualPhoneRestrictionMutation.mutate(restriction.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                    <Phone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No individual phone restrictions yet.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      {photoViewerOpen && (
        <PhotoViewerModal 
          photoUrls={currentPhotoUrls} 
          initialIndex={currentPhotoIndex} 
          onClose={() => setPhotoViewerOpen(false)} 
        />
      )}
      
      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all contact submissions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAllContactSubmissions}>
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
