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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // Check immediately
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // During SSR or before mount, show both versions
  if (!mounted) {
    return (
      <>
        {/* Desktop version */}
        <div className="hidden lg:block">
          {children}
        </div>
        {/* Mobile version */}
        <div className="lg:hidden">
          {mobileComponent || children}
        </div>
      </>
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


