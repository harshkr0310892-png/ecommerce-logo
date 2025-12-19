import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['checkout-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">
          Learn More About Your Order
        </h3>
      </div>
      
      <div className="space-y-2">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="border border-border/50 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium pr-4">{faq.question}</span>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                  openId === faq.id && "rotate-180"
                )} 
              />
            </button>
            
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                openId === faq.id ? "max-h-96" : "max-h-0"
              )}
            >
              <div className="p-4 pt-0 text-sm text-muted-foreground">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
