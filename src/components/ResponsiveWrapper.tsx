'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsLoading(false);
    };

    // Check immediately
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading state - but don't block rendering
  if (isLoading) {
    // Return desktop version by default to avoid hydration issues
    return (
      <div className="hidden lg:block">
        {children}
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
