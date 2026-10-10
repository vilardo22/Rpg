-- Imita o mínimo do Supabase para testar as migrations num Postgres local (PGlite):
-- os papéis anon/authenticated/service_role, a tabela auth.users e as funções
-- auth.uid()/auth.role(), que no Supabase leem o token (JWT) da requisição.
-- Aqui elas leem configurações que os testes definem com set_config.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'
);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- Como no Supabase: tabelas e funções novas nascem liberadas para os três papéis.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
