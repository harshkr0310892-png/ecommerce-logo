import { Layout } from "@/components/layout/Layout";
import { ContactForm } from "@/components/ContactForm";
import { Crown } from "lucide-react";

export default function ContactUs() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Contact <span className="gradient-gold-text">Support</span>
            </h1>
            <p className="text-muted-foreground">
              Have questions or need assistance? Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h2 className="font-display text-xl font-bold mb-4">Get in Touch</h2>
                <p className="text-muted-foreground mb-6">
                  Our customer support team is available to assist you with any inquiries regarding your orders, products, or general questions.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Customer Support</h3>
                      <p className="text-muted-foreground text-sm">
                        For order-related queries and general assistance
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Technical Support</h3>
                      <p className="text-muted-foreground text-sm">
                        For website issues and technical problems
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">Business Inquiries</h3>
                      <p className="text-muted-foreground text-sm">
                        For partnerships, collaborations, and wholesale orders
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h2 className="font-display text-xl font-bold mb-4">Our Promise</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="gradient-gold-text">•</span>
                    <span>Response within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="gradient-gold-text">•</span>
                    <span>Personalized assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="gradient-gold-text">•</span>
                    <span>Confidential handling of your information</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}