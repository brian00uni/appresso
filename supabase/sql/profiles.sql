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

-- 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'admin@appresso.app' then 'admin' else 'general' end
  )
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
