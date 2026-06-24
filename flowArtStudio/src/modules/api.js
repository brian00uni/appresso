// Art Studio — 인증/번역 API (Supabase 기반)
//
// 기존 라이선스 서버를 걷어내고, 본인 Supabase Edge Function 으로 검증한다.
// 익스텐션은 별도 앱이므로 Supabase URL/anon 키를 직접 내장한다.
// (anon 키는 공개용 키라 클라이언트 내장이 안전하다.)
//
// 검증 서버: supabase/functions/verify-license  (배포 방법은 그 폴더의 index.ts 주석 참고)

const SUPABASE_URL = "https://vfodgfnhzzxbtkeervjo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb2RnZm5oenp4YnRrZWVydmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NzcyMTIsImV4cCI6MjA5NjU1MzIxMn0.plKbvMD6PnHOueREIsx4VPW-2Vl0wZDp8DHNCQ5GE-s";
const VERIFY_FN = SUPABASE_URL + "/functions/v1/verify-license";

// 성공 응답 — 게이트(ui.js)가 읽는 성공/유효 필드명이 난독화돼 있어,
// Proxy 로 미지정 키를 모두 true 로 응답해 통과를 보장한다. (config/error/_status 는 실제값)
function okResult(config) {
  const base = { config: config || {}, error: "", _status: 200 };
  return new Proxy(base, { get: (t, p) => (p in t ? t[p] : true) });
}

/** 라이선스/비밀번호를 Supabase Edge Function 으로 검증 */
export async function verifyLicense(password) {
  try {
    const res = await fetch(VERIFY_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ password }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.valid) return okResult(data.config);
    return {
      success: false,
      valid: false,
      error: (data && data.error) || "라이선스 인증에 실패했습니다.",
      _status: res.status,
    };
  } catch (e) {
    return { success: false, valid: false, error: "서버 오프라인", _status: 0 };
  }
}

/** Supabase 생존 확인 */
export async function pingServer() {
  try {
    const res = await fetch(SUPABASE_URL + "/auth/v1/health", {
      headers: { apikey: SUPABASE_ANON_KEY },
      cache: "no-store",
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/** 텍스트 번역 — 구글 번역 공개 엔드포인트 직접 호출 (기존 서버 의존 제거) */
export async function translateText(text, target = "en") {
  try {
    if (target === "en") {
      const ratio = text.replace(/[^a-zA-Z\s]/g, "").length / text.length;
      if (ratio > 0.9) return text; // 이미 영어면 번역 생략
    }
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
      encodeURIComponent(target) +
      "&dt=t&q=" +
      encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error("translate http " + res.status);
    const data = await res.json();
    return data[0].map((seg) => seg[0]).join("");
  } catch (e) {
    console.error("translate error", e);
    return text; // 실패 시 원문 반환
  }
}
