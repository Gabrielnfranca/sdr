import { supabase } from "@/integrations/supabase/client";

// Types
export interface Lead {
  id: string;
  tenant_id: string;
  company_name: string;
  segment: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  status: LeadStatus;
  site_classification: SiteClassification | null;
  score: number;
  site_active: boolean | null;
  site_performance_score: number | null;
  site_indexed: boolean | null;
  site_analysis_date: string | null;
  source: LeadSource;
  automation_paused: boolean;
  contact_attempts: number;
  last_contact_date: string | null;
  opted_out: boolean;
  opted_out_date: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 
  | "lead_novo"
  | "contato_automatico_enviado"
  | "follow_up_1"
  | "follow_up_2"
  | "lead_engajado"
  | "lead_com_interesse"
  | "atendimento_humano"
  | "perdido";

export type SiteClassification = 
  | "sem_site"
  | "site_fraco"
  | "site_sem_seo"
  | "site_ok";

export type LeadSource = "google_maps" | "csv_import" | "manual";

export interface ImportResult {
  success: boolean;
  imported?: number;
  duplicates?: number;
  errors?: string[];
  error?: string;
}

export interface AnalysisResult {
  success: boolean;
  site_active?: boolean;
  site_performance_score?: number;
  site_indexed?: boolean;
  site_classification?: SiteClassification;
  error?: string;
}

export interface InterestResult {
  success: boolean;
  interest_detected?: boolean;
  opted_out?: boolean;
  interest_keywords?: string[];
  confidence?: number;
  error?: string;
}

export interface SDRDecision {
  lead_id: string;
  template_id: string;
  message_type: "initial" | "follow_up_1" | "follow_up_2";
  subject: string;
  body: string;
  to_email: string | null;
  next_status: LeadStatus;
  classification: SiteClassification;
  ai_personalized: boolean;
}

export interface SDRDecisionResult {
  success: boolean;
  decision?: SDRDecision;
  error?: string;
}

// API Functions
export async function importLeads(leads: Partial<Lead>[], source: LeadSource = "csv_import"): Promise<ImportResult> {
  const { data, error } = await supabase.functions.invoke("import-leads", {
    body: { leads, source },
  });

  if (error) {
    console.error("Import error:", error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function analyzeSite(leadId: string): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-site", {
    body: { lead_id: leadId },
  });

  if (error) {
    console.error("Analysis error:", error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function analyzeSitesBatch(limit = 10): Promise<{ success: boolean; analyzed?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke("analyze-site", {
    body: { batch: true, limit },
  });

  if (error) {
    console.error("Batch analysis error:", error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function detectInterest(leadId: string, message: string, channel = "email"): Promise<InterestResult> {
  const { data, error } = await supabase.functions.invoke("detect-interest", {
    body: { lead_id: leadId, message, channel },
  });

  if (error) {
    console.error("Interest detection error:", error);
    return { success: false, error: error.message };
  }

  return data;
}

// SDR Decision Engine - Chooses templates and personalizes messages
export async function getSDRDecision(
  leadId: string, 
  options?: { 
    messageType?: "initial" | "follow_up_1" | "follow_up_2";
    useAIPersonalization?: boolean;
  }
): Promise<SDRDecisionResult> {
  const { data, error } = await supabase.functions.invoke("sdr-decision-engine", {
    body: { 
      lead_id: leadId, 
      message_type: options?.messageType,
      use_ai_personalization: options?.useAIPersonalization ?? false,
    },
  });

  if (error) {
    console.error("SDR Decision error:", error);
    return { success: false, error: error.message };
  }

  return data;
}

// Lead CRUD operations
export async function getLeads(filters?: { status?: LeadStatus; limit?: number }): Promise<Lead[]> {
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching leads:", error);
    return [];
  }

  return data as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching lead:", error);
    return null;
  }

  return data as Lead | null;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<boolean> {
  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Error updating lead:", error);
    return false;
  }

  return true;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  return updateLead(id, { status });
}

export async function deleteLead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting lead:", error);
    return false;
  }

  return true;
}

export async function deleteLeads(ids: string[]): Promise<boolean> {
  const { error } = await supabase
    .from("leads")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("Error deleting leads:", error);
    return false;
  }

  return true;
}

// Parse CSV to lead objects
export function parseCSV(csvText: string): Partial<Lead>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const leads: Partial<Lead>[] = [];

  // Map common header variations
  const headerMap: Record<string, keyof Lead> = {
    "empresa": "company_name",
    "nome": "company_name",
    "company": "company_name",
    "company_name": "company_name",
    "razao_social": "company_name",
    "razão social": "company_name",
    "segmento": "segment",
    "segment": "segment",
    "ramo": "segment",
    "cidade": "city",
    "city": "city",
    "estado": "state",
    "state": "state",
    "uf": "state",
    "email": "email",
    "e-mail": "email",
    "telefone": "phone",
    "phone": "phone",
    "tel": "phone",
    "whatsapp": "whatsapp",
    "wpp": "whatsapp",
    "zap": "whatsapp",
    "site": "website",
    "website": "website",
    "url": "website",
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    const lead: Partial<Lead> = {};

    headers.forEach((header, index) => {
      const mappedKey = headerMap[header];
      if (mappedKey && values[index]) {
        (lead as any)[mappedKey] = values[index];
      }
    });

    if (lead.company_name) {
      leads.push(lead);
    }
  }

  return leads;
}

export async function searchLeads(query: string, limit: number = 20, siteFilter: 'all' | 'with_site' | 'without_site' = 'all') {
  try {
    const { data, error } = await supabase.functions.invoke('search-leads', {
      body: { query, limit, siteFilter },
    });

    if (error) {
       // Log the raw error for debugging
       console.error("Supabase Function Error Details:", error);
       
       // Se o erro for do tipo "non-2xx", tente pegar mais detalhes se possível ou apenas repasse
       if (error instanceof Error && error.message.includes('non-2xx')) {
          // Instead of masking it, we throw a more descriptive error if we can, 
          // but mostly we want the UI to show that it failed specifically.
          // Let's stop overriding the message so we can see if it's 401, 500, etc.
          throw new Error(`Erro de Conexão (${error.message || '500'}). Verifique se o projeto está ativo.`);
       }
       throw error;
    }
    
    if (data && data.success === false) {
      throw new Error(data.error || "Erro desconhecido na busca");
    }

    return data;
  } catch (err: any) {
    console.error("Falha ao invocar search-leads:", err);
    throw err;
  }
}

export async function autoProspect(limit: number = 5) {
  const { data, error } = await supabase.functions.invoke('auto-prospect', {
    body: { limit },
  });

  if (error) throw error;
  return data;
}

export interface EmailStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complaint: number;
}

export async function getEmailStats(): Promise<EmailStats> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('status');

  if (error) {
    console.error('Error fetching email stats:', error);
    return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complaint: 0 };
  }

  const stats = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complaint: 0
  };

  data.forEach((log: any) => {
    if (stats.hasOwnProperty(log.status)) {
      stats[log.status as keyof EmailStats]++;
    }
  });

  return stats;
}

export interface EmailLog {
  id: string;
  lead_id: string;
  email_address: string;
  subject: string;
  status: string;
  sent_at: string;
  opened_at: string | null;
  error_message: string | null;
}

export async function getEmailLogs(): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching email logs:', error);
    return [];
  }

  return data as EmailLog[];
}
