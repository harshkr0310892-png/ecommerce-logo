import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface PopupOffer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string;
  button_link: string;
}

export function SpecialOfferPopup() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [popup, setPopup] = useState<PopupOffer | null>(null);

  useEffect(() => {
    const checkPopup = async () => {
      // Check if popup was already shown this session
      const shownKey = 'offer_popup_shown';
      if (sessionStorage.getItem(shownKey)) return;

      const { data, error } = await supabase
        .from('popup_offers')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      setPopup(data);
      
      // Delay popup appearance for better UX
      setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem(shownKey, 'true');
      }, 2000);
    };

    checkPopup();
  }, []);

  const handleAction = () => {
    if (popup?.button_link) {
      navigate(popup.button_link);
    }
    setIsOpen(false);
  };

  if (!popup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20">
        <DialogTitle className="sr-only">Special Offer</DialogTitle>
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {popup.image_url && (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={popup.image_url} 
              alt={popup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Special Offer
          </div>
          
          <h2 className="font-display text-2xl font-bold mb-2">
            {popup.title}
          </h2>
          
          {popup.description && (
            <p className="text-muted-foreground mb-6">
              {popup.description}
            </p>
          )}

          <Button 
            variant="royal" 
            size="lg"
            onClick={handleAction}
            className="w-full"
          >
            {popup.button_text}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
