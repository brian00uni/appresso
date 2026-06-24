-- 회원 프로필 / 역할 (general · vip · admin)
-- Supabase SQL Editor에서 1회 실행하세요.
--
-- 실행 후 할 일:
--   1) Authentication → Users → Add user 로 아래 두 계정 생성 (Auto Confirm 켜기)
--        user@appresso.app  / 1122    (범용 일반 계정)
--        admin@appresso.app / 112233  (관리자 계정)
--      → 가입 트리거가 profiles 행을 자동 생성하며, admin@appresso.app 은 role='admin' 으로 들어갑니다.
--   2) 특정 회원을 VIP로 올리려면:  update public.profiles set role='vip' where email='...';

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'general' check (role in ('general', 'vip', 'admin')),
  status     text not null default 'active' check (status in ('active', 'withdrawn')),
  name       text,
  contact    text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 관리자 여부 (security definer 로 RLS 재귀 방지)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 본인 프로필 읽기/수정
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

-- 관리자: 전체 회원 읽기
drop policy if exists "admin read all" on public.profiles;
create policy "admin read all" on public.profiles
  for select using (public.is_admin());

-- 관리자: 회원 등급/상태 수정
drop policy if exists "admin update all" on public.profiles;
create policy "admin update all" on public.profiles
  for update using (public.is_admin());

-- 신규 가입 시 프로필 자동 생성
-- 이름/연락처가 없으면 기본값: 이름은 "주인장 01"부터 순번, 연락처는 010-1234-5678
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role    text := case when new.email = 'admin@appresso.app' then 'admin' else 'general' end;
  v_name    text := nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), '');
  v_contact text := nullif(trim(coalesce(new.raw_user_meta_data->>'contact', '')), '');
  v_seq     int;
begin
  if v_name is null then
    -- 기존 "주인장 NN" 중 최대 번호 + 1
    select coalesce(max((regexp_replace(name, '\D', '', 'g'))::int), 0) + 1
      into v_seq
      from public.profiles
      where name ~ '^주인장 [0-9]+$';
    v_name := '주인장 ' || lpad(v_seq::text, 2, '0');
  end if;
  if v_contact is null then
    v_contact := '010-1234-5678';
  end if;

  insert into public.profiles (id, email, role, name, contact)
  values (new.id, new.email, v_role, v_name, v_contact)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 존재하는 계정 백필 (계정을 SQL 실행보다 먼저 만들었어도 프로필 생성)
insert into public.profiles (id, email, role)
select u.id, u.email,
       case when u.email = 'admin@appresso.app' then 'admin' else 'general' end
from auth.users u
on conflict (id) do nothing;
