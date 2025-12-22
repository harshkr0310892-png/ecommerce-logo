import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/store/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Loader2, CheckCircle, Copy, Ticket, X } from "lucide-react";
import { cn, normalizeIndianMobile } from "@/lib/utils";
import { FAQSection } from "@/components/checkout/FAQSection";

function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'RYL-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getClientIP(): Promise<string> {
  try {
    // Try multiple services to get IP address
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '';
  } catch (error) {
    console.error('Error getting client IP:', error);
    return '';
  }
}

interface AppliedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  id: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getDiscountedTotal, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [agreePolicies, setAgreePolicies] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
    const [clientIP, setClientIP] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const subtotal = getDiscountedTotal();
  
  // Calculate GST
  const [gstAmount, setGstAmount] = React.useState(0);
  
  React.useEffect(() => {
    const calculateGST = async () => {
      let totalGST = 0;
      
      for (const item of items) {
        try {
          const productId = item.product_id || item.id;
          
          // Fetch product with GST info - GST applies to all variants of this product
          const { data: product, error } = await supabase
            .from('products')
            .select('gst_percentage, category_id')
            .eq('id', productId)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching product for GST:', error);
            continue;
          }
          
          if (!product) {
            console.warn('Product not found for GST calculation:', productId);
            continue;
          }
          
          let gstPercent = 0;
          
          // Product GST takes priority
          if (product.gst_percentage !== null && product.gst_percentage !== undefined && product.gst_percentage > 0) {
            gstPercent = product.gst_percentage;
            console.log(`Product ${productId} GST: ${gstPercent}%`);
          }
          // Fall back to category GST
          else if (product.category_id) {
            const { data: category, error: catError } = await supabase
              .from('categories')
              .select('gst_percentage')
              .eq('id', product.category_id)
              .maybeSingle();
            
            if (!catError && category && category.gst_percentage && category.gst_percentage > 0) {
              gstPercent = category.gst_percentage;
              console.log(`Category GST for ${productId}: ${gstPercent}%`);
            }
          }
          
          // Calculate price with discount
          const discountedPrice = item.price * (1 - item.discount_percentage / 100);
          const itemTotal = discountedPrice * item.quantity;
          
          // Calculate GST on discounted price
          const itemGST = itemTotal * (gstPercent / 100);
          totalGST += itemGST;
          console.log(`Item ${item.name}: Price=${item.price}, Discount=${item.discount_percentage}%, Discounted=${discountedPrice}, Qty=${item.quantity}, GST%=${gstPercent}, ItemGST=${itemGST}`);
        } catch (error) {
          console.error('Error calculating GST for item:', item.id, error);
        }
      }
      
      console.log('Total GST Amount:', totalGST);
      setGstAmount(totalGST);
    };
    
    if (items.length > 0) {
      calculateGST();
    } else {
      setGstAmount(0);
    }
  }, [items]);
    
    // Get client IP on component mount
    React.useEffect(() => {
      const fetchIP = async () => {
        const ip = await getClientIP();
        setClientIP(ip);
      };
      fetchIP();
    }, []);
  
  // Calculate coupon discount
  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return subtotal * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, subtotal);
  };

  const couponDiscount = calculateCouponDiscount();
  const subtotalAfterCoupon = subtotal - couponDiscount;
  
  // Calculate shipping charge based on order subtotal
  const shippingCharge = subtotal < 300 ? 40 : 0;
  
  const total = subtotalAfterCoupon + gstAmount + shippingCharge;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast.error('Invalid coupon code');
        return;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error('This coupon has expired');
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error('This coupon has reached its usage limit');
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
        toast.error(`Minimum order amount is ₹${coupon.min_order_amount}`);
        return;
      }

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
      });
      toast.success('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    const normalizedPhone = normalizeIndianMobile(formData.phone);
    if (!normalizedPhone) {
      toast.error('Please enter a valid Indian mobile number');
      return;
    }

    // Check if user is banned
    try {
      // Normalize phone number for comparison
      const formattedPhone = `+91${normalizedPhone}`;
      
      console.log('Checking ban status for:', { 
        phone: formData.phone, 
        normalizedPhone, 
        formattedPhone,
        email: formData.email 
      });
      
      // Check if phone number is banned (try multiple formats)
      const { data: bannedByPhone, error: phoneError } = await supabase
        .from('banned_users')
        .select('*')
        .or(`phone.eq.${formattedPhone},phone.eq.${normalizedPhone}`)
        .eq('is_active', true)
        .maybeSingle();

      if (phoneError) {
        console.error('Error checking banned phone:', phoneError);
      } else {
        console.log('Phone ban check result:', bannedByPhone);
      }

      // Check if email is banned (if provided)
      let bannedByEmail = null;
      if (formData.email) {
        const { data, error: emailError } = await supabase
          .from('banned_users')
          .select('*')
          .eq('email', formData.email.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (emailError) {
          console.error('Error checking banned email:', emailError);
        } else {
          bannedByEmail = data;
          console.log('Email ban check result:', bannedByEmail);
        }
      }

      // If user is banned, show error and prevent order
      if (bannedByPhone || bannedByEmail) {
        console.log('User is banned, preventing order');
        toast.error('Unable to place order. Please contact support for assistance.');
        return;
      }
      
      console.log('User is not banned, proceeding with order');
    } catch (error) {
      console.error('Error checking banned users:', error);
      toast.error('An error occurred while processing your order. Please try again.');
      return;
    }

    if (!agreePolicies) {
      toast.error('Please agree to the FAQs and Privacy Policy before placing your order.');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Ensure COD is eligible for all items when selected
    const codEligible = items.every((it) => it.cash_on_delivery === true);
    if (paymentMethod === 'cod' && !codEligible) {
      toast.error('Cash on Delivery is not available for some items in your cart.');
      return;
    }

    // Check individual phone restrictions first
    try {
      const formattedPhone = `+91${normalizedPhone}`;
      
      // Check for individual phone restrictions
      const { data: individualRestrictions, error: individualError } = await supabase
        .from('individual_phone_restrictions')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('is_active', true)
        .maybeSingle();
      
      if (individualError) throw individualError;
      
      // If individual restrictions exist, check them
      if (individualRestrictions) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check payment method specific limits
        if (paymentMethod === 'cod') {
          // Check individual COD limit
          const { data: codOrderCounts, error: codCountError } = await supabase
            .from('individual_phone_order_counts')
            .select('order_count')
            .eq('phone', formattedPhone)
            .eq('payment_method', 'cod')
            .eq('last_order_date', today)
            .maybeSingle();
          
          if (codCountError) throw codCountError;
          
          const currentCount = codOrderCounts?.order_count || 0;
          if (currentCount >= individualRestrictions.cod_daily_limit) {
            toast.error(`You have reached your daily limit of ${individualRestrictions.cod_daily_limit} COD orders.`);
            return;
          }
        } else if (paymentMethod === 'online') {
          // Check individual online payment limit
          const { data: onlineOrderCounts, error: onlineCountError } = await supabase
            .from('individual_phone_order_counts')
            .select('order_count')
            .eq('phone', formattedPhone)
            .eq('payment_method', 'online')
            .eq('last_order_date', today)
            .maybeSingle();
          
          if (onlineCountError) throw onlineCountError;
          
          const currentCount = onlineOrderCounts?.order_count || 0;
          if (currentCount >= individualRestrictions.online_daily_limit) {
            toast.error(`You have reached your daily limit of ${individualRestrictions.online_daily_limit} online payment orders.`);
            return;
          }
        }
      } else {
        // Check global restrictions if no individual restrictions exist
        const { data: codRestrictions, error: restrictionsError } = await supabase
          .from('cod_restrictions')
          .select('*')
          .limit(1);

        if (restrictionsError) throw restrictionsError;

        // If restrictions are enabled, check limits
        if (codRestrictions && codRestrictions.length > 0) {
          const restriction = codRestrictions[0];
          
          if (paymentMethod === 'cod' && restriction.cod_restrictions_enabled) {
            // Check phone number order limit for COD
            const { data: phoneOrderCounts, error: phoneCountError } = await supabase
              .from('phone_order_counts')
              .select('order_count')
              .eq('phone', formattedPhone);
            
            if (phoneCountError) throw phoneCountError;
            
            if (phoneOrderCounts && phoneOrderCounts.length > 0 && 
                phoneOrderCounts[0].order_count >= restriction.phone_order_limit) {
              toast.error(`You have reached the maximum limit of ${restriction.phone_order_limit} COD orders with this phone number.`);
              return;
            }
            
            // Check IP address daily order limit for COD
            if (clientIP) {
              const today = new Date().toISOString().split('T')[0];
              const { data: ipOrderCounts, error: ipCountError } = await supabase
                .from('ip_order_counts')
                .select('order_count')
                .eq('ip_address', clientIP)
                .eq('last_order_date', today);
              
              if (ipCountError) throw ipCountError;
              
              if (ipOrderCounts && ipOrderCounts.length > 0 && 
                  ipOrderCounts[0].order_count >= restriction.ip_daily_order_limit) {
                toast.error(`You have reached the maximum limit of ${restriction.ip_daily_order_limit} COD orders from this IP address today.`);
                return;
              }
            }
          } else if (paymentMethod === 'online' && restriction.online_restrictions_enabled) {
            // Check phone number order limit for online payment
            const { data: onlinePhoneOrderCounts, error: onlinePhoneCountError } = await supabase
              .from('online_phone_order_counts')
              .select('order_count')
              .eq('phone', formattedPhone);
            
            if (onlinePhoneCountError) throw onlinePhoneCountError;
            
            if (onlinePhoneOrderCounts && onlinePhoneOrderCounts.length > 0 && 
                onlinePhoneOrderCounts[0].order_count >= restriction.online_phone_order_limit) {
              toast.error(`You have reached the maximum limit of ${restriction.online_phone_order_limit} online payment orders with this phone number.`);
              return;
            }
            
            // Check IP address daily order limit for online payment
            if (clientIP) {
              const today = new Date().toISOString().split('T')[0];
              const { data: onlineIpOrderCounts, error: onlineIpCountError } = await supabase
                .from('online_ip_order_counts')
                .select('order_count')
                .eq('ip_address', clientIP)
                .eq('last_order_date', today);
              
              if (onlineIpCountError) throw onlineIpCountError;
              
              if (onlineIpOrderCounts && onlineIpOrderCounts.length > 0 && 
                  onlineIpOrderCounts[0].order_count >= restriction.online_ip_daily_order_limit) {
                toast.error(`You have reached the maximum limit of ${restriction.online_ip_daily_order_limit} online payment orders from this IP address today.`);
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking individual phone restrictions:', error);
      // Don't block the order if there's an error checking restrictions
      // This ensures customers can still place orders even if our restriction system has issues
    }

    setIsLoading(true);

    try {
      const newOrderId = generateOrderId();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: newOrderId,
          customer_name: formData.name,
          customer_phone: `+91${normalizedPhone}`,
          customer_email: formData.email || null,
          customer_address: formData.address,
          total: total,
          status: 'pending',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update order counts based on individual or global restrictions
      try {
        const formattedPhone = `+91${normalizedPhone}`;
        const today = new Date().toISOString().split('T')[0];
        
        // Check for individual phone restrictions
        const { data: individualRestrictions, error: individualError } = await supabase
          .from('individual_phone_restrictions')
          .select('*')
          .eq('phone', formattedPhone)
          .eq('is_active', true)
          .maybeSingle();
        
        if (individualError) {
          console.error('Error checking individual phone restrictions:', individualError);
        }
        
        if (individualRestrictions) {
          // Update individual phone order count
          const { data: individualCountData, error: individualCountError } = await supabase
            .from('individual_phone_order_counts')
            .select('*')
            .eq('phone', formattedPhone)
            .eq('payment_method', paymentMethod)
            .eq('last_order_date', today)
            .maybeSingle();
          
          if (individualCountError) {
            console.error('Error checking individual phone order count:', individualCountError);
          } else if (individualCountData) {
            // Update existing record
            await supabase
              .from('individual_phone_order_counts')
              .update({ 
                order_count: individualCountData.order_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', individualCountData.id);
          } else {
            // Insert new record
            await supabase
              .from('individual_phone_order_counts')
              .insert({
                phone: formattedPhone,
                payment_method: paymentMethod,
                order_count: 1,
                last_order_date: today
              });
          }
        } else {
          // Update global order counts based on payment method
          if (paymentMethod === 'cod') {
            // Update global phone order count for COD orders
            const { data: phoneCountData, error: phoneCountError } = await supabase
              .from('phone_order_counts')
              .select('*')
              .eq('phone', formattedPhone)
              .maybeSingle();
            
            if (phoneCountError) {
              console.error('Error checking phone order count:', phoneCountError);
            } else if (phoneCountData) {
              // Update existing record
              await supabase
                .from('phone_order_counts')
                .update({ 
                  order_count: phoneCountData.order_count + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', phoneCountData.id);
            } else {
              // Insert new record
              await supabase
                .from('phone_order_counts')
                .insert({
                  phone: formattedPhone,
                  order_count: 1,
                  last_order_date: today
                });
            }
            
            // Update IP order count for COD orders
            if (clientIP) {
              const { data: ipCountData, error: ipCountError } = await supabase
                .from('ip_order_counts')
                .select('*')
                .eq('ip_address', clientIP)
                .eq('last_order_date', today)
                .maybeSingle();
              
              if (ipCountError) {
                console.error('Error checking IP order count:', ipCountError);
              } else if (ipCountData) {
                // Update existing record
                await supabase
                  .from('ip_order_counts')
                  .update({ 
                    order_count: ipCountData.order_count + 1,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', ipCountData.id);
              } else {
                // Insert new record
                await supabase
                  .from('ip_order_counts')
                  .insert({
                    ip_address: clientIP,
                    order_count: 1,
                    last_order_date: today
                  });
              }
            }
          } else if (paymentMethod === 'online') {
            // Update global phone order count for online payment orders
            const { data: onlinePhoneCountData, error: onlinePhoneCountError } = await supabase
              .from('online_phone_order_counts')
              .select('*')
              .eq('phone', formattedPhone)
              .maybeSingle();
            
            if (onlinePhoneCountError) {
              console.error('Error checking online phone order count:', onlinePhoneCountError);
            } else if (onlinePhoneCountData) {
              // Update existing record
              await supabase
                .from('online_phone_order_counts')
                .update({ 
                  order_count: onlinePhoneCountData.order_count + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', onlinePhoneCountData.id);
            } else {
              // Insert new record
              await supabase
                .from('online_phone_order_counts')
                .insert({
                  phone: formattedPhone,
                  order_count: 1,
                  last_order_date: today
                });
            }
            
            // Update IP order count for online payment orders
            if (clientIP) {
              const { data: onlineIpCountData, error: onlineIpCountError } = await supabase
                .from('online_ip_order_counts')
                .select('*')
                .eq('ip_address', clientIP)
                .eq('last_order_date', today)
                .maybeSingle();
              
              if (onlineIpCountError) {
                console.error('Error checking online IP order count:', onlineIpCountError);
              } else if (onlineIpCountData) {
                // Update existing record
                await supabase
                  .from('online_ip_order_counts')
                  .update({ 
                    order_count: onlineIpCountData.order_count + 1,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', onlineIpCountData.id);
              } else {
                // Insert new record
                await supabase
                  .from('online_ip_order_counts')
                  .insert({
                    ip_address: clientIP,
                    order_count: 1,
                    last_order_date: today
                  });
              }
            }
          }
        }
      } catch (countError) {
        console.error('Error updating order counts:', countError);
        // Don't block the order if there's an error updating counts
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: (item as any).product_id || item.id,
        product_name: item.name,
        product_price: item.price * (1 - item.discount_percentage / 100),
        quantity: item.quantity,
        variant_info: item.variant_info
          ? {
              variant_id: (item.variant_info as any).variant_id || null,
              attribute_name: (item.variant_info as any).attribute_name || (item.variant_info as any).attribute || null,
              value_name: (item.variant_info as any).value_name || (item.variant_info as any).attribute_value || null,
            }
          : null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update coupon used_count if coupon was applied
      if (appliedCoupon) {
        const { data: couponData } = await supabase
          .from('coupons')
          .select('used_count')
          .eq('id', appliedCoupon.id)
          .single();
        
        if (couponData) {
          await supabase
            .from('coupons')
            .update({ used_count: (couponData.used_count || 0) + 1 })
            .eq('id', appliedCoupon.id);
        }
      }

      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied to clipboard!');
  };

  if (orderComplete) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. Your order has been placed successfully.
            </p>

            <div className="bg-card rounded-xl border border-border/50 p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Your Order ID</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display text-2xl font-bold text-primary">
                  {orderId}
                </span>
                <button
                  onClick={copyOrderId}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Save this ID to track your order status.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="royal"
                size="lg"
                onClick={() => navigate('/track-order')}
              >
                Track Your Order
              </Button>
              <Button
                variant="royalOutline"
                size="lg"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Crown className="w-20 h-20 text-primary/30 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some products to your cart before checkout.
          </p>
          <Button variant="royal" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
          <span className="gradient-gold-text">Checkout</span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="font-display text-xl font-semibold mb-6">
                Delivery Information
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., 9876543210 (10 digits, starting with 6-9)"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your complete delivery address"
                    required
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t border-border mt-6 pt-6">
                <h3 className="font-medium mb-3">Payment Method</h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="accent-primary"
                    />
                    <span>Online Payment (Available for all products)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      disabled={!items.every((it) => it.cash_on_delivery === true)}
                      className="accent-primary"
                    />
                    <span>Cash on Delivery (Only for eligible products)</span>
                  </label>
                  {!items.every((it) => it.cash_on_delivery === true) && (
                    <p className="text-sm text-muted-foreground">Cash on Delivery is not available for some items in your cart.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-muted/30 border border-border/50 rounded-xl p-4">
              <Checkbox
                id="agree"
                checked={agreePolicies}
                onCheckedChange={(checked) => setAgreePolicies(Boolean(checked))}
                className="mt-1"
              />
              <Label htmlFor="agree" className="text-sm leading-6 cursor-pointer">
                I agree to the{' '}
                <Link to="/faq" className="text-primary underline">
                  FAQs
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>

            <Button
              type="submit"
              variant="royal"
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Place Order - ₹{total.toFixed(2)}
                </>
              )}
            </Button>

            {/* FAQ Section */}
            <FAQSection />
          </form>
          {/* Order Summary */}
          <div className="animate-fade-in stagger-2">
            <div className="bg-card rounded-xl border border-border/50 p-6 sticky top-24">
              <h2 className="font-display text-xl font-semibold mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const discountedPrice = item.price * (1 - item.discount_percentage / 100);
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Crown className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ₹{discountedPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ₹{(discountedPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Section */}
              <div className="border-t border-border mt-6 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Have a coupon?</span>
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}% off` 
                          : `₹${appliedCoupon.discount_value} off`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 uppercase"
                    />
                    <Button
                      type="button"
                      variant="royalOutline"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                    >
                      {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border mt-6 pt-6 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {gstAmount > 0 && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>GST</span>
                    <span>+₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shippingCharge > 0 ? `+₹${shippingCharge.toFixed(2)}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-display text-lg font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
