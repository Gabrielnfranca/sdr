import { useMemo } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { useLeads, useUpdateLeadStatus, useAutoProspect } from '@/hooks/useLeads';
import { Lead, LeadStatus } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';
import { mapSupabaseLeadToUILead, mapUIStatusToDBStatus } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import EmailStats from '@/components/dashboard/EmailStats';

const Pipeline = () => {
  const { toast } = useToast();
  const { data: dbLeads = [], isLoading } = useLeads();
  const updateStatusMutation = useUpdateLeadStatus();
  const autoProspectMutation = useAutoProspect();

  const leads = useMemo(() => dbLeads.map(mapSupabaseLeadToUILead), [dbLeads]);

  const handleLeadClick = (lead: Lead) => {
    toast({
      title: lead.companyName,
      description: `Status: ${lead.status} • Score: ${lead.score}`,
    });
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    const dbStatus = mapUIStatusToDBStatus(newStatus);
    updateStatusMutation.mutate({ id: leadId, status: dbStatus });
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
    <div className="p-8 space-y-6">
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

      <KanbanBoard 
        leads={leads} 
        onLeadClick={handleLeadClick}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default Pipeline;
