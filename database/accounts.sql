-- =========================================================
-- 生活助手 — account database (account name + password)
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- What it makes:
--   elder_accounts        the table: name, scrambled password, dates
--   elder_register()      the app calls this to create an account
--   elder_login()         the app calls this to sign in
--   elder_accounts_list   a list you can read: names and dates, NO passwords
--
-- Passwords are never stored as readable text. They are scrambled with
-- bcrypt, so nobody — not you, not Claude, not someone who steals the
-- table — can read them back. The app's public key cannot read the table
-- at all; it can only call the two functions.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.elder_accounts (
  name          text primary key check (char_length(name) between 2 and 20),
  password_hash text not null,
  created_at    timestamptz not null default now(),
  last_login    timestamptz
);

-- Row-level security on, with no policies: the public (anon) key cannot
-- select, insert, update or delete rows directly.
alter table public.elder_accounts enable row level security;

create unique index if not exists elder_accounts_name_lower on public.elder_accounts (lower(name));

-- Create an account. Returns {"ok": true, "name": …} or {"ok": false, "error": "taken" | "invalid"}.
create or replace function public.elder_register(p_name text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := btrim(p_name);
begin
  if char_length(v_name) < 2 or char_length(v_name) > 20
     or char_length(p_password) < 4 or char_length(p_password) > 72 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;
  if exists (select 1 from elder_accounts where lower(name) = lower(v_name)) then
    return json_build_object('ok', false, 'error', 'taken');
  end if;
  insert into elder_accounts (name, password_hash, last_login)
  values (v_name, crypt(p_password, gen_salt('bf', 10)), now());
  return json_build_object('ok', true, 'name', v_name);
end;
$$;

-- Sign in. Returns {"ok": true, "name": …} or {"ok": false, "error": "wrong"}.
-- The same answer for "no such name" and "wrong password", so names can't be probed.
create or replace function public.elder_login(p_name text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row elder_accounts%rowtype;
begin
  select * into v_row from elder_accounts where lower(name) = lower(btrim(p_name));
  if not found or v_row.password_hash <> crypt(p_password, v_row.password_hash) then
    return json_build_object('ok', false, 'error', 'wrong');
  end if;
  update elder_accounts set last_login = now() where name = v_row.name;
  return json_build_object('ok', true, 'name', v_row.name);
end;
$$;

revoke all on function public.elder_register(text, text) from public;
revoke all on function public.elder_login(text, text) from public;
grant execute on function public.elder_register(text, text) to anon, authenticated;
grant execute on function public.elder_login(text, text) to anon, authenticated;

-- The list for checking who has an account: names and dates only, never the password.
-- It is readable with the app's public key, so anyone who has that key can see
-- the account names (the leaderboard already shows names).
create or replace view public.elder_accounts_list as
  select name, created_at, last_login from public.elder_accounts order by created_at desc;
grant select on public.elder_accounts_list to anon, authenticated;
