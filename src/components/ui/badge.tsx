import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary-light text-primary border border-primary/20',
        secondary:
          'bg-bg-tertiary text-text-secondary border border-glass-border',
        destructive:
          'bg-destructive-light text-destructive border border-destructive/20',
        outline:
          'border border-glass-border text-text-secondary bg-transparent',
        success:
          'bg-success-light text-success border border-success/20',
        warning:
          'bg-warning-light text-warning border border-warning/20',
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
