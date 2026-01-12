import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  importLeads, 
  analyzeSite, 
  analyzeSitesBatch, 
  detectInterest,
  getSDRDecision,
  parseCSV,
  deleteLeads,
  autoProspect,
  getEmailStats,
  getEmailLogs,
  type Lead,
  type LeadStatus,
  type LeadSource,
  type SDRDecisionResult,
  type EmailStats,
  type EmailLog
} from '@/lib/api';

export type { Lead, LeadStatus, LeadSource, SDRDecisionResult, EmailStats, EmailLog } from '@/lib/api';

// Fetch all leads
export function useLeads(filters?: { status?: LeadStatus; limit?: number }) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }

      return data as Lead[];
    },
  });
}

// Fetch a single lead
export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Lead | null;
    },
    enabled: !!id,
  });
}

// Import leads mutation
export function useImportLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ csvText, source }: { csvText: string; source?: LeadSource }) => {
      const leads = parseCSV(csvText);
      if (leads.length === 0) {
        throw new Error('Nenhum lead válido encontrado no CSV');
      }
      return importLeads(leads, source);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.imported} leads importados com sucesso!`);
        if (result.duplicates && result.duplicates > 0) {
          toast.info(`${result.duplicates} leads duplicados ignorados`);
        }
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } else {
        toast.error(result.error || 'Erro ao importar leads');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update lead status
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });
}

// Analyze site mutation
export function useAnalyzeSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeSite,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Site analisado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } else {
        toast.error(result.error || 'Erro ao analisar site');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Batch analyze sites
export function useAnalyzeSitesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit?: number) => analyzeSitesBatch(limit),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.analyzed} sites analisados!`);
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } else {
        toast.error(result.error || 'Erro ao analisar sites');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Detect interest mutation
export function useDetectInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, message, channel }: { leadId: string; message: string; channel?: string }) =>
      detectInterest(leadId, message, channel),
    onSuccess: (result) => {
      if (result.success) {
        if (result.interest_detected) {
          toast.success('🔥 Interesse detectado! Tarefa criada para atendimento humano.');
        } else if (result.opted_out) {
          toast.info('Lead optou por não receber mais mensagens.');
        }
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } else {
        toast.error(result.error || 'Erro ao analisar mensagem');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Get leads stats
export function useLeadStats() {
  return useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('status, site_classification');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byStatus: {} as Record<string, number>,
        byClassification: {} as Record<string, number>,
      };

      data?.forEach((lead) => {
        stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
        if (lead.site_classification) {
          stats.byClassification[lead.site_classification] = 
            (stats.byClassification[lead.site_classification] || 0) + 1;
        }
      });

      return stats;
    },
  });
}

// Create lead manually
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          company_name: lead.company_name || '',
          segment: lead.segment,
          city: lead.city,
          state: lead.state,
          email: lead.email,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          website: lead.website,
          tenant_id: user.id,
          source: 'manual' as const,
          status: 'lead_novo' as const,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lead criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar lead: ' + error.message);
    },
  });
}

// Get SDR Decision for a lead
export function useSDRDecision() {
  return useMutation({
    mutationFn: ({ 
      leadId, 
      messageType, 
      useAIPersonalization 
    }: { 
      leadId: string; 
      messageType?: 'initial' | 'follow_up_1' | 'follow_up_2';
      useAIPersonalization?: boolean;
    }) => getSDRDecision(leadId, { messageType, useAIPersonalization }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Decisão SDR gerada com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao gerar decisão SDR');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar decisão: ' + error.message);
    },
  });
}

// Delete leads mutation
export function useDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const success = await deleteLeads(ids);
      if (!success) throw new Error('Falha ao excluir leads');
      return success;
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.length} lead(s) excluído(s) com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir leads: ' + error.message);
    },
  });
}

// Auto prospect mutation
export function useAutoProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit?: number) => autoProspect(limit),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.processed} leads processados e contatados!`);
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } else {
        toast.error(result.error || 'Erro na prospecção automática');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao executar prospecção: ' + error.message);
    },
  });
}

// Get email stats
export function useEmailStats() {
  return useQuery({
    queryKey: ['email-stats'],
    queryFn: getEmailStats,
  });
}

// Get email logs
export function useEmailLogs() {
  return useQuery({
    queryKey: ['email-logs'],
    queryFn: getEmailLogs,
  });
}
