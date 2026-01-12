import { Lead, LeadStatus } from '@/types/lead';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';
import { Droppable } from '@hello-pangea/dnd';

interface KanbanColumnProps {
  status: LeadStatus;
  config: { label: string; color: string; bgColor: string };
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  style?: CSSProperties;
}

const KanbanColumn = ({ status, config, leads, onLeadClick, style }: KanbanColumnProps) => {
  return (
    <div 
      className="flex-shrink-0 w-72 animate-fade-in"
      style={style}
    >
      {/* Column Header */}
      <div className={cn(
        "px-4 py-3 rounded-t-xl border border-b-0",
        config.bgColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("font-semibold text-sm", config.color)}>
              {config.label}
            </span>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-bold",
            config.bgColor,
            config.color
          )}>
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="bg-secondary/30 border border-t-0 rounded-b-xl p-2 min-h-[400px] space-y-2"
          >
            {leads.map((lead, index) => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                index={index}
                onClick={() => onLeadClick?.(lead)}
                style={{ animationDelay: `${index * 30}ms` }}
              />
            ))}
            {provided.placeholder}
            
            {leads.length === 0 && (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                Nenhum lead
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
