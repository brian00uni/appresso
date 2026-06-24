// Art Studio — 라이선스 검증 Edge Function
//
// 익스텐션(flowArtStudio)이 보안 인증 시 호출한다.
// POST { password } → { valid, config, error }
//
// ── 배포 ──
//   1) Supabase CLI 설치 후 프로젝트 연결:
//        supabase link --project-ref vfodgfnhzzxbtkeervjo
//   2) 라이선스(통과 비밀번호)를 시크릿으로 등록:
//        supabase secrets set ART_STUDIO_LICENSE='원하는_라이선스_문자열'
//   3) 배포:
//        supabase functions deploy verify-license --no-verify-jwt
//      (--no-verify-jwt: anon 키만으로 호출 허용. 검증은 이 함수가 직접 수행)
//
// 여러 라이선스를 쓰고 싶으면 ART_STUDIO_LICENSE 를 콤마로 구분: "code1,code2,code3"

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ valid: false, error: "POST only" }, 405);

  const codes = (Deno.env.get("ART_STUDIO_LICENSE") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  try {
    const { password } = await req.json();
    const valid = !!password && codes.includes(String(password).trim());
    return json(
      {
        valid,
        // 성공 시 익스텐션이 window.SERVER_CONFIG 로 보관할 설정 (필요 시 확장)
        config: valid ? { brand: "Art Studio" } : null,
        error: valid ? "" : "라이선스가 올바르지 않습니다.",
      },
      valid ? 200 : 401,
    );
  } catch {
    return json({ valid: false, error: "잘못된 요청입니다." }, 400);
  }
});
