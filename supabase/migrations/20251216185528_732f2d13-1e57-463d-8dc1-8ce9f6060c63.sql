-- Enum para status do lead no funil
CREATE TYPE public.lead_status AS ENUM (
  'lead_novo',
  'contato_automatico_enviado',
  'follow_up_1',
  'follow_up_2',
  'lead_engajado',
  'lead_com_interesse',
  'atendimento_humano',
  'perdido'
);

-- Enum para classificação do site
CREATE TYPE public.site_classification AS ENUM (
  'sem_site',
  'site_fraco',
  'site_sem_seo',
  'site_ok'
);

-- Enum para fonte do lead
CREATE TYPE public.lead_source AS ENUM (
  'google_maps',
  'csv_import',
  'manual'
);

-- Tabela principal de leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Dados da empresa
  company_name TEXT NOT NULL,
  segment TEXT,
  city TEXT,
  state TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  
  -- Classificação e status
  status lead_status NOT NULL DEFAULT 'lead_novo',
  site_classification site_classification,
  score INTEGER DEFAULT 0,
  
  -- Análise do site
  site_active BOOLEAN,
  site_performance_score INTEGER,
  site_indexed BOOLEAN,
  site_analysis_date TIMESTAMP WITH TIME ZONE,
  
  -- Controle de automação
  source lead_source NOT NULL DEFAULT 'manual',
  automation_paused BOOLEAN DEFAULT false,
  contact_attempts INTEGER DEFAULT 0,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  opted_out BOOLEAN DEFAULT false,
  opted_out_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para isolamento multi-tenant
CREATE POLICY "Tenants can view own leads" ON public.leads
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert own leads" ON public.leads
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update own leads" ON public.leads
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete own leads" ON public.leads
  FOR DELETE USING (tenant_id = auth.uid());

-- Tabela de histórico de contatos
CREATE TABLE public.contact_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  channel TEXT NOT NULL, -- 'email', 'whatsapp'
  message_type TEXT NOT NULL, -- 'initial', 'follow_up_1', 'follow_up_2', 'response', 'interest_detected'
  direction TEXT NOT NULL, -- 'outbound', 'inbound'
  
  subject TEXT,
  content TEXT,
  
  -- Status do envio
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Análise de resposta
  response_content TEXT,
  interest_detected BOOLEAN DEFAULT false,
  interest_keywords TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_logs_lead ON public.contact_logs(lead_id);
CREATE INDEX idx_contact_logs_tenant ON public.contact_logs(tenant_id);

ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own contact logs" ON public.contact_logs
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert own contact logs" ON public.contact_logs
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Tabela de campanhas/automações
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  
  -- Configurações
  target_segment TEXT,
  target_city TEXT,
  
  -- Templates de mensagem
  initial_email_template TEXT,
  follow_up_1_template TEXT,
  follow_up_2_template TEXT,
  
  -- Intervalos (em horas)
  follow_up_1_delay INTEGER DEFAULT 72,
  follow_up_2_delay INTEGER DEFAULT 120,
  
  -- Métricas
  leads_count INTEGER DEFAULT 0,
  contacts_sent INTEGER DEFAULT 0,
  responses_received INTEGER DEFAULT 0,
  interests_detected INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage own campaigns" ON public.campaigns
  FOR ALL USING (tenant_id = auth.uid());

-- Tabela de tarefas para atendimento humano
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- 'follow_up', 'call', 'meeting', 'proposal'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage own tasks" ON public.tasks
  FOR ALL USING (tenant_id = auth.uid());

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();