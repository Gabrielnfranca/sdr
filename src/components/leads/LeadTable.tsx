import { Lead, STATUS_CONFIG, CLASSIFICATION_CONFIG } from '@/types/lead';
import { Building2, Mail, Phone, Globe, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LeadTableProps {
  leads: Lead[];
  selectedLeads?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onLeadClick?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
}

const LeadTable = ({ 
  leads, 
  selectedLeads = [], 
  onSelectionChange, 
  onLeadClick,
  onDeleteLead 
}: LeadTableProps) => {
  
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange(leads.map(l => l.id));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedLeads, id]);
      } else {
        onSelectionChange(selectedLeads.filter(leadId => leadId !== id));
      }
    }
  };

  const allSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const someSelected = selectedLeads.length > 0 && selectedLeads.length < leads.length;

  return (
    <div className="bg-card rounded-xl border shadow-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="w-12 px-4 py-4">
                <Checkbox 
                  checked={allSelected || (someSelected ? "indeterminate" : false)}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Endereço e Telefone
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contato
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Classificação
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Origem
              </th>
              <th className="w-12 px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead, index) => {
              const statusConfig = STATUS_CONFIG[lead.status];
              const classConfig = CLASSIFICATION_CONFIG[lead.classification];
              const isSelected = selectedLeads.includes(lead.id);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onLeadClick?.(lead)}
                  className={cn(
                    "hover:bg-secondary/30 cursor-pointer transition-colors animate-fade-in",
                    isSelected && "bg-secondary/20"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(lead.id, !!checked)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.companyName}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{lead.segment}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={lead.address}>{lead.address}</p>
                      {(lead.phone || lead.whatsapp) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{lead.phone || lead.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[160px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Globe className="w-3.5 h-3.5" />
                          <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="truncate max-w-[160px] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.website.replace(/https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      statusConfig.bgColor,
                      statusConfig.color
                    )}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium bg-secondary",
                      classConfig.color
                    )}>
                      {classConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-semibold text-foreground">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground">{lead.origin}</span>
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onLeadClick?.(lead)}>
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeleteLead?.(lead.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;
