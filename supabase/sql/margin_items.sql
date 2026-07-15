-- 스마트스토어 마진 계산기 — 전역 공유 저장소
-- Supabase SQL Editor에서 1회 실행하세요.
--
-- smart-studio는 공개 페이지(로그인 불필요)이며, 로또 저장소와 같은 방식으로
-- 상품 목록을 전역 테이블(margin_items)에 저장한다. 어떤 브라우저·기기에서
-- 열어도 같은 목록이 유지된다. (localStorage는 오프라인 캐시로만 사용)
--
--   · 읽기/쓰기: anon·authenticated 모두 허용 (개인 도구 · 공유 계정 특성상 단순화)

create table if not exists public.margin_items (
  id          text primary key,        -- 클라이언트 생성 id
  name        text not null default '',
  price       numeric not null default 0,   -- 판매가
  cost        numeric not null default 0,   -- 매입가
  shipping    numeric not null default 0,   -- 배송비
  fee_rate    numeric not null default 0,   -- 수수료율(%)
  return_rate numeric not null default 0,   -- 반품충당율(%)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.margin_items enable row level security;

-- 읽기: 모두 허용
drop policy if exists margin_items_select on public.margin_items;
create policy margin_items_select on public.margin_items
  for select using (true);

-- 삽입: 모두 허용
drop policy if exists margin_items_insert on public.margin_items;
create policy margin_items_insert on public.margin_items
  for insert with check (true);

-- 수정: 모두 허용
drop policy if exists margin_items_update on public.margin_items;
create policy margin_items_update on public.margin_items
  for update using (true) with check (true);

-- 삭제: 모두 허용
drop policy if exists margin_items_delete on public.margin_items;
create policy margin_items_delete on public.margin_items
  for delete using (true);
