import { cn } from '@/lib/utils';

interface PageWrapperProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ title, description, children, className }: PageWrapperProps) {
  return (
    <div className={cn('glass-panel p-6', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
