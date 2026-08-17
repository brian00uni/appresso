-- 사입 원가 계산기(cost-studio) — 계산안 전역 공유 저장소
-- Supabase SQL Editor에서 1회 실행하세요.
--
-- cost-studio는 공개 페이지(로그인 불필요)이며, 마진 계산기(margin_items)와 같은
-- 방식으로 계산안을 전역 테이블에 저장한다. 품목 목록 + 설정 전체를 data(jsonb)
-- 한 칸에 담아 두고, 어떤 브라우저·기기에서 열어도 같은 목록이 보인다.
-- (localStorage는 작업 중 상태의 오프라인 캐시로만 사용)
--
--   · 읽기/쓰기: anon·authenticated 모두 허용 (개인 도구 · 공유 계정 특성상 단순화)

create table if not exists public.cost_projects (
  id         text primary key,                    -- 클라이언트 생성 id
  name       text not null default '',            -- 계산안 이름 (예: 수능세트 100개)
  data       jsonb not null default '{}'::jsonb,  -- { items: [...], settings: {...} }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cost_projects_updated_at_idx
  on public.cost_projects (updated_at desc);

alter table public.cost_projects enable row level security;

-- 읽기: 모두 허용
drop policy if exists cost_projects_select on public.cost_projects;
create policy cost_projects_select on public.cost_projects
  for select using (true);

-- 삽입: 모두 허용
drop policy if exists cost_projects_insert on public.cost_projects;
create policy cost_projects_insert on public.cost_projects
  for insert with check (true);

-- 수정: 모두 허용
drop policy if exists cost_projects_update on public.cost_projects;
create policy cost_projects_update on public.cost_projects
  for update using (true) with check (true);

-- 삭제: 모두 허용
drop policy if exists cost_projects_delete on public.cost_projects;
create policy cost_projects_delete on public.cost_projects
  for delete using (true);
