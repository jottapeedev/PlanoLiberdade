import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { cn } from "../lib/utils";

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  hint?: string;
}

export interface KanbanChange {
  id: string;
  columnId: string;
  order: number;
}

interface KanbanProps<T extends { id: string }> {
  items: T[];
  columns: KanbanColumn[];
  getColumnId: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onChange: (changes: KanbanChange[]) => void;
  onCardClick?: (item: T) => void;
  onAdd?: (columnId: string) => void;
  className?: string;
}

export function Kanban<T extends { id: string }>({
  items,
  columns,
  getColumnId,
  renderCard,
  onChange,
  onCardClick,
  onAdd,
  className,
}: KanbanProps<T>) {
  const [local, setLocal] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setLocal(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byColumn = useMemo(() => {
    const map = new Map<string, T[]>();
    columns.forEach((column) => map.set(column.id, []));
    local.forEach((item) => {
      const columnId = getColumnId(item);
      const list = map.get(columnId) ?? map.get(columns[0]?.id ?? "");
      list?.push(item);
    });
    return map;
  }, [columns, getColumnId, local]);

  const columnOf = (id: string): string | undefined => {
    if (columns.some((column) => column.id === id)) return id;
    const item = local.find((entry) => entry.id === id);
    return item ? getColumnId(item) : undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = columnOf(activeId);
    const to = columnOf(overId);
    if (!from || !to || from === to) return;

    setLocal((prev) => {
      const item = prev.find((entry) => entry.id === activeId);
      if (!item) return prev;
      const rest = prev.filter((entry) => entry.id !== activeId);
      const target = rest.filter((entry) => getColumnId(entry) === to);
      const overIndex = target.findIndex((entry) => entry.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : target.length;
      const nextTarget = [...target.slice(0, insertAt), item, ...target.slice(insertAt)];
      const others = rest.filter((entry) => getColumnId(entry) !== to);
      return [...others, ...nextTarget];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columnId = columnOf(activeId);
    if (!columnId) return;

    setLocal((prev) => {
      const target = prev.filter((entry) => getColumnId(entry) === columnId);
      const oldIndex = target.findIndex((entry) => entry.id === activeId);
      const newIndex = target.findIndex((entry) => entry.id === overId);
      if (oldIndex < 0) return prev;
      const reordered =
        newIndex >= 0 && newIndex !== oldIndex
          ? arrayMove(target, oldIndex, newIndex)
          : target;
      const others = prev.filter((entry) => getColumnId(entry) !== columnId);
      const next = [...others, ...reordered];

      onChange(
        reordered.map((entry, index) => ({ id: entry.id, columnId, order: index })),
      );
      return next;
    });
  };

  const dragging = local.find((item) => item.id === draggingId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className={cn("hide-scroll flex gap-4 overflow-x-auto pb-2", className)}>
        {columns.map((column) => (
          <KanbanColumnView
            key={column.id}
            column={column}
            items={byColumn.get(column.id) ?? []}
            renderCard={renderCard}
            onCardClick={onCardClick}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22,1,0.36,1)" }}>
        {dragging ? (
          <div className="w-[272px] rotate-2 rounded-2xl border border-accent/40 bg-surface p-3.5 shadow-[var(--shadow-pop)]">
            {renderCard(dragging)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumnView<T extends { id: string }>({
  column,
  items,
  renderCard,
  onCardClick,
  onAdd,
}: {
  column: KanbanColumn;
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onCardClick?: (item: T) => void;
  onAdd?: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const total = items.length;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[286px] shrink-0 flex-col rounded-3xl border bg-surface/50 backdrop-blur-xl transition-colors",
        isOver ? "border-accent/50 bg-surface/70" : "border-line",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: column.color, boxShadow: `0 0 12px ${column.color}` }}
          />
          <h3 className="truncate text-[12.5px] font-semibold tracking-tight">{column.name}</h3>
          <span className="num rounded-md border border-line bg-surface-2 px-1.5 text-[10.5px] text-muted">
            {total}
          </span>
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(column.id)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-ink"
            aria-label={`Adicionar em ${column.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <div className="hide-scroll flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableCard key={item.id} id={item.id} onClick={() => onCardClick?.(item)}>
              {renderCard(item)}
            </SortableCard>
          ))}
        </SortableContext>
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line-strong px-3 py-6 text-center text-[11.5px] text-faint">
            {column.hint ?? "Arraste um card para cá"}
          </p>
        )}
      </div>
    </section>
  );
}

function SortableCard({
  id,
  children,
  onClick,
}: {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab touch-manipulation rounded-2xl border border-line bg-surface-2/80 p-3.5 text-left transition-all duration-200 hover:border-accent/40 hover:bg-surface-2 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      {children}
    </div>
  );
}
