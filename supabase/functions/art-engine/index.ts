// Art Studio — 작업 엔진 Edge Function
//
// 익스텐션(flowArtStudio) pipeline.js 가 호출하던 원본 개발자 서버
// (api-gateway.lovena0905.workers.dev) 를 대체한다.
// 단일 엔드포인트가 action 으로 분기한다.
//
//   build_prompt       { topic, style, isVideo }      → { success, prompt }
//   get_capture_rules  {}                             → { success, captureRules }
//   build_task         { taskType, imageUrl|mediaId, filename } → { success, task }
//
// ── 배포 ──
//   supabase functions deploy art-engine --no-verify-jwt
//   (pipeline.js 는 apikey/Authorization 없이 호출하므로 --no-verify-jwt 필수)
//
// ⚠️ 동영상(mediaId) 다운로드는 Google Flow 의 비공개 다운로드 API 를 알아야 한다.
//    원본 서버가 하던 그 부분은 라이브 Flow 세션의 네트워크 요청을 캡처해야 복제 가능하다.
//    지금은 이미지(직접 URL) 다운로드만 지원한다.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-token",
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
  if (req.method !== "POST") return json({ success: false, error: "POST only" }, 405);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "잘못된 요청" }, 400);
  }

  const action = String(body.action ?? "");

  // 1) 프롬프트 가공 — 토픽 + 스타일 결합 (서버 LLM 최적화 대체, 필요 시 확장)
  if (action === "build_prompt") {
    const topic = String(body.topic ?? "").trim();
    const style = String(body.style ?? "").trim();
    const prompt = style ? `${topic}, ${style}` : topic;
    return json({ success: true, prompt });
  }

  // 2) 다운로드 헤더 캡처 규칙 — 직접 URL 다운로드 방식은 캡처 불필요
  if (action === "get_capture_rules") {
    return json({ success: true, captureRules: [] });
  }

  // 3) 다운로드 작업 생성
  if (action === "build_task") {
    const taskType = String(body.taskType ?? "");
    const filename = String(body.filename ?? "download");
    if (taskType === "image") {
      const imageUrl = String(body.imageUrl ?? "");
      if (!imageUrl) return json({ success: false, error: "imageUrl 누락" });
      // 이미지: 추출된 URL 을 그대로 직접 다운로드
      return json({
        success: true,
        task: { method: "DIRECT_DOWNLOAD", payload: imageUrl, filename },
      });
    }
    // 동영상: Flow 비공개 다운로드 API 미연동 (라이브 캡처 필요)
    return json({
      success: false,
      error: "동영상 다운로드는 아직 지원되지 않습니다 (Flow API 미연동)",
    });
  }

  return json({ success: false, error: `알 수 없는 action: ${action}` }, 400);
});
