import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function Layout({ children, showHeader = true, showFooter = true }: LayoutProps) {
  const location = useLocation();
  
  // Pages where we want to hide the footer
  const hideFooterPaths = [
    '/products',
    '/cart',
    '/checkout',
    '/track-order',
    '/contact-us',
    '/wishlist'
  ];
  
  const shouldShowFooter = showFooter && !hideFooterPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}