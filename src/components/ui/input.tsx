import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl px-3 py-2 text-sm',
          'bg-white/50 backdrop-blur-sm',
          'border border-slate-200/50',
          'text-slate-800 placeholder:text-slate-400',
          'transition-all duration-200',
          'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700',
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
