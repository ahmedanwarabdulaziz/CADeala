import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'border-orange',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${color} border-b-2 rounded-full animate-spin mx-auto ${className}`}
      style={{ animationDuration: '2s' }}
    />
  );
}
