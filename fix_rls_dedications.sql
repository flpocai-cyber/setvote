-- ============================================================
-- FIX: Habilitar RLS na tabela `dedications`
-- Corrige alerta de segurança: "Table publicly accessible"
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Garante que a tabela existe com a estrutura correta
create table if not exists public.dedications (
  id uuid default gen_random_uuid() primary key,
  song_id uuid references public.songs(id) on delete set null,
  song_title text not null,
  song_artist text not null,
  name text not null,
  phone text not null,
  message text default '',
  receipt_url text,
  is_played boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilita Row Level Security (resolve o alerta do Supabase)
alter table public.dedications enable row level security;

-- 3. Política: qualquer visitante pode inserir uma dedicação (necessário para o modal público)
drop policy if exists "Anyone can insert dedications." on public.dedications;
create policy "Anyone can insert dedications." on public.dedications
  for insert with check (true);

-- 4. Política: admin autenticado tem acesso total (select, update, delete)
drop policy if exists "Admins can manage dedications" on public.dedications;
create policy "Admins can manage dedications" on public.dedications
  for all to authenticated using (true) with check (true);

-- 5. Bucket de storage para comprovantes (idempotente)
insert into storage.buckets (id, name, public)
  values ('dedications', 'dedications', true)
  on conflict (id) do nothing;

-- 6. Política de storage: qualquer um pode fazer upload do comprovante
drop policy if exists "Anyone can upload dedications receipts" on storage.objects;
create policy "Anyone can upload dedications receipts" on storage.objects
  for insert with check (bucket_id = 'dedications');

-- 7. Política de storage: leitura pública dos comprovantes
drop policy if exists "Public Select Dedications" on storage.objects;
create policy "Public Select Dedications" on storage.objects
  for select using (bucket_id = 'dedications');

-- 8. Política de storage: apenas admin pode deletar comprovantes
drop policy if exists "Admin Delete Dedications" on storage.objects;
create policy "Admin Delete Dedications" on storage.objects
  for delete using (bucket_id = 'dedications' and auth.role() = 'authenticated');
