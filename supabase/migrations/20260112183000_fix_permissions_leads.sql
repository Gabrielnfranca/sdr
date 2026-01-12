
-- Garantir permissões básicas no Schema Public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Garantir permissões totais na tabela LEADS para os usuários autenticados
GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;

-- Garantir acesso à sequência (para criar novos IDs se necessário)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Reforçar a política de segurança (apenas para garantir)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
