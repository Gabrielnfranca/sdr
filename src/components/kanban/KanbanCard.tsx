import { Lead, CLASSIFICATION_CONFIG } from '@/types/lead';
import { Building2, MapPin, Globe, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';
import { Draggable } from '@hello-pangea/dnd';

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onClick?: () => void;
  style?: CSSProperties;
}

const KanbanCard = ({ lead, index, onClick, style }: KanbanCardProps) => {
  const classConfig = CLASSIFICATION_CONFIG[lead.classification];
  
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className="bg-card rounded-lg border shadow-sm p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 animate-fade-in"
          style={{ ...style, ...provided.draggableProps.style }}
        >
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">{lead.companyName}</h4>
              <p className="text-xs text-muted-foreground truncate">{lead.segment}</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{lead.city}</span>
            </div>
            {lead.website && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span className="truncate">{lead.website.replace(/https?:\/\//, '')}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              "bg-secondary",
              classConfig.color
            )}>
              {classConfig.label}
            </span>
            
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              <span className="text-xs font-medium text-foreground">{lead.score}</span>
            </div>
          </div>

          {/* Tags */}
          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {lead.tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  +{lead.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
