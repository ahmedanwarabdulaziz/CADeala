'use client';

import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  swipeable?: boolean;
}

export default function MobileCard({ 
  children, 
  className = '', 
  onClick,
  swipeable = false 
}: MobileCardProps) {
  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
        ${swipeable ? 'touch-pan-y' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="h-12 w-12 bg-orange/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function ActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  variant = 'primary',
  className = '' 
}: ActionCardProps) {
  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-lg p-4 cursor-pointer
        hover:shadow-md transition-all duration-200 active:scale-95
        ${variant === 'primary' ? 'hover:border-orange' : 'hover:border-gray-300'}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {icon && (
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            variant === 'primary' ? 'bg-orange/10 text-orange' : 'bg-gray-100 text-gray-600'
          }`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className="text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
