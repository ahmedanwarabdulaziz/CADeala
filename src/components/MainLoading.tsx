import React from 'react';
import LoadingDots from './LoadingDots';

interface MainLoadingProps {
  message?: string;
  className?: string;
}

export default function MainLoading({ 
  message = 'Loading...',
  className = '' 
}: MainLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-50 ${className}`}>
      {/* CADeala Logo */}
      <div className="mb-8">
        <img 
          src="/CADEALA LOGO.png" 
          alt="CADeala" 
          className="h-16 w-auto"
        />
      </div>
      
      {/* Three Dots Animation */}
      <LoadingDots size="lg" color="text-orange" className="mb-4" />
      
      {/* Loading Message */}
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}
