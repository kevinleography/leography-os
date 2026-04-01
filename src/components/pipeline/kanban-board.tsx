'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealCard } from '@/components/pipeline/deal-card';
import { DealForm } from '@/components/pipeline/deal-form';
import { formatCurrency, cn } from '@/lib/utils';
import type { PipelineStage, DealWithRelations } from '@/types/database';

interface KanbanBoardProps {
  stages: PipelineStage[];
  initialDeals: DealWithRelations[];
}

function DroppableColumn({
  stage,
  deals,
  activeDealId,
}: {
  stage: PipelineStage;
  deals: DealWithRelations[];
  activeDealId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const dealIds = deals.map((d) => d.id);

  return (
    <div className="flex flex-col min-w-[300px] w-[300px] flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {stage.name}
        </h3>
        <span className="text-xs text-text-muted bg-glass border border-glass-border rounded-full px-2 py-0.5 flex-shrink-0">
          {deals.length}
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-3 px-1">
        {formatCurrency(totalValue)}
      </p>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 p-2 rounded-xl min-h-[200px] transition-colors duration-200',
          isOver
            ? 'bg-primary/10 border-2 border-dashed border-primary/40'
            : 'bg-[rgba(255,255,255,0.02)] border-2 border-dashed border-transparent'
        )}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isOverlay={false}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ stages, initialDeals }: KanbanBoardProps) {
  const [deals, setDeals] = useState<DealWithRelations[]>(initialDeals);
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null);
  const [showDealForm, setShowDealForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const dealsByStage = useMemo(() => {
    const map: Record<string, DealWithRelations[]> = {};
    for (const stage of stages) {
      map[stage.id] = [];
    }
    for (const deal of deals) {
      if (map[deal.stage_id]) {
        map[deal.stage_id].push(deal);
      }
    }
    return map;
  }, [deals, stages]);

  const findDealStage = useCallback(
    (dealId: string): string | null => {
      const deal = deals.find((d) => d.id === dealId);
      return deal?.stage_id ?? null;
    },
    [deals]
  );

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStageId = findDealStage(activeId);
    // overId could be a stage id or another deal id
    const overStageId = stages.find((s) => s.id === overId)
      ? overId
      : findDealStage(overId);

    if (!activeStageId || !overStageId || activeStageId === overStageId) return;

    // Move deal to new stage optimistically
    setDeals((prev) =>
      prev.map((d) =>
        d.id === activeId ? { ...d, stage_id: overStageId } : d
      )
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const deal = deals.find((d) => d.id === activeId);
    if (!deal) return;

    // Determine the target stage
    const targetStageId = stages.find((s) => s.id === overId)
      ? overId
      : findDealStage(overId);

    if (!targetStageId) return;

    // If stage changed, persist to API
    const originalDeal = initialDeals.find((d) => d.id === activeId);
    const currentStageId = deal.stage_id;

    if (currentStageId !== originalDeal?.stage_id || currentStageId !== targetStageId) {
      const finalStageId = targetStageId;
      // Ensure local state is correct
      setDeals((prev) =>
        prev.map((d) =>
          d.id === activeId ? { ...d, stage_id: finalStageId } : d
        )
      );

      try {
        const res = await fetch(`/api/deals/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_id: finalStageId }),
        });
        if (!res.ok) {
          // Revert on failure
          setDeals((prev) =>
            prev.map((d) =>
              d.id === activeId
                ? { ...d, stage_id: originalDeal?.stage_id ?? d.stage_id }
                : d
            )
          );
        }
      } catch {
        // Revert on error
        setDeals((prev) =>
          prev.map((d) =>
            d.id === activeId
              ? { ...d, stage_id: originalDeal?.stage_id ?? d.stage_id }
              : d
          )
        );
      }
    }
  }

  function handleDealCreated() {
    setShowDealForm(false);
    // Refresh page to get updated data from server
    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setShowDealForm(true)}>
          <Plus className="w-4 h-4" />
          Nouveau deal
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {stages.map((stage) => (
            <DroppableColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] ?? []}
              activeDealId={activeDeal?.id ?? null}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCard deal={activeDeal} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealForm
        open={showDealForm}
        onOpenChange={setShowDealForm}
        stages={stages}
        onSuccess={handleDealCreated}
      />
    </>
  );
}
