-- 관리자 접속 현황 — app_visits 집계 RPC
-- track_visit.sql(app_visits) + profiles.sql(is_admin) 이후 1회 실행하세요.
-- 관리자만 결과를 받습니다(그 외에는 빈 배열).

create or replace function public.get_visit_stats(p_days int default 14)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_by_app json;
  v_daily  json;
begin
  if not public.is_admin() then
    return json_build_object('byApp', '[]'::json, 'daily', '[]'::json);
  end if;

  select coalesce(json_agg(row_to_json(t) order by t.total desc), '[]'::json)
    into v_by_app
  from (
    select app,
           sum(count)::int as total,
           coalesce(sum(count) filter (where day = current_date), 0)::int as today
    from public.app_visits
    group by app
  ) t;

  select coalesce(json_agg(row_to_json(d) order by d.day), '[]'::json)
    into v_daily
  from (
    select day::text as day, sum(count)::int as total
    from public.app_visits
    where day >= current_date - (p_days - 1)
    group by day
  ) d;

  return json_build_object('byApp', v_by_app, 'daily', v_daily);
end;
$$;

grant execute on function public.get_visit_stats(int) to authenticated;
