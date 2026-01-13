import { useState, useMemo } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { useLeads, useUpdateLeadStatus, useAutoProspect, useUpdateLead, useUpdateLeadPosition } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { mapSupabaseLeadToUILead, mapUIStatusToDBStatus } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import EmailStats from '@/components/dashboard/EmailStats';
import LeadDetailsSheet from '@/components/leads/LeadDetailsSheet';

interface PipelineProps {
  searchTerm?: string;
}

const Pipeline = ({ searchTerm = '' }: PipelineProps) => {
  const { toast } = useToast();
  const { data: dbLeads = [], isLoading } = useLeads();
  const updateStatusMutation = useUpdateLeadStatus();
  const autoProspectMutation = useAutoProspect();
  const updateLeadMutation = useUpdateLead();
  const updatePositionMutation = useUpdateLeadPosition();
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const leads = useMemo(() => {
    const allLeads = dbLeads.map(mapSupabaseLeadToUILead);
    if (!searchTerm) return allLeads;

    const lowerTerm = searchTerm.toLowerCase();
    return allLeads.filter(lead => {
      const normalizedPhone = (lead.phone || '').replace(/\D/g, '');
      const normalizedTerm = searchTerm.replace(/\D/g, '');
      const phoneMatch = lead.phone?.includes(searchTerm) || (normalizedTerm.length > 0 && normalizedPhone.includes(normalizedTerm));

      return (
        lead.companyName.toLowerCase().includes(lowerTerm) ||
        lead.email?.toLowerCase().includes(lowerTerm) ||
        phoneMatch ||
        lead.segment?.toLowerCase().includes(lowerTerm) ||
        lead.city?.toLowerCase().includes(lowerTerm) ||
        lead.notes?.toLowerCase().includes(lowerTerm)
      );
    });
  }, [dbLeads, searchTerm]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleSaveLead = async (leadId: string, data: Partial<Lead>) => {
    try {
      await updateLeadMutation.mutateAsync({ id: leadId, data });
      // Don't close automatically - let user continue editing or close manually
      // setSelectedLead(null); 
    } catch (error) {
      console.error("Failed to save lead", error);
    }
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    const dbStatus = mapUIStatusToDBStatus(newStatus);
    updateStatusMutation.mutate({ id: leadId, status: dbStatus });
  };

  const handleLeadMove = (leadId: string, newStatus: LeadStatus, newPosition: number) => {
    const dbStatus = mapUIStatusToDBStatus(newStatus);
    updatePositionMutation.mutate({ id: leadId, status: dbStatus, position: newPosition });
  };

  const handleAutoProspect = () => {
    autoProspectMutation.mutate(5); // Process 5 leads at a time
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="p-8 pb-0 space-y-6 flex-none">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
          <Button 
            onClick={handleAutoProspect} 
            disabled={autoProspectMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {autoProspectMutation.isPending ? 'Prospectando...' : 'Iniciar Prospecção Automática'}
          </Button>
        </div>

        <EmailStats />
      </div>

      <div className="flex-1 min-h-0 mt-6">
        <KanbanBoard 
          leads={leads} 
          onLeadClick={handleLeadClick}
          onStatusChange={handleStatusChange}
          onLeadMove={handleLeadMove}
        />
      </div>

      <LeadDetailsSheet 
        lead={selectedLead} 
        open={!!selectedLead} 
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onSave={handleSaveLead}
      />
    </div>
  );
};

export default Pipeline;
