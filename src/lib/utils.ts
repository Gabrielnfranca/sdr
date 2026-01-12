import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Lead as UILead, LeadStatus, LeadClassification } from '@/types/lead';
import { Lead as DBLead, LeadStatus as DBLeadStatus } from '@/lib/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const mapSupabaseLeadToUILead = (dbLead: DBLead): UILead => {
  const statusMap: Record<string, LeadStatus> = {
    'lead_novo': 'novo',
    'contato_automatico_enviado': 'contato_enviado',
    'follow_up_1': 'followup_1',
    'follow_up_2': 'followup_2',
    'lead_engajado': 'engajado',
    'lead_com_interesse': 'interesse',
    'atendimento_humano': 'atendimento_humano',
    'perdido': 'perdido'
  };

  const classificationMap: Record<string, LeadClassification> = {
    'sem_site': 'sem_site',
    'site_fraco': 'site_ruim',
    'site_sem_seo': 'site_sem_seo',
    'site_ok': 'site_ok'
  };

  // Extract address from notes if available
  let address = dbLead.city || 'Não informado';
  if (dbLead.notes && dbLead.notes.includes('Endereço Completo:')) {
    const match = dbLead.notes.match(/Endereço Completo: (.*?)(?:\n|$)/);
    if (match) {
      address = match[1];
    }
  }

  return {
    id: dbLead.id,
    companyName: dbLead.company_name,
    segment: dbLead.segment || 'Não informado',
    city: dbLead.city || 'Não informado',
    address: address,
    email: dbLead.email || '',
    phone: dbLead.phone || undefined,
    whatsapp: dbLead.whatsapp || undefined,
    website: dbLead.website || undefined,
    status: statusMap[dbLead.status] || 'novo',
    classification: (dbLead.site_classification ? classificationMap[dbLead.site_classification] : (dbLead.website ? 'pendente' : 'sem_site')),
    origin: dbLead.source,
    tags: dbLead.tags || [],
    createdAt: new Date(dbLead.created_at),
    lastContactAt: dbLead.last_contact_date ? new Date(dbLead.last_contact_date) : undefined,
    score: dbLead.score || 0
  };
};

export const mapUIStatusToDBStatus = (uiStatus: LeadStatus): DBLeadStatus => {
  const map: Record<LeadStatus, DBLeadStatus> = {
      'novo': 'lead_novo',
      'contato_enviado': 'contato_automatico_enviado',
      'followup_1': 'follow_up_1',
      'followup_2': 'follow_up_2',
      'engajado': 'lead_engajado',
      'interesse': 'lead_com_interesse',
      'atendimento_humano': 'atendimento_humano',
      'perdido': 'perdido'
  };
  return map[uiStatus] || 'lead_novo';
}
