import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-100 text-indigo-700 border border-indigo-200',
        secondary:
          'bg-slate-100 text-slate-600 border border-slate-200',
        destructive:
          'bg-red-100 text-red-700 border border-red-200',
        outline:
          'border border-slate-200 text-slate-600 bg-white',
        success:
          'bg-green-100 text-green-700 border border-green-200',
        warning:
          'bg-amber-100 text-amber-700 border border-amber-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
