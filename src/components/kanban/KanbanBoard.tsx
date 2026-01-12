import { Lead, LeadStatus, STATUS_CONFIG } from '@/types/lead';
import KanbanColumn from './KanbanColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
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

const KanbanBoard = ({ leads, onLeadClick, onStatusChange }: KanbanBoardProps) => {
  const getLeadsForStatus = (status: LeadStatus) => 
    leads.filter(lead => lead.status === status);

  const onDragEnd = (result: DropResult) => {
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
    
    if (onStatusChange) {
      onStatusChange(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {PIPELINE_STAGES.map((status, index) => (
          <KanbanColumn
            key={status}
            status={status}
            config={STATUS_CONFIG[status]}
            leads={getLeadsForStatus(status)}
            onLeadClick={onLeadClick}
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
