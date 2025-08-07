import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white/10 p-4 rounded-lg border border-white/20"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-white text-xl select-none"
        style={{ cursor: 'grab' }}
      >
        ☰
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
