-- 사이트/앱 방문 카운팅
-- Supabase SQL Editor에서 1회 실행하세요.
-- 익명(anon) 방문자도 카운트할 수 있도록 security definer 함수로 증가시킵니다.

create table if not exists public.app_visits (
  app   text not null,
  day   date not null default current_date,
  count integer not null default 0,
  primary key (app, day)
);

alter table public.app_visits enable row level security;

-- 함수(security definer)로만 증가/조회하므로 테이블 직접 접근 정책은 두지 않습니다.

create or replace function public.track_visit(
  p_app       text,
  p_increment boolean default true
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_total bigint;
  v_site_today bigint;
  v_app_total  bigint;
begin
  if p_increment then
    insert into public.app_visits (app, day, count)
    values (p_app, current_date, 1)
    on conflict (app, day) do update
      set count = app_visits.count + 1;
  end if;

  select coalesce(sum(count), 0) into v_site_total from public.app_visits;
  select coalesce(sum(count), 0) into v_site_today from public.app_visits where day = current_date;
  select coalesce(sum(count), 0) into v_app_total  from public.app_visits where app = p_app;

  return json_build_object(
    'siteTotal', v_site_total,
    'siteToday', v_site_today,
    'appTotal',  v_app_total
  );
end;
$$;

grant execute on function public.track_visit(text, boolean) to anon, authenticated;
