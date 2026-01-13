export type LeadStatus = 
  | 'novo'
  | 'contato_enviado'
  | 'followup_1'
  | 'followup_2'
  | 'engajado'
  | 'interesse'
  | 'atendimento_humano'
  | 'perdido';

export type LeadClassification = 
  | 'sem_site'
  | 'site_ruim'
  | 'site_sem_seo'
  | 'site_ok'
  | 'pendente';

export type LeadChannel = 'email' | 'whatsapp';

export interface Lead {
  id: string;
  companyName: string;
  segment: string;
  city: string;
  address?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  status: LeadStatus;
  classification: LeadClassification;
  origin: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  lastContactAt?: Date;
  score: number;
  position?: number;
}

export interface Interaction {
  id: string;
  leadId: string;
  channel: LeadChannel;
  message: string;
  response?: string;
  date: Date;
  isAutomatic: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  leadsCount: number;
  sentCount: number;
  openRate: number;
  replyRate: number;
  createdAt: Date;
}

export const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  novo: { label: 'Lead Novo', color: 'text-info', bgColor: 'bg-info/10' },
  contato_enviado: { label: 'Contato Enviado', color: 'text-primary', bgColor: 'bg-primary/10' },
  followup_1: { label: 'Follow-up 1', color: 'text-warning', bgColor: 'bg-warning/10' },
  followup_2: { label: 'Follow-up 2', color: 'text-warning', bgColor: 'bg-warning/10' },
  engajado: { label: 'Engajado', color: 'text-accent', bgColor: 'bg-accent/10' },
  interesse: { label: 'Com Interesse', color: 'text-success', bgColor: 'bg-success/10' },
  atendimento_humano: { label: 'Atendimento Humano', color: 'text-success', bgColor: 'bg-success/10' },
  perdido: { label: 'Perdido', color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export const CLASSIFICATION_CONFIG: Record<LeadClassification, { label: string; color: string }> = {
  sem_site: { label: 'Sem Site', color: 'text-destructive' },
  site_ruim: { label: 'Site Ruim', color: 'text-warning' },
  site_sem_seo: { label: 'Sem SEO', color: 'text-info' },
  site_ok: { label: 'Site OK', color: 'text-success' },
  pendente: { label: 'Analisando...', color: 'text-muted-foreground' },
};
