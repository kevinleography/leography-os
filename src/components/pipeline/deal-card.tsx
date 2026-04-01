'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import { User, DollarSign, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import type { DealWithRelations } from '@/types/database';

interface DealCardProps {
  deal: DealWithRelations;
  isOverlay?: boolean;
}

function getProbabilityVariant(probability: number) {
  if (probability >= 70) return 'success' as const;
  if (probability >= 40) return 'warning' as const;
  return 'secondary' as const;
}

export function DealCard({ deal, isOverlay = false }: DealCardProps) {
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name}`
    : null;

  function handleClick() {
    if (!isDragging) {
      router.push(`/pipeline/${deal.id}`);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'bg-glass backdrop-blur-2xl border border-glass-border rounded-xl p-3 cursor-grab',
        'transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'active:cursor-grabbing',
        isDragging && 'opacity-40',
        isOverlay && 'shadow-2xl shadow-primary/20 rotate-2 scale-105'
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
        {deal.title}
      </p>

      {/* Contact */}
      {contactName && (
        <div className="flex items-center gap-1.5 mb-2">
          <User className="w-3 h-3 text-text-muted flex-shrink-0" />
          <span className="text-xs text-text-secondary truncate">
            {contactName}
          </span>
          {deal.contact?.company && (
            <span className="text-xs text-text-muted truncate">
              - {deal.contact.company}
            </span>
          )}
        </div>
      )}

      {/* Value + Probability */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-text-muted" />
          <span className="text-xs font-semibold text-text-primary">
            {formatCurrency(deal.value)}
          </span>
        </div>
        <Badge variant={getProbabilityVariant(deal.probability)}>
          <Percent className="w-3 h-3 mr-0.5" />
          {deal.probability}%
        </Badge>
      </div>
    </div>
  );
}
