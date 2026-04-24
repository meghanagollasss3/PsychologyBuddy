import React from 'react';

// Elegant ring spinner with double rotating rings
export function RingSpinner({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  color?: 'blue' | 'white' | 'gray';
  className?: string;
}) {
  console.log('RingSpinner: Rendering with size:', size, 'color:', color);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div 
        className={`absolute inset-0 border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
      />
      <div 
        className={`absolute inset-1 border-2 ${colorClasses[color]} border-b-transparent rounded-full animate-spin`}
        style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
      />
    </div>
  );
}
