-- Create email_templates table for SDR Decision Engine
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  site_classification public.site_classification,
  message_type text NOT NULL CHECK (message_type IN ('initial', 'follow_up_1', 'follow_up_2')),
  is_default boolean DEFAULT false,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Tenants can manage own templates"
ON public.email_templates
FOR ALL
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for each classification
-- Templates for leads WITHOUT site (sem_site)
INSERT INTO public.email_templates (tenant_id, name, subject, body, site_classification, message_type, is_default, variables)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Sem Site - Contato Inicial',
  'Sua empresa {{company_name}} precisa de presença online',
  E'Olá!\n\nNotei que a {{company_name}} ainda não tem um site próprio. No mercado atual, ter presença online é essencial para:\n\n• Ser encontrado por novos clientes no Google\n• Transmitir credibilidade e profissionalismo\n• Receber contatos 24 horas por dia\n\nPosso criar um site profissional para você com investimento acessível.\n\nGostaria de saber mais?\n\nSe não quiser receber mais mensagens, é só responder "remover".',
  'sem_site',
  'initial',
  true,
  '["company_name", "segment", "city"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE site_classification = 'sem_site' AND message_type = 'initial');

INSERT INTO public.email_templates (tenant_id, name, subject, body, site_classification, message_type, is_default, variables)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Sem Site - Follow-up 1',
  'Re: Presença online para {{company_name}}',
  E'Olá novamente!\n\nEnviei uma mensagem há alguns dias sobre criar um site para a {{company_name}}.\n\nSei que você deve estar ocupado, mas queria reforçar: seus concorrentes que têm site estão aparecendo no Google quando clientes buscam por "{{segment}} em {{city}}".\n\nTenho algumas ideias que podem funcionar bem para o seu negócio. Podemos conversar rapidamente?\n\nSe não quiser receber mais mensagens, é só responder "remover".',
  'sem_site',
  'follow_up_1',
  true,
  '["company_name", "segment", "city"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE site_classification = 'sem_site' AND message_type = 'follow_up_1');

-- Templates for leads with WEAK site (site_fraco)
INSERT INTO public.email_templates (tenant_id, name, subject, body, site_classification, message_type, is_default, variables)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Site Fraco - Contato Inicial',
  'Melhorias para o site da {{company_name}}',
  E'Olá!\n\nAnalisei o site da {{company_name}} e identifiquei algumas oportunidades de melhoria:\n\n• O site está lento (isso afasta visitantes)\n• Não está adaptado para celular\n• Difícil de encontrar no Google\n\nUm site otimizado pode aumentar suas vendas significativamente.\n\nPosso mostrar um diagnóstico completo sem compromisso?\n\nSe não quiser receber mais mensagens, é só responder "remover".',
  'site_fraco',
  'initial',
  true,
  '["company_name", "website", "segment"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE site_classification = 'site_fraco' AND message_type = 'initial');

-- Templates for leads with site WITHOUT SEO (site_sem_seo)
INSERT INTO public.email_templates (tenant_id, name, subject, body, site_classification, message_type, is_default, variables)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Sem SEO - Contato Inicial',
  '{{company_name}} não aparece no Google - posso ajudar',
  E'Olá!\n\nFiz uma análise rápida e percebi que o site da {{company_name}} não está aparecendo nas buscas do Google para termos como "{{segment}} em {{city}}".\n\nIsso significa que potenciais clientes estão encontrando seus concorrentes em vez de você.\n\nCom algumas otimizações de SEO, podemos mudar isso. Tenho um plano de ação que pode colocar você na primeira página.\n\nQuer que eu explique como funciona?\n\nSe não quiser receber mais mensagens, é só responder "remover".',
  'site_sem_seo',
  'initial',
  true,
  '["company_name", "website", "segment", "city"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE site_classification = 'site_sem_seo' AND message_type = 'initial');

-- Templates for leads with OK site (site_ok) - focus on improvements
INSERT INTO public.email_templates (tenant_id, name, subject, body, site_classification, message_type, is_default, variables)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Site OK - Contato Inicial',
  'Oportunidades de crescimento para {{company_name}}',
  E'Olá!\n\nParabéns pelo site da {{company_name}}! Ele está bem estruturado.\n\nAnalisando mais a fundo, identifiquei algumas oportunidades para aumentar ainda mais seus resultados:\n\n• Otimizações de conversão\n• Melhorias de velocidade\n• Estratégias de SEO avançadas\n\nGostaria de uma análise detalhada sem compromisso?\n\nSe não quiser receber mais mensagens, é só responder "remover".',
  'site_ok',
  'initial',
  true,
  '["company_name", "website"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE site_classification = 'site_ok' AND message_type = 'initial');