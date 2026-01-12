create type email_status as enum ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complaint');

create table email_logs (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete set null,
  email_address text not null,
  subject text,
  status email_status default 'sent',
  sent_at timestamp with time zone default now(),
  opened_at timestamp with time zone,
  error_message text,
  metadata jsonb
);

-- Índices para evitar duplicidade e acelerar consultas
create index idx_email_logs_lead_id on email_logs(lead_id);
create index idx_email_logs_email on email_logs(email_address);
create index idx_email_logs_status on email_logs(status);

-- RLS (Row Level Security)
alter table email_logs enable row level security;

create policy "Users can view their own email logs"
  on email_logs for select
  using (auth.uid() in (
    select tenant_id from leads where id = email_logs.lead_id
  ));

create policy "Service role can insert logs"
  on email_logs for insert
  with check (true);

create policy "Service role can update logs"
  on email_logs for update
  using (true);
