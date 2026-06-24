-- 회원가입 시 이름/연락처 기본값 채우기
-- 이름이 없으면 "주인장 01"부터 순번, 연락처가 없으면 010-1234-5678
-- 기존 트리거 함수만 교체하므로 SQL Editor에서 1회 실행하면 됩니다.

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
