'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  mobileComponent?: React.ReactNode;
  forceMobile?: boolean;
}

export default function ResponsiveWrapper({ 
  children, 
  mobileComponent,
  forceMobile = false 
}: ResponsiveWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsLoading(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Force mobile or detect mobile device
  if (forceMobile || isMobile) {
    // Check if we have a mobile-specific component for this route
    if (mobileComponent) {
      return <>{mobileComponent}</>;
    }

    // For now, show the regular component but with mobile styling
    return (
      <div className="lg:hidden">
        {children}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="hidden lg:block">
      {children}
    </div>
  );
}

// Hook to detect mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
