
-- Tabela LEADS
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references auth.users(id) not null,
  company_name text not null,
  segment text,
  city text,
  state text,
  email text,
  phone text,
  whatsapp text,
  website text,
  status text default 'lead_novo',
  site_classification text,
  score numeric default 0,
  site_active boolean,
  site_performance_score numeric,
  site_indexed boolean,
  site_analysis_date timestamptz,
  source text,
  automation_paused boolean default false,
  contact_attempts numeric default 0,
  last_contact_date timestamptz,
  opted_out boolean default false,
  opted_out_date timestamptz,
  tags text[],
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativar RLS
alter table public.leads enable row level security;

-- Política de Segurança (Permitir tudo para o dono)
do $$
begin
  if not exists (
    select from pg_catalog.pg_policies 
    where schemaname = 'public' 
    and tablename = 'leads' 
    and policyname = 'Users can do everything on their own leads'
  ) then
    create policy "Users can do everything on their own leads"
      on public.leads for all
      using (auth.uid() = tenant_id)
      with check (auth.uid() = tenant_id);
  end if;
end
$$;
