import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[10px] px-3 py-2 text-sm',
          'bg-[rgba(255,255,255,0.05)] backdrop-blur-xl',
          'border border-glass-border',
          'text-text-primary placeholder:text-text-muted',
          'transition-all duration-200',
          'focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
