alter table public.venue_role_config
  add column if not exists department text not null default 'Floor',
  add column if not exists enabled boolean not null default true,
  add column if not exists is_custom boolean not null default false;
