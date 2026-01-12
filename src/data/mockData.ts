import { Lead, Campaign, LeadStatus } from '@/types/lead';

export const mockLeads: Lead[] = [];

export const mockCampaigns: Campaign[] = [];

export const getLeadsByStatus = (status: LeadStatus): Lead[] => {
  return mockLeads.filter(lead => lead.status === status);
};

export const getDashboardMetrics = () => ({
  totalLeads: mockLeads.length,
  newLeads: mockLeads.filter(l => l.status === 'novo').length,
  inProgress: mockLeads.filter(l => ['contato_enviado', 'followup_1', 'followup_2', 'engajado'].includes(l.status)).length,
  interested: mockLeads.filter(l => l.status === 'interesse').length,
  humanAttention: mockLeads.filter(l => l.status === 'atendimento_humano').length,
  lost: mockLeads.filter(l => l.status === 'perdido').length,
  conversionRate: 15.8,
  avgResponseTime: '4.2h',
});
