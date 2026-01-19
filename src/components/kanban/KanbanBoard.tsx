import { useMemo, useRef } from 'react';
import { Lead, LeadStatus, STATUS_CONFIG } from '@/types/lead';
import KanbanColumn from './KanbanColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useAutoScrollHorizontal } from '@/hooks/useAutoScrollHorizontal';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
  onLeadMove?: (leadId: string, newStatus: LeadStatus, newPosition: number) => void;
  onLeadDelete?: (leadId: string) => void;
}

const PIPELINE_STAGES: LeadStatus[] = [
  'novo',
  'contato_enviado',
  'followup_1',
  'followup_2',
  'engajado',
  'interesse',
  'atendimento_humano',
];

const KanbanBoard = ({ leads, onLeadClick, onStatusChange, onLeadMove, onLeadDelete }: KanbanBoardProps) => {
  const leadsByStatus = useMemo(() => {
    const acc = PIPELINE_STAGES.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as Record<LeadStatus, Lead[]>);

    // Leads are already sorted by position from useLeads hook
    leads.forEach(lead => {
      if (acc[lead.status]) {
        acc[lead.status].push(lead);
      }
    });

    return acc;
  }, [leads]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { setIsDragging } = useAutoScrollHorizontal(scrollContainerRef);

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as LeadStatus;
    const destLeads = leadsByStatus[newStatus] || [];
    
    // Calculate new position
    let newPosition = 0;
    
    // Removing the moved item from the list if it's the same column to calculate indices correctly
    // But since we are looking at "destination index", we can just look at the array roughly
    // The draggableId is NOT yet in destLeads (except if same column, then it is there at source index)
    
    let targetList = [...destLeads];
    
    if (source.droppableId === destination.droppableId) {
       // Remove from old index first
       targetList.splice(source.index, 1);
    }
    
    // Get items around the insertion point
    const prevItem = targetList[destination.index - 1];
    const nextItem = targetList[destination.index];

    if (!prevItem && !nextItem) {
      // List is empty
      newPosition = 1000;
    } else if (!prevItem) {
      // Insert at top
      // Must be strictly smaller than next item
      const nextPos = nextItem?.position || 0;
      newPosition = nextPos - 1000; 
    } else if (!nextItem) {
      // Insert at bottom
      // Must be strictly larger than prev item
      const prevPos = prevItem?.position || 0;
      newPosition = prevPos + 1000;
    } else {
      // Insert in middle
      const prevPos = prevItem.position || 0;
      const nextPos = nextItem.position || 0;
      newPosition = (prevPos + nextPos) / 2;
    }

    if (onLeadMove) {
      onLeadMove(draggableId, newStatus, newPosition);
    } else if (onStatusChange && newStatus !== source.droppableId as LeadStatus) {
       // Fallback for just status change if move handler not provided
       onStatusChange(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <div 
        ref={scrollContainerRef}
        className="flex h-[calc(100vh-180px)] overflow-x-auto px-4 pb-4 gap-4 select-none w-full kanban-scrollbar"
      >
        {PIPELINE_STAGES.map((status, index) => (
          <KanbanColumn
            key={status}
            status={status}
            config={STATUS_CONFIG[status]}
            leads={leadsByStatus[status] || []}
            onLeadClick={onLeadClick}
            onLeadDelete={onLeadDelete}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
