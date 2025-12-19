import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Facebook, Twitter, Instagram, Mail, Phone, MapPin, Leaf, Recycle, TreePine, Plus, Minus } from "lucide-react";

export const Footer = () => {
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  const [isCommitmentOpen, setIsCommitmentOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <footer className="border-t border-border/50 bg-gradient-to-r from-green-50/20 via-card/10 to-emerald-50/20 dark:from-green-900/10 dark:via-card/5 dark:to-emerald-900/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <span className="font-display text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-800 dark:from-green-400 dark:to-emerald-300 bg-clip-text text-transparent">
                Kiran Store
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your premier destination for sustainable, eco-friendly products that care for both you and the planet.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <TreePine className="w-4 h-4" />
              <span>Committed to sustainability & carbon neutrality</span>
            </div>
            <div className="flex gap-3">
              <a href="#" className="w-11 h-11 rounded-full border border-border/50 dark:border-border/30 flex items-center justify-center hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 hover:text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-11 h-11 rounded-full border border-border/50 dark:border-border/30 flex items-center justify-center hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 hover:text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-11 h-11 rounded-full border border-border/50 dark:border-border/30 flex items-center justify-center hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 hover:text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-foreground relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-gradient-to-r after:from-green-600 after:to-emerald-700 dark:after:from-green-500 dark:after:to-emerald-600 rounded-full">
                Quick Links
              </h4>
              <button 
                className="md:hidden w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center transition-transform duration-300 hover:scale-110"
                onClick={() => setIsQuickLinksOpen(!isQuickLinksOpen)}
              >
                {isQuickLinksOpen ? (
                  <Minus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-300" />
                ) : (
                  <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-300" />
                )}
              </button>
            </div>
            <div 
              className={`flex flex-col gap-3 overflow-hidden transition-all duration-500 ease-in-out ${
                isQuickLinksOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
              }`}
            >
              <Link to="/products" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm hover:translate-x-1 transition-transform duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                  Shop Collection
                </span>
              </Link>
              <Link to="/cart" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm hover:translate-x-1 transition-transform duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                  View Cart
                </span>
              </Link>
              <Link to="/track-order" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm hover:translate-x-1 transition-transform duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                  Track Your Order
                </span>
              </Link>
              <Link to="/contact-us" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm hover:translate-x-1 transition-transform duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                  Contact Us
                </span>
              </Link>
              <Link to="/faq" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm hover:translate-x-1 transition-transform duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                  FAQs
                </span>
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-sm hover:translate-x-1 transition-transform duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
                  Privacy Policy
                </span>
              </Link>
            </div>
          </div>

          {/* Sustainability Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-foreground relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-gradient-to-r after:from-green-600 after:to-emerald-700 dark:after:from-green-500 dark:after:to-emerald-600 rounded-full">
                Our Commitment
              </h4>
              <button 
                className="md:hidden w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center transition-transform duration-300 hover:scale-110"
                onClick={() => setIsCommitmentOpen(!isCommitmentOpen)}
              >
                {isCommitmentOpen ? (
                  <Minus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-300" />
                ) : (
                  <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-300" />
                )}
              </button>
            </div>
            <div 
              className={`flex flex-col gap-4 overflow-hidden transition-all duration-500 ease-in-out ${
                isCommitmentOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all">
                  <Recycle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Zero Waste Packaging</p>
                  <p className="text-muted-foreground text-sm">100% recyclable and biodegradable materials</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all">
                  <TreePine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Carbon Neutral</p>
                  <p className="text-muted-foreground text-sm">We offset all shipping emissions</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Eco Materials</p>
                  <p className="text-muted-foreground text-sm">Sustainably sourced and organic materials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-foreground relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-gradient-to-r after:from-green-600 after:to-emerald-700 dark:after:from-green-500 dark:after:to-emerald-600 rounded-full">
                Contact Us
              </h4>
              <button 
                className="md:hidden w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center transition-transform duration-300 hover:scale-110"
                onClick={() => setIsContactOpen(!isContactOpen)}
              >
                {isContactOpen ? (
                  <Minus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-300" />
                ) : (
                  <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 transition-transform duration-300" />
                )}
              </button>
            </div>
            <div 
              className={`flex flex-col gap-4 overflow-hidden transition-all duration-500 ease-in-out ${
                isContactOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-muted-foreground text-sm">support@royalecostore.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Phone</p>
                  <p className="text-muted-foreground text-sm">+91 9876543210</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="text-muted-foreground text-sm">123 Green Avenue, Mumbai, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30 dark:border-border/20 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Royal Eco Store. All rights reserved. <span className="text-emerald-700 dark:text-emerald-400">Sustainable shopping for a greener tomorrow.</span>
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Plastic Free
            </span>
            <span className="flex items-center gap-1">
              <Recycle className="w-3 h-3" />
              Recyclable Packaging
            </span>
            <span className="flex items-center gap-1">
              <TreePine className="w-3 h-3" />
              Carbon Neutral
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};