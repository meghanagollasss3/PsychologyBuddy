import React from 'react';
import { RingSpinner } from '@/src/components/ui/Spinners';

interface AdminLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  variant?: 'overlay' | 'inline' | 'button';
  className?: string;
}

export function AdminLoader({ 
  size = 'md', 
  message = 'Loading...', 
  variant = 'inline',
  className = ''
}: AdminLoaderProps) {
  const renderSpinner = () => {
    console.log('AdminLoader: Rendering RingSpinner with size:', size);
    return <RingSpinner size={size} color="blue" />;
  };

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-3">
          {renderSpinner()}
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {renderSpinner()}
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {message && (
        <p className="text-gray-600 text-sm mt-2">{message}</p>
      )}
    </div>
  );
}

// Button with integrated loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LoadingButton({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
        disabled:pointer-events-none disabled:opacity-50
        ${variant === 'default' ? 'bg-[#3B82F6] text-white shadow hover:bg-primary/90' : ''}
        ${variant === 'destructive' ? 'bg-[#EF4444] text-[#FFFFFF] shadow-sm hover:bg-[#EF4444]/90' : ''}
        ${variant === 'outline' ? 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground' : ''}
        ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80' : ''}
        ${variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : ''}
        ${variant === 'link' ? 'text-primary underline-offset-4 hover:underline' : ''}
        ${size === 'default' ? 'h-9 px-4 py-2' : ''}
        ${size === 'sm' ? 'h-8 rounded-md px-3 text-xs' : ''}
        ${size === 'lg' ? 'h-10 rounded-md px-8' : ''}
        ${size === 'icon' ? 'h-9 w-9' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <RingSpinner size="sm" color="white" />}
      {isLoading ? loadingText : children}
    </button>
  );
}

// Table row loading state
export function TableRowLoader({ colSpan = 1, message = 'Loading...' }: { colSpan?: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <RingSpinner size="sm" color="blue" />
          <span className="text-sm text-gray-500">{message}</span>
        </div>
      </td>
    </tr>
  );
}

// Card loading state
export function CardLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 space-y-2 border rounded-lg bg-muted/20">
      <RingSpinner size="md" color="blue" />
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );
}

// Inline loading for form fields
export function InlineLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <RingSpinner size="sm" color="gray" />
      <span>{message}</span>
    </div>
  );
}
