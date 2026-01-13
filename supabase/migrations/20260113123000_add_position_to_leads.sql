alter table public.leads
add column position double precision default 0;

-- Create an index for faster ordering
create index leads_position_idx on public.leads(position);
