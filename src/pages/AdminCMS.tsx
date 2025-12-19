import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Crown, LogOut, Plus, Trash2, Edit2, Loader2, RefreshCw, 
  Upload, X, Image as ImageIcon, MessageSquare, Layout, Megaphone, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface PopupOffer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string;
  button_link: string;
  is_active: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

interface HomeSection {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  sort_order: number;
  is_active: boolean;
}

export default function AdminCMS() {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog states
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [popupDialogOpen, setPopupDialogOpen] = useState(false);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  
  // Editing states
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingPopup, setEditingPopup] = useState<PopupOffer | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  
  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUploadTarget, setCurrentUploadTarget] = useState<'banner' | 'popup'>('banner');
  
  // Form states
  const [bannerForm, setBannerForm] = useState({
    image_url: '',
    title: '',
    subtitle: '',
    link_url: '',
    sort_order: '0',
    is_active: true,
  });
  
  const [popupForm, setPopupForm] = useState({
    title: '',
    description: '',
    image_url: '',
    button_text: 'Shop Now',
    button_link: '/products',
    is_active: true,
  });
  
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'order',
    sort_order: '0',
    is_active: true,
  });
  
  const [sectionForm, setSectionForm] = useState({
    section_type: 'custom',
    title: '',
    subtitle: '',
    content: '{}',
    sort_order: '0',
    is_active: true,
  });

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

  // Fetch queries
  const { data: banners, isLoading: bannersLoading, refetch: refetchBanners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const { data: popups, isLoading: popupsLoading, refetch: refetchPopups } = useQuery({
    queryKey: ['admin-popups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popup_offers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PopupOffer[];
    },
  });

  const { data: faqs, isLoading: faqsLoading, refetch: refetchFaqs } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const { data: sections, isLoading: sectionsLoading, refetch: refetchSections } = useQuery({
    queryKey: ['admin-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as HomeSection[];
    },
  });

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WEBP)');
      return;
    }

    // Validate file size (10MB max for banner images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB for optimal quality');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // For banner images, we want to preserve quality
      const uploadOptions = {
        cacheControl: '3600',
        upsert: false
      };

      const { error: uploadError } = await supabase.storage
        .from('cms-images')
        .upload(fileName, file, uploadOptions);

      if (uploadError) throw uploadError;

      // Get the public URL without transformations for storage in DB
      // Transformations will be applied at display time in BannerCarousel
      const { data: { publicUrl } } = supabase.storage
        .from('cms-images')
        .getPublicUrl(fileName);

      if (currentUploadTarget === 'banner') {
        setBannerForm({ ...bannerForm, image_url: publicUrl });
      } else {
        setPopupForm({ ...popupForm, image_url: publicUrl });
      }
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Mutations
  const bannerMutation = useMutation({
    mutationFn: async (banner: typeof bannerForm & { id?: string }) => {
      const data = {
        image_url: banner.image_url,
        title: banner.title || null,
        subtitle: banner.subtitle || null,
        link_url: banner.link_url || null,
        sort_order: parseInt(banner.sort_order) || 0,
        is_active: banner.is_active,
      };

      if (banner.id) {
        const { error } = await supabase.from('home_banners').update(data).eq('id', banner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('home_banners').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editingBanner ? 'Banner updated!' : 'Banner added!');
      resetBannerForm();
      setBannerDialogOpen(false);
    },
    onError: () => toast.error('Failed to save banner'),
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted!');
    },
  });

  const popupMutation = useMutation({
    mutationFn: async (popup: typeof popupForm & { id?: string }) => {
      const data = {
        title: popup.title,
        description: popup.description || null,
        image_url: popup.image_url || null,
        button_text: popup.button_text,
        button_link: popup.button_link,
        is_active: popup.is_active,
      };

      if (popup.id) {
        const { error } = await supabase.from('popup_offers').update(data).eq('id', popup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('popup_offers').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      toast.success(editingPopup ? 'Popup updated!' : 'Popup added!');
      resetPopupForm();
      setPopupDialogOpen(false);
    },
    onError: () => toast.error('Failed to save popup'),
  });

  const deletePopupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('popup_offers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      toast.success('Popup deleted!');
    },
  });

  const faqMutation = useMutation({
    mutationFn: async (faq: typeof faqForm & { id?: string }) => {
      const data = {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sort_order: parseInt(faq.sort_order) || 0,
        is_active: faq.is_active,
      };

      if (faq.id) {
        const { error } = await supabase.from('faqs').update(data).eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('faqs').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success(editingFaq ? 'FAQ updated!' : 'FAQ added!');
      resetFaqForm();
      setFaqDialogOpen(false);
    },
    onError: () => toast.error('Failed to save FAQ'),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ deleted!');
    },
  });

  const sectionMutation = useMutation({
    mutationFn: async (section: typeof sectionForm & { id?: string }) => {
      let parsedContent = {};
      try {
        parsedContent = JSON.parse(section.content);
      } catch (e) {
        parsedContent = {};
      }
      
      const data = {
        section_type: section.section_type,
        title: section.title || null,
        subtitle: section.subtitle || null,
        content: parsedContent,
        sort_order: parseInt(section.sort_order) || 0,
        is_active: section.is_active,
      };

      if (section.id) {
        const { error } = await supabase.from('home_sections').update(data).eq('id', section.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('home_sections').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      toast.success(editingSection ? 'Section updated!' : 'Section added!');
      resetSectionForm();
      setSectionDialogOpen(false);
    },
    onError: () => toast.error('Failed to save section'),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      toast.success('Section deleted!');
    },
  });

  // Reset functions
  const resetBannerForm = () => {
    setBannerForm({ image_url: '', title: '', subtitle: '', link_url: '', sort_order: '0', is_active: true });
    setEditingBanner(null);
  };

  const resetPopupForm = () => {
    setPopupForm({ title: '', description: '', image_url: '', button_text: 'Shop Now', button_link: '/products', is_active: true });
    setEditingPopup(null);
  };

  const resetFaqForm = () => {
    setFaqForm({ question: '', answer: '', category: 'order', sort_order: '0', is_active: true });
    setEditingFaq(null);
  };

  const resetSectionForm = () => {
    setSectionForm({ section_type: 'custom', title: '', subtitle: '', content: '{}', sort_order: '0', is_active: true });
    setEditingSection(null);
  };

  // Edit handlers
  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      image_url: banner.image_url,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '',
      sort_order: banner.sort_order.toString(),
      is_active: banner.is_active,
    });
    setBannerDialogOpen(true);
  };

  const handleEditPopup = (popup: PopupOffer) => {
    setEditingPopup(popup);
    setPopupForm({
      title: popup.title,
      description: popup.description || '',
      image_url: popup.image_url || '',
      button_text: popup.button_text,
      button_link: popup.button_link,
      is_active: popup.is_active,
    });
    setPopupDialogOpen(true);
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order.toString(),
      is_active: faq.is_active,
    });
    setFaqDialogOpen(true);
  };

  const handleEditSection = (section: HomeSection) => {
    setEditingSection(section);
    setSectionForm({
      section_type: section.section_type,
      title: section.title || '',
      subtitle: section.subtitle || '',
      content: JSON.stringify(section.content, null, 2),
      sort_order: section.sort_order.toString(),
      is_active: section.is_active,
    });
    setSectionDialogOpen(true);
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Crown className="w-8 h-8 text-primary" />
            <span className="font-display text-xl font-bold gradient-gold-text">CMS Manager</span>
          </div>
          <Button variant="royalOutline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <Tabs defaultValue="banners" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="banners" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="popups" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Popups
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Sections
            </TabsTrigger>
          </TabsList>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Home Banners</h2>
                <p className="text-sm text-muted-foreground">Max 10 banner images for the homepage slider</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchBanners()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog open={bannerDialogOpen} onOpenChange={(open) => { setBannerDialogOpen(open); if (!open) resetBannerForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="royal" disabled={banners && banners.length >= 10}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Banner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); bannerMutation.mutate({ ...bannerForm, id: editingBanner?.id }); }} className="space-y-4">
                      <div>
                        <Label>Banner Image *</Label>
                        {bannerForm.image_url ? (
                          <div className="relative mt-2 aspect-video rounded-lg overflow-hidden border border-border">
                            <img src={bannerForm.image_url} alt="Banner" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setBannerForm({ ...bannerForm, image_url: '' })} className="absolute top-2 right-2 p-1 bg-destructive rounded-full text-destructive-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setCurrentUploadTarget('banner'); fileInputRef.current?.click(); }} disabled={uploadingImage} className="mt-2 w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 transition-colors">
                            {uploadingImage ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : <><Upload className="w-8 h-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload Image</span></>}
                          </button>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="banner-title">Title (Optional)</Label>
                        <Input id="banner-title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} placeholder="Banner title" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="banner-subtitle">Subtitle (Optional)</Label>
                        <Input id="banner-subtitle" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} placeholder="Banner subtitle" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="banner-link">Link URL (Optional)</Label>
                        <Input id="banner-link" value={bannerForm.link_url} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} placeholder="/products" className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="banner-order">Sort Order</Label>
                          <Input id="banner-order" type="number" value={bannerForm.sort_order} onChange={(e) => setBannerForm({ ...bannerForm, sort_order: e.target.value })} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={bannerForm.is_active} onCheckedChange={(checked) => setBannerForm({ ...bannerForm, is_active: checked })} />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <Button type="submit" variant="royal" className="w-full" disabled={bannerMutation.isPending || !bannerForm.image_url}>
                        {bannerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingBanner ? 'Update Banner' : 'Add Banner'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {bannersLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : banners && banners.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {banners.map((banner) => (
                  <div key={banner.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="aspect-video relative">
                      <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                      {!banner.is_active && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><span className="text-muted-foreground font-medium">Inactive</span></div>}
                    </div>
                    <div className="p-4">
                      {banner.title && <h3 className="font-semibold">{banner.title}</h3>}
                      {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-muted-foreground">Order: {banner.sort_order}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditBanner(banner)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBannerMutation.mutate(banner.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No banners yet. Add your first banner!</p>
              </div>
            )}
          </TabsContent>

          {/* Popups Tab */}
          <TabsContent value="popups" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Special Offer Popups</h2>
                <p className="text-sm text-muted-foreground">Create promotional popups for visitors</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchPopups()}><RefreshCw className="w-4 h-4" /></Button>
                <Dialog open={popupDialogOpen} onOpenChange={(open) => { setPopupDialogOpen(open); if (!open) resetPopupForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="royal"><Plus className="w-4 h-4 mr-2" />Add Popup</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">{editingPopup ? 'Edit Popup' : 'Add Popup'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); popupMutation.mutate({ ...popupForm, id: editingPopup?.id }); }} className="space-y-4">
                      <div>
                        <Label htmlFor="popup-title">Title *</Label>
                        <Input id="popup-title" value={popupForm.title} onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })} placeholder="Special Offer!" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="popup-desc">Description</Label>
                        <Textarea id="popup-desc" value={popupForm.description} onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })} placeholder="Get 20% off your first order!" className="mt-1" rows={3} />
                      </div>
                      <div>
                        <Label>Popup Image</Label>
                        {popupForm.image_url ? (
                          <div className="relative mt-2 aspect-square max-w-[200px] rounded-lg overflow-hidden border border-border">
                            <img src={popupForm.image_url} alt="Popup" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setPopupForm({ ...popupForm, image_url: '' })} className="absolute top-2 right-2 p-1 bg-destructive rounded-full text-destructive-foreground"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setCurrentUploadTarget('popup'); fileInputRef.current?.click(); }} disabled={uploadingImage} className="mt-2 w-32 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors">
                            {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <><Upload className="w-6 h-6 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload</span></>}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="popup-btn-text">Button Text</Label>
                          <Input id="popup-btn-text" value={popupForm.button_text} onChange={(e) => setPopupForm({ ...popupForm, button_text: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="popup-btn-link">Button Link</Label>
                          <Input id="popup-btn-link" value={popupForm.button_link} onChange={(e) => setPopupForm({ ...popupForm, button_link: e.target.value })} className="mt-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={popupForm.is_active} onCheckedChange={(checked) => setPopupForm({ ...popupForm, is_active: checked })} />
                        <Label>Popup is active</Label>
                      </div>
                      <Button type="submit" variant="royal" className="w-full" disabled={popupMutation.isPending || !popupForm.title}>
                        {popupMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingPopup ? 'Update Popup' : 'Add Popup'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {popupsLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : popups && popups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {popups.map((popup) => (
                  <div key={popup.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border/50">
                    {popup.image_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={popup.image_url} alt={popup.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{popup.title}</h3>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", popup.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground")}>{popup.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      {popup.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{popup.description}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPopup(popup)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePopupMutation.mutate(popup.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No popups yet. Create your first offer!</p>
              </div>
            )}
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Order FAQs</h2>
                <p className="text-sm text-muted-foreground">FAQs shown on the checkout page</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchFaqs()}><RefreshCw className="w-4 h-4" /></Button>
                <Dialog open={faqDialogOpen} onOpenChange={(open) => { setFaqDialogOpen(open); if (!open) resetFaqForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="royal"><Plus className="w-4 h-4 mr-2" />Add FAQ</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); faqMutation.mutate({ ...faqForm, id: editingFaq?.id }); }} className="space-y-4">
                      <div>
                        <Label htmlFor="faq-question">Question *</Label>
                        <Input id="faq-question" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="How long does shipping take?" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="faq-answer">Answer *</Label>
                        <Textarea id="faq-answer" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="Standard shipping takes 3-5 business days..." className="mt-1" rows={4} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="faq-order">Sort Order</Label>
                          <Input id="faq-order" type="number" value={faqForm.sort_order} onChange={(e) => setFaqForm({ ...faqForm, sort_order: e.target.value })} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={faqForm.is_active} onCheckedChange={(checked) => setFaqForm({ ...faqForm, is_active: checked })} />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <Button type="submit" variant="royal" className="w-full" disabled={faqMutation.isPending || !faqForm.question || !faqForm.answer}>
                        {faqMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingFaq ? 'Update FAQ' : 'Add FAQ'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {faqsLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : faqs && faqs.length > 0 ? (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-4 bg-card rounded-xl border border-border/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{faq.question}</h3>
                          {!faq.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditFaq(faq)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteFaqMutation.mutate(faq.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No FAQs yet. Add your first FAQ!</p>
              </div>
            )}
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Home Page Sections</h2>
                <p className="text-sm text-muted-foreground">Manage homepage content sections</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchSections()}><RefreshCw className="w-4 h-4" /></Button>
                <Dialog open={sectionDialogOpen} onOpenChange={(open) => { setSectionDialogOpen(open); if (!open) resetSectionForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="royal"><Plus className="w-4 h-4 mr-2" />Add Section</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-display">{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); sectionMutation.mutate({ ...sectionForm, id: editingSection?.id }); }} className="space-y-4">
                      <div>
                        <Label htmlFor="section-type">Section Type</Label>
                        <Input id="section-type" value={sectionForm.section_type} onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })} placeholder="hero, features, cta, custom" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="section-title">Title</Label>
                        <Input id="section-title" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="Section title" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="section-subtitle">Subtitle</Label>
                        <Input id="section-subtitle" value={sectionForm.subtitle} onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })} placeholder="Section subtitle" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="section-content">Content (JSON)</Label>
                        <Textarea id="section-content" value={sectionForm.content} onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })} placeholder='{"buttonText": "Shop Now"}' className="mt-1 font-mono text-sm" rows={4} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="section-order">Sort Order</Label>
                          <Input id="section-order" type="number" value={sectionForm.sort_order} onChange={(e) => setSectionForm({ ...sectionForm, sort_order: e.target.value })} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch checked={sectionForm.is_active} onCheckedChange={(checked) => setSectionForm({ ...sectionForm, is_active: checked })} />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <Button type="submit" variant="royal" className="w-full" disabled={sectionMutation.isPending}>
                        {sectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingSection ? 'Update Section' : 'Add Section'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {sectionsLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : sections && sections.length > 0 ? (
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section.id} className="p-4 bg-card rounded-xl border border-border/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-medium">{section.section_type}</span>
                          <span className="text-xs text-muted-foreground">Order: {section.sort_order}</span>
                          {!section.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
                        </div>
                        {section.title && <h3 className="font-semibold mt-2">{section.title}</h3>}
                        {section.subtitle && <p className="text-sm text-muted-foreground">{section.subtitle}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSection(section)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSectionMutation.mutate(section.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Layout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No sections yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
