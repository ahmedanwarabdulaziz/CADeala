import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function LoadingDots({ 
  size = 'md', 
  color = 'text-orange',
  className = '' 
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
      />
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '160ms', animationDuration: '1.4s' }}
      />
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '320ms', animationDuration: '1.4s' }}
      />
    </div>
  );
}
