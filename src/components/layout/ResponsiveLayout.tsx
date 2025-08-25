import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopNavbar } from "./DesktopNavbar";
import { TabletSidebar } from "./TabletSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { PaymentNotificationBanner } from "@/components/PaymentNotificationBanner";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export function ResponsiveLayout({ children, currentPath }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Pages that should not show navigation
  const noNavPages = ['/login', '/register', '/forgot-password'];
  const isNotFoundPage = currentPath === '*' || !location.pathname || location.pathname === '/404';
  const shouldHideNav = noNavPages.includes(currentPath) || isNotFoundPage;

  // Auto scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Check for tablet size with proper effect handling
  React.useEffect(() => {
    const checkTabletSize = () => {
      const windowWidth = window.innerWidth;
      setIsTablet(!isMobile && windowWidth > 768 && windowWidth <= 1024);
    };

    checkTabletSize();
    window.addEventListener('resize', checkTabletSize);
    return () => window.removeEventListener('resize', checkTabletSize);
  }, [isMobile]);

  if (isMobile) {
    if (shouldHideNav) {
      return (
        <div className="flex flex-col min-h-screen bg-background">
          <main className="flex-1 animate-fade-in">
            <div className="transition-all duration-500 ease-out">
              {children}
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <MobileHeader />
        <PaymentNotificationBanner />
        <main className="flex-1 pb-14 pt-12 animate-fade-in">
          <div className="transition-all duration-500 ease-out">
            {children}
          </div>
        </main>
        <MobileBottomNav currentPath={currentPath} />
      </div>
    );
  }

  // Tablet now follows desktop layout
  if (shouldHideNav) {
    return (
      <div className="min-h-screen bg-background">
        <main className="animate-fade-in">
          <div className="transition-all duration-500 ease-out">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopNavbar currentPath={currentPath} />
      <PaymentNotificationBanner />
      <main className="pt-16 animate-fade-in">
        <div className="transition-all duration-500 ease-out">
          {children}
        </div>
      </main>
    </div>
  );
}