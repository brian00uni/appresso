-- 회원관리(관리자) — 등급 수정 / 탈퇴(소프트 삭제) 지원
-- profiles.sql 실행 이후, SQL Editor에서 1회 실행하세요.

-- 회원 상태: active(정상) / withdrawn(탈퇴)
alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'withdrawn'));

-- 관리자: 회원 등급/상태 수정 권한 (본인 외 행도 수정 가능)
drop policy if exists "admin update all" on public.profiles;
create policy "admin update all" on public.profiles
  for update using (public.is_admin());
