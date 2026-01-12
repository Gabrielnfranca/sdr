import { Building2, Mail, Clock } from 'lucide-react';
import { Lead, STATUS_CONFIG, CLASSIFICATION_CONFIG } from '@/types/lead';
import { cn } from '@/lib/utils';

interface RecentLeadsProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const RecentLeads = ({ leads, onLeadClick }: RecentLeadsProps) => {
  return (
    <div className="bg-card rounded-xl border shadow-card animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Leads Recentes</h3>
        <p className="text-sm text-muted-foreground mt-1">Últimos leads adicionados ao sistema</p>
      </div>
      
      <div className="divide-y divide-border">
        {leads.slice(0, 5).map((lead, index) => {
          const statusConfig = STATUS_CONFIG[lead.status];
          const classConfig = CLASSIFICATION_CONFIG[lead.classification];
          
          return (
            <div
              key={lead.id}
              onClick={() => onLeadClick?.(lead)}
              className="p-4 hover:bg-secondary/30 cursor-pointer transition-colors duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{lead.companyName}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      statusConfig.bgColor,
                      statusConfig.color
                    )}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{lead.segment}</span>
                    <span>•</span>
                    <span>{lead.city}</span>
                    <span>•</span>
                    <span className={classConfig.color}>{classConfig.label}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-xs truncate max-w-[120px]">{lead.email}</span>
                  </div>
                  {lead.lastContactAt && (
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">
                        {new Date(lead.lastContactAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentLeads;
