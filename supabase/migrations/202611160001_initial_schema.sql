create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'member' check (role in ('admin', 'client_relations', 'creative', 'finance', 'member')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create or replace function public.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_active
      and role = any(allowed_roles)
  );
$$;

revoke all on function public.is_active_member() from public;
revoke all on function public.has_role(text[]) from public;
grant execute on function public.is_active_member() to authenticated;
grant execute on function public.has_role(text[]) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organization text not null default '',
  email text,
  phone text,
  location text not null default 'Davao City',
  preferred_contact text not null default 'Messenger',
  notes text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organization text not null default '',
  email text,
  phone text,
  location text not null default 'Davao City',
  requested_service text not null,
  source text not null default 'Referral',
  status text not null default 'New inquiry'
    check (status in ('New inquiry', 'Contacted', 'Quoted', 'Won', 'Not proceeding')),
  owner_id uuid references public.profiles(id) on delete set null,
  follow_up_on date,
  notes text not null default '',
  converted_client_id uuid references public.clients(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  is_physical boolean not null default false,
  active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  source_lead_id uuid references public.leads(id) on delete set null,
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  title text not null,
  status text not null default 'Confirmed'
    check (status in ('Inquiry', 'Quoted', 'Confirmed', 'Briefing', 'In design', 'Client review', 'Revision', 'Approved', 'With print partner', 'Ready for delivery', 'Completed', 'On hold', 'Cancelled')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  owner_id uuid references public.profiles(id) on delete set null,
  due_date date,
  brief text not null default '',
  deliverables text not null default '',
  internal_notes text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  order_id uuid references public.orders(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_on date,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_id is not null or lead_id is not null)
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number bigint generated always as identity unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  service_summary text not null,
  amount_php numeric(12, 2) not null check (amount_php >= 0),
  status text not null default 'Draft'
    check (status in ('Draft', 'Sent', 'Accepted', 'Declined', 'Expired')),
  valid_until date,
  assumptions text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null default '',
  email text,
  phone text,
  location text not null default '',
  capabilities text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.production_handoffs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete restrict,
  status text not null default 'Preparing files'
    check (status in ('Preparing files', 'Sent to partner', 'Awaiting proof', 'In production', 'Quality check', 'Ready', 'Delivered', 'Issue reported')),
  specifications text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  promised_date date,
  tracking_reference text not null default '',
  quality_notes text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  version integer not null check (version > 0),
  file_path text not null,
  file_name text not null,
  status text not null default 'Shared for review'
    check (status in ('Shared for review', 'Revision requested', 'Approved')),
  client_feedback text not null default '',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  unique (order_id, version)
);

create table public.partner_risks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  category text not null check (category in ('Schedule delay', 'Print quality', 'Color variance', 'Communication', 'Cost change', 'Other')),
  summary text not null,
  severity text not null default 'Medium' check (severity in ('Low', 'Medium', 'High')),
  status text not null default 'Open' check (status in ('Open', 'Monitoring', 'Resolved')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.b2b_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  contact_name text not null,
  email text,
  phone text,
  location text not null default '',
  work_type text not null,
  backlog_volume text not null default '',
  status text not null default 'Prospecting'
    check (status in ('Prospecting', 'Contacted', 'Scoping', 'Trial project', 'Ongoing', 'Closed')),
  owner_id uuid references public.profiles(id) on delete set null,
  next_action text not null default '',
  notes text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.log_entity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_id uuid;
begin
  entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.activity_log (actor_id, entity_type, entity_id, action, summary)
  values ((select auth.uid()), tg_table_name, entity_id, lower(tg_op), tg_table_name || ' ' || lower(tg_op));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.convert_lead_to_client(lead_uuid uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  lead_record public.leads%rowtype;
  client_uuid uuid;
begin
  if not public.is_active_member() then
    raise exception 'An active team membership is required.';
  end if;

  select * into lead_record
  from public.leads
  where id = lead_uuid
  for update;

  if not found then
    raise exception 'Lead not found.';
  end if;

  if lead_record.status <> 'Won' then
    raise exception 'Only a won lead can be converted to a client.';
  end if;

  if lead_record.converted_client_id is not null then
    return lead_record.converted_client_id;
  end if;

  insert into public.clients (
    full_name, organization, email, phone, location, preferred_contact, notes, created_by
  )
  values (
    lead_record.full_name, lead_record.organization, lead_record.email, lead_record.phone,
    lead_record.location, 'Messenger', lead_record.notes, (select auth.uid())
  )
  returning id into client_uuid;

  update public.leads
  set converted_client_id = client_uuid
  where id = lead_uuid;

  return client_uuid;
end;
$$;

revoke all on function public.convert_lead_to_client(uuid) from public;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;

create index clients_location_idx on public.clients (location);
create index leads_status_follow_up_idx on public.leads (status, follow_up_on);
create index leads_owner_idx on public.leads (owner_id);
create index orders_status_due_idx on public.orders (status, due_date);
create index orders_client_idx on public.orders (client_id);
create index tasks_assignee_due_idx on public.tasks (assignee_id, due_on) where completed_at is null;
create index quotations_client_status_idx on public.quotations (client_id, status);
create index handoffs_status_date_idx on public.production_handoffs (status, promised_date);
create index proofs_order_version_idx on public.proofs (order_id, version desc);
create index partner_risks_status_idx on public.partner_risks (status, severity);
create index b2b_status_owner_idx on public.b2b_opportunities (status, owner_id);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'clients', 'leads', 'catalog_items', 'orders', 'tasks',
    'quotations', 'partners', 'production_handoffs', 'b2b_opportunities'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', table_name);
  end loop;
end;
$$;

create trigger log_lead_changes after insert or update or delete on public.leads
  for each row execute procedure public.log_entity_change();
create trigger log_order_changes after insert or update or delete on public.orders
  for each row execute procedure public.log_entity_change();
create trigger log_proof_changes after insert or update or delete on public.proofs
  for each row execute procedure public.log_entity_change();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.catalog_items enable row level security;
alter table public.orders enable row level security;
alter table public.tasks enable row level security;
alter table public.quotations enable row level security;
alter table public.partners enable row level security;
alter table public.production_handoffs enable row level security;
alter table public.proofs enable row level security;
alter table public.partner_risks enable row level security;
alter table public.b2b_opportunities enable row level security;
alter table public.activity_log enable row level security;

create policy "Profiles are visible to self or admins"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.has_role(array['admin'])) or (select public.is_active_member()));
create policy "Admins manage profiles"
  on public.profiles for update to authenticated
  using ((select public.has_role(array['admin'])))
  with check ((select public.has_role(array['admin'])));

create policy "Active members access clients"
  on public.clients for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access leads"
  on public.leads for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access catalog"
  on public.catalog_items for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access orders"
  on public.orders for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access tasks"
  on public.tasks for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Sales and finance roles access quotations"
  on public.quotations for select to authenticated
  using ((select public.has_role(array['admin', 'client_relations', 'finance'])));
create policy "Sales and finance roles manage quotations"
  on public.quotations for insert to authenticated
  with check ((select public.has_role(array['admin', 'client_relations', 'finance'])));
create policy "Sales and finance roles update quotations"
  on public.quotations for update to authenticated
  using ((select public.has_role(array['admin', 'client_relations', 'finance'])))
  with check ((select public.has_role(array['admin', 'client_relations', 'finance'])));
create policy "Admins delete quotations"
  on public.quotations for delete to authenticated
  using ((select public.has_role(array['admin'])));
create policy "Active members access partners"
  on public.partners for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access production handoffs"
  on public.production_handoffs for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access proofs"
  on public.proofs for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access partner risks"
  on public.partner_risks for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members access B2B opportunities"
  on public.b2b_opportunities for all to authenticated
  using ((select public.is_active_member()))
  with check ((select public.is_active_member()));
create policy "Active members read activity"
  on public.activity_log for select to authenticated
  using ((select public.is_active_member()));

grant select, insert, update on public.clients, public.leads, public.catalog_items,
  public.orders, public.tasks, public.partners, public.production_handoffs,
  public.proofs, public.partner_risks, public.b2b_opportunities to authenticated;
grant select, insert, update, delete on public.quotations to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.activity_log to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-files',
  'proof-files',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Active members view proof files"
  on storage.objects for select to authenticated
  using (bucket_id = 'proof-files' and (select public.is_active_member()));
create policy "Active members upload proof files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proof-files'
    and (select public.is_active_member())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Active members update proof files"
  on storage.objects for update to authenticated
  using (bucket_id = 'proof-files' and (select public.is_active_member()))
  with check (bucket_id = 'proof-files' and (select public.is_active_member()));
create policy "Members delete their own proof files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'proof-files'
    and (select public.is_active_member())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Admins delete proof files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'proof-files' and (select public.has_role(array['admin'])));
