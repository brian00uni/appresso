-- 로또 6/45 당첨번호 — 전역 공유 저장소
-- Supabase SQL Editor에서 1회 실행하세요.
--
-- 당첨번호는 모든 사용자에게 동일한 공개 데이터이므로 사용자별이 아니라
-- 전역 테이블(lotto_draws)에 회차별 1행으로 저장한다.
--   · 읽기: 누구나(anon 포함) select 허용
--   · 쓰기: upsert_lotto_draws(security definer) 함수로만 (검증 후 upsert)
-- 이렇게 하면 한 번만 업데이트해도 어떤 브라우저·기기·시크릿모드에서 열어도
-- 최신 데이터가 그대로 유지된다.

create table if not exists public.lotto_draws (
  drw        int primary key,
  nums       int[] not null,
  bonus      int not null,
  draw_date  text,
  updated_at timestamptz not null default now()
);

alter table public.lotto_draws enable row level security;

-- 읽기: 모두 허용 (공개 당첨번호)
drop policy if exists lotto_draws_select on public.lotto_draws;
create policy lotto_draws_select on public.lotto_draws
  for select using (true);

-- 쓰기 정책은 두지 않는다. 아래 security definer 함수로만 반영된다.

-- 회차 배열(jsonb)을 검증 후 병합(upsert)한다. 반영된 행 수를 반환.
-- 입력 형식: [{ "drw": 1219, "nums": [1,2,15,28,39,45], "bonus": 31, "date": "2026-04-11" }, ...]
create or replace function public.upsert_lotto_draws(p_draws jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  jsonb;
  v_drw   int;
  v_nums  int[];
  v_bonus int;
  v_date  text;
  v_count int := 0;
begin
  if p_draws is null or jsonb_typeof(p_draws) <> 'array' then
    return 0;
  end if;

  for v_item in select * from jsonb_array_elements(p_draws)
  loop
    begin
      v_drw   := (v_item->>'drw')::int;
      v_bonus := (v_item->>'bonus')::int;
      v_date  := v_item->>'date';
      select array_agg(e::int) into v_nums
        from jsonb_array_elements_text(v_item->'nums') as e;
    exception when others then
      continue; -- 형식 오류 항목은 건너뜀
    end;

    -- 검증
    if v_drw is null or v_drw < 1 then continue; end if;
    if v_bonus is null or v_bonus < 1 or v_bonus > 45 then continue; end if;
    if v_nums is null or array_length(v_nums, 1) <> 6 then continue; end if;
    if exists (select 1 from unnest(v_nums) x where x < 1 or x > 45) then continue; end if;

    insert into public.lotto_draws (drw, nums, bonus, draw_date, updated_at)
    values (v_drw, v_nums, v_bonus, v_date, now())
    on conflict (drw) do update
      set nums       = excluded.nums,
          bonus      = excluded.bonus,
          draw_date  = excluded.draw_date,
          updated_at = now();
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.upsert_lotto_draws(jsonb) to anon, authenticated;
