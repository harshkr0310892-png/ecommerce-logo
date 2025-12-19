import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface ContactFormProps {
  className?: string;
}

export const ContactForm = ({ className = "" }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MIN_PHOTOS = 0;
  const MAX_PHOTOS = 6;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Enhanced validation for Indian phone numbers
      try {
        // Clean the phone number (remove spaces, hyphens, parentheses, etc.)
        const cleanedPhone = formData.phone.replace(/[\s\-()\u202c]/g, '');
        
        // Check for mixed characters (anything other than digits and + at the start)
        if (/[^0-9+]/.test(cleanedPhone) || (cleanedPhone.includes('+') && !cleanedPhone.startsWith('+'))) {
          newErrors.phone = "Please enter a valid Indian mobile number (only digits and + allowed)";
          return;
        }
        
        // Handle international format
        let phoneToValidate = cleanedPhone;
        if (cleanedPhone.startsWith('+91')) {
          phoneToValidate = cleanedPhone.substring(3); // Remove +91 prefix
        } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
          phoneToValidate = cleanedPhone.substring(2); // Remove 91 prefix
        } else if (cleanedPhone.startsWith('+')) {
          // Invalid international format
          newErrors.phone = "Please enter a valid Indian mobile number";
          return;
        }
        
        // Check length (must be exactly 10 digits after cleaning)
        if (phoneToValidate.length !== 10) {
          newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
          return;
        }
        
        // Check starting digit (must be 6, 7, 8, or 9)
        const firstDigit = phoneToValidate.charAt(0);
        if (!['6', '7', '8', '9'].includes(firstDigit)) {
          newErrors.phone = "Indian mobile numbers must start with 6, 7, 8, or 9";
          return;
        }
        
        // Check for repeating digits pattern (e.g., 1111111111)
        const repeatedDigitsPattern = /^(\d)\1{9}$/;
        if (repeatedDigitsPattern.test(phoneToValidate)) {
          newErrors.phone = "Please enter a valid Indian mobile number";
          return;
        }
        
        // Check for sequential patterns
        const sequentialPatterns = [
          '0123456789',
          '1234567890',
          '2345678901',
          '3456789012',
          '4567890123',
          '5678901234',
          '6789012345',
          '7890123456',
          '8901234567',
          '9012345678',
          '9876543210'
        ];
        if (sequentialPatterns.includes(phoneToValidate)) {
          newErrors.phone = "Please enter a valid Indian mobile number";
          return;
        }
        
        // Check for same prefix patterns (first 5 digits are same)
        const firstFiveSamePattern = /^(\d)\1{4}\d{5}$/;
        if (firstFiveSamePattern.test(phoneToValidate)) {
          newErrors.phone = "Please enter a valid Indian mobile number";
          return;
        }
        
        // Final validation using libphonenumber-js
        const fullPhoneNumber = `+91${phoneToValidate}`;
        if (!isValidPhoneNumber(fullPhoneNumber, 'IN')) {
          newErrors.phone = "Please enter a valid Indian mobile number";
          return;
        }
        
        // Parse the phone number to double-check
        const phoneNumber = parsePhoneNumber(fullPhoneNumber, 'IN');
        if (!phoneNumber.isValid()) {
          newErrors.phone = "Please enter a valid Indian mobile number";
          return;
        }
      } catch (error) {
        newErrors.phone = "Please enter a valid Indian mobile number";
        return;
      }
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (photos.length < MIN_PHOTOS || photos.length > MAX_PHOTOS) {
      newErrors.photos = `Please upload between ${MIN_PHOTOS} and ${MAX_PHOTOS} photos`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkIfBanned = async (email: string, phone: string) => {
    // Normalize phone number to match the format in the database (+91XXXXXXXXXX)
    const phoneDigits = phone.replace(/\D/g, "");
    let normalizedPhone = null;
    
    if (phoneDigits.length === 10) {
      normalizedPhone = `+91${phoneDigits}`;
    } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      normalizedPhone = `+${phoneDigits}`;
    } else if (phoneDigits.length === 13 && phoneDigits.startsWith('91')) {
      normalizedPhone = `+${phoneDigits}`;
    }
    
    // Build the query to check if user is banned
    let query = supabase
      .from("banned_users")
      .select("*")
      .eq("is_active", true)
      .limit(1);
    
    // Add conditions for email and/or phone if they exist
    if (email && normalizedPhone) {
      // Check both email and phone
      query = query.or(`email.eq.${email},phone.eq.${normalizedPhone}`);
    } else if (email) {
      // Check only email
      query = query.eq("email", email);
    } else if (normalizedPhone) {
      // Check only phone
      query = query.eq("phone", normalizedPhone);
    } else {
      // No valid identifiers to check
      return false;
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error checking banned status:", error);
      return false;
    }
    
    return data && data.length > 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = photos.length + newFiles.length;

    if (totalFiles > MAX_PHOTOS) {
      toast.error(`You can upload a maximum of ${MAX_PHOTOS} photos`);
      return;
    }

    // Validate file types
    const validFiles = newFiles.filter(file => 
      file.type === 'image/jpeg' || 
      file.type === 'image/png' || 
      file.type === 'image/webp'
    );

    if (validFiles.length !== newFiles.length) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file sizes (5MB max)
    const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }

    setPhotos(prev => [...prev, ...newFiles]);
    
    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    
    // Adjust current photo index if needed
    if (photoPreviews.length <= 3) {
      setCurrentPhotoIndex(0);
    } else if (index < currentPhotoIndex) {
      setCurrentPhotoIndex(prev => Math.max(0, prev - 1));
    } else if (currentPhotoIndex > photoPreviews.length - 4) {
      setCurrentPhotoIndex(prev => Math.max(0, prev - 3));
    }
  };

  const uploadPhotos = async () => {
    const photoUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contact-photos')
        .upload(fileName, photo);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('contact-photos')
        .getPublicUrl(fileName);
        
      photoUrls.push(publicUrl);
    }
    
    return photoUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if user is banned
      const isBanned = await checkIfBanned(formData.email, formData.phone);
      
      if (isBanned) {
        toast.error("You are not allowed to submit this form");
        setIsSubmitting(false);
        return;
      }
      
      // Upload photos if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos();
      }
      
      // Normalize phone number for storage
      const phoneDigits = formData.phone.replace(/\D/g, "");
      let normalizedPhone = formData.phone;
      
      if (phoneDigits.length === 10) {
        normalizedPhone = `+91${phoneDigits}`;
      } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
        normalizedPhone = `+${phoneDigits}`;
      } else if (phoneDigits.length === 13 && phoneDigits.startsWith('91')) {
        normalizedPhone = `+${phoneDigits}`;
      }
      
      // Submit form data
      const { error } = await supabase.from("contact_submissions").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: normalizedPhone,
          subject: formData.subject,
          description: formData.description,
          photos: photoUrls,
          is_banned: isBanned, // This should always be false since we're preventing banned users from submitting
        },
      ]);
      
      if (error) throw error;
      
      toast.success("Your message has been sent successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        description: "",
      });
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-card rounded-xl border border-border/50 p-6 ${className}`}>
      <h3 className="font-display text-xl font-bold mb-6">Contact Support</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., 9876543210 (10 digits, starting with 6-9)"
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Brief subject of your inquiry"
            className={errors.subject ? "border-destructive" : ""}
          />
          {errors.subject && <p className="text-destructive text-sm mt-1">{errors.subject}</p>}
        </div>
        
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Please provide detailed information about your inquiry"
            rows={4}
            className={errors.description ? "border-destructive" : ""}
          />
          {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
        </div>
        
        {/* Photo Upload Section */}
        <div>
          <Label>Photos (Optional, up to 6)</Label>
          <div className="mt-2 space-y-4">
            {/* Preview uploaded photos with navigation */}
            {photoPreviews.length > 0 && (
              <div className="space-y-2">
                <div className="relative">
                  <div className="grid grid-cols-3 gap-2">
                    {photoPreviews.slice(currentPhotoIndex, currentPhotoIndex + 3).map((preview, idx) => {
                      const actualIndex = currentPhotoIndex + idx;
                      return (
                        <div key={actualIndex} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${actualIndex + 1}`} 
                            className="w-full h-24 object-cover rounded-md border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(actualIndex)}
                            className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Navigation arrows */}
                  {photoPreviews.length > 3 && (
                    <>
                      {currentPhotoIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 3))}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-card border border-border rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}
                      {currentPhotoIndex + 3 < photoPreviews.length && (
                        <button
                          type="button"
                          onClick={() => setCurrentPhotoIndex(prev => Math.min(photoPreviews.length - 3, prev + 3))}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-card border border-border rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Photo counter */}
                {photoPreviews.length > 3 && (
                  <div className="text-center text-sm text-muted-foreground">
                    {currentPhotoIndex + 1}-{Math.min(currentPhotoIndex + 3, photoPreviews.length)} of {photoPreviews.length} photos
                  </div>
                )}
              </div>
            )}
            
            {/* Upload button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {photos.length > 0 
                  ? `Add Photos (${photos.length}/${MAX_PHOTOS})` 
                  : 'Upload Photos'}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Upload up to {MAX_PHOTOS} photos (JPEG, PNG, or WebP, max 5MB each)
              </p>
              {errors.photos && <p className="text-destructive text-sm mt-1">{errors.photos}</p>}
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          variant="royal" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>
    </div>
  );
};