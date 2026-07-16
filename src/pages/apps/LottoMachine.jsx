// LottoMachine.jsx — 로또 번호 분석 (심플 버전)
// 유리통 안에서 45개 볼이 공기 순환하듯 날아다니고,
// 버튼을 누르면 당첨빈도 가중으로 6개가 하나씩 배출됩니다.
// 데이터: src/lib/lottoData.js (LottoRecommend 와 공용)

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { trackVisit } from '../../lib/visits';
import { BASE_KNOWN, getFrequency, getNumberStats, drawWeighted, ballColor } from '../../lib/lottoData';
import { fetchSharedDraws, readLocalCache, mergeDraws } from '../../lib/lottoSync';

// ── 물리 상수 ────────────────────────────────────────────────
const MACHINE = 320;        // 유리통 지름(px)
const BALL    = 30;         // 볼 지름(px)
const R       = MACHINE / 2;
const BR      = BALL / 2;
const MAXDIST = R - BR - 6; // 벽까지 여유
const MAXV    = 4.2;
const MINV    = 1.6;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function LottoMachine() {
  // LottoRecommend와 동일한 공유 데이터(로컬 캐시 + Supabase)를 사용해 회차/빈도를 연동한다.
  const [data, setData] = useState(() => mergeDraws(BASE_KNOWN, readLocalCache()));
  const freq  = useMemo(() => getFrequency(data), [data]);
  const stats = useMemo(() => getNumberStats(data), [data]);
  const latestDrw = useMemo(() => data.reduce((m, d) => Math.max(m, d.drw), 0), [data]);
  const latestDraw = useMemo(
    () => data.find(d => d.drw === latestDrw) || data[data.length - 1] || null,
    [data, latestDrw]
  );

  // 마운트 시 원격 공유 저장소에서 최신 회차를 불러와 병합 (실패 시 로컬만 사용)
  useEffect(() => {
    let active = true;
    (async () => {
      const remote = await fetchSharedDraws();
      if (!active || !remote || remote.length === 0) return;
      setData(mergeDraws(mergeDraws(BASE_KNOWN, readLocalCache()), remote));
    })();
    return () => { active = false; };
  }, []);

  const [results, setResults] = useState([]);   // 뽑힌 번호 (순서대로)
  const [drawing, setDrawing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const wrapRef   = useRef(null);
  const ballsRef  = useRef([]);   // [{ n, x, y, vx, vy, el }]
  const drawnRef  = useRef(new Set());
  const rafRef    = useRef(0);

  // 방문 카운팅 (lotto 앱과 동일 집계)
  useEffect(() => { trackVisit('lotto'); }, []);

  // ── 볼 초기화 + 물리 루프 ──────────────────────────────────
  useEffect(() => {
    const balls = [];
    for (let n = 1; n <= 45; n++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * MAXDIST;
      const spd = MINV + Math.random() * (MAXV - MINV);
      const dir = Math.random() * Math.PI * 2;
      balls.push({
        n,
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        vx: Math.cos(dir) * spd,
        vy: Math.sin(dir) * spd,
        el: null,
      });
    }
    ballsRef.current = balls;

    // 모바일 발열·버벅임 완화: 물리 갱신을 ~45fps로 제한한다.
    // (120Hz ProMotion 기기에선 rAF가 초당 120회 호출돼 45개 볼 연산이 2배로 무거워짐)
    const FRAME_MS = 1000 / 45;
    let prevT = 0;
    const step = (now) => {
      rafRef.current = requestAnimationFrame(step);
      if (now - prevT < FRAME_MS) return;
      prevT = now;

      const drawn = drawnRef.current;
      for (const b of ballsRef.current) {
        if (!b.el) continue;
        if (drawn.has(b.n)) continue; // 배출된 볼은 물리 제외

        // 난기류(에어 블로워 느낌) + 중력 + 하단 상승 킥
        b.vx += (Math.random() - 0.5) * 0.6;
        b.vy += (Math.random() - 0.5) * 0.6 + 0.12; // 살짝 중력
        if (b.y > MAXDIST * 0.35) b.vy -= 0.5 + Math.random() * 0.5; // 바닥에서 위로 뿜기

        // 속도 클램프
        let sp = Math.hypot(b.vx, b.vy);
        if (sp > MAXV) { b.vx = b.vx / sp * MAXV; b.vy = b.vy / sp * MAXV; sp = MAXV; }
        if (sp < MINV) {
          if (sp < 0.001) { b.vx = MINV; b.vy = 0; }
          else { b.vx = b.vx / sp * MINV; b.vy = b.vy / sp * MINV; }
        }

        b.x += b.vx;
        b.y += b.vy;

        // 원형 벽 반사
        const dist = Math.hypot(b.x, b.y);
        if (dist > MAXDIST) {
          const nx = b.x / dist, ny = b.y / dist;
          b.x = nx * MAXDIST;
          b.y = ny * MAXDIST;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.92;
          b.vy = (b.vy - 2 * dot * ny) * 0.92;
        }

        b.el.style.transform = `translate(-50%,-50%) translate(${b.x}px,${b.y}px)`;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── 뽑기 ───────────────────────────────────────────────────
  const handleDraw = useCallback(async () => {
    if (drawing) return;
    setDrawing(true);
    setModalOpen(false);
    setCopied(false);
    setResults([]);
    drawnRef.current = new Set();
    // 물리 재개(이전에 배출된 볼 원위치 복귀)
    for (const b of ballsRef.current) {
      if (b.el) {
        b.el.style.transition = '';
        b.el.style.opacity = '1';
      }
    }

    await sleep(700); // 통이 한바탕 섞이는 시간

    const picks = drawWeighted(freq, 6);
    for (let i = 0; i < picks.length; i++) {
      const n = picks[i];
      const b = ballsRef.current.find(x => x.n === n);
      drawnRef.current.add(n);

      // 배출구(하단 중앙)로 빨려나가는 애니메이션
      if (b?.el) {
        b.el.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1), opacity .45s';
        b.el.style.transform = `translate(-50%,-50%) translate(0px,${MAXDIST + 40}px) scale(.6)`;
        b.el.style.opacity = '0';
      }

      await sleep(300);
      setResults(prev => [...prev, n]);   // 트레이에 등장
      await sleep(500);
    }

    setDrawing(false);
    await sleep(400);
    setModalOpen(true);   // 결과 모달
  }, [drawing, freq]);

  // 번호 복사
  const handleCopy = useCallback(async () => {
    const text = results.join(', ');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한 없을 때 폴백
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [results]);

  // 상위/하위 빈도 5개 (분석 데이터 노출)
  const hot  = useMemo(() => [...stats].sort((a, b) => b.freq - a.freq).slice(0, 5), [stats]);
  const cold = useMemo(() => [...stats].sort((a, b) => a.freq - b.freq).slice(0, 5), [stats]);

  return (
    <div style={sx.page}>
      <style>{KEYFRAMES}</style>

      <div style={sx.head}>
        <div style={sx.title}>🎱 로또 번호 뽑기</div>
        <div style={sx.sub}>제 {latestDrw}회까지 당첨빈도 기반 · 심플 버전</div>

        {/* 최근 회차 당첨번호 */}
        {latestDraw && (
          <div style={sx.recentWrap}>
            <span style={sx.recentLabel}>
              🏆 제{latestDraw.drw}회 당첨번호
              {latestDraw.date && <span style={sx.recentDate}> · {latestDraw.date}</span>}
            </span>
            <div style={sx.recentBalls}>
              {latestDraw.nums.map(n => (
                <div key={n} style={{ ...sx.recentBall, background: ballGradient(n) }}>{n}</div>
              ))}
              <span style={sx.recentPlus}>+</span>
              <div style={{ ...sx.recentBall, background: ballGradient(latestDraw.bonus) }}>{latestDraw.bonus}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── 유리통 머신 ── */}
      <div style={sx.stage}>
        <div ref={wrapRef} style={sx.machine}>
          {/* 유리 광택 */}
          <div style={sx.glassShine} />
          {/* 볼들 */}
          {Array.from({ length: 45 }, (_, i) => {
            const n = i + 1;
            return (
              <div
                key={n}
                ref={el => { const b = ballsRef.current[i]; if (b) b.el = el; }}
                style={{ ...sx.ball, background: ballGradient(n) }}
              >
                {n}
              </div>
            );
          })}
          {/* 하단 배출구 */}
          <div style={sx.outlet} />
        </div>
        {/* 받침대 */}
        <div style={sx.base} />
      </div>

      {/* ── 뽑기 버튼 ── */}
      <button onClick={handleDraw} disabled={drawing} style={{ ...sx.drawBtn, opacity: drawing ? .7 : 1, cursor: drawing ? 'not-allowed' : 'pointer' }}>
        {drawing ? '뽑는 중…' : '번호 뽑기'}
      </button>

      {/* ── 결과 트레이 ── */}
      <div style={sx.tray}>
        {Array.from({ length: 6 }, (_, i) => {
          const n = results[i];
          return n != null ? (
            <div key={i} style={{ ...sx.resultBall, background: ballGradient(n), animation: 'lm_pop .4s ease' }}>{n}</div>
          ) : (
            <div key={i} style={sx.slot} />
          );
        })}
      </div>

      {/* ── 분석 데이터 ── */}
      <div style={sx.analysis}>
        <div style={sx.analCol}>
          <div style={sx.analLabel}>🔥 자주 나온 번호</div>
          <div style={sx.analRow}>
            {hot.map(s => (
              <div key={s.n} style={sx.miniWrap}>
                <div style={{ ...sx.mini, background: ballGradient(s.n) }}>{s.n}</div>
                <span style={sx.miniCnt}>{s.freq}회</span>
              </div>
            ))}
          </div>
        </div>
        <div style={sx.analCol}>
          <div style={sx.analLabel}>❄️ 안 나온 번호</div>
          <div style={sx.analRow}>
            {cold.map(s => (
              <div key={s.n} style={sx.miniWrap}>
                <div style={{ ...sx.mini, background: ballGradient(s.n) }}>{s.n}</div>
                <span style={sx.miniCnt}>{s.freq}회</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 결과 모달 ── */}
      {modalOpen && (
        <div style={sx.overlay} onClick={() => setModalOpen(false)}>
          <div style={sx.modal} onClick={e => e.stopPropagation()}>
            <button style={sx.modalClose} onClick={() => setModalOpen(false)}>✕</button>
            <div style={sx.modalTitle}>🎉 뽑힌 번호</div>

            <div style={sx.modalBalls}>
              {results.map((n, i) => (
                <div key={i} style={{ ...sx.resultBall, background: ballGradient(n) }}>{n}</div>
              ))}
            </div>

            <div style={sx.modalBtns}>
              <button style={sx.copyBtn} onClick={handleCopy}>
                {copied ? '✅ 복사됨' : '📋 번호 복사'}
              </button>
              <button style={sx.redrawBtn} onClick={handleDraw}>🔄 번호 다시 뽑기</button>
            </div>

            <div style={sx.modalFoot}>재미로 보는 통계입니다. 당첨을 보장하지 않아요 🍀</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 구슬 입체감용 방사형 그라데이션
function ballGradient(n) {
  const c = ballColor(n);
  return `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${c} 42%, ${c} 70%, rgba(0,0,0,.35) 100%)`;
}

const KEYFRAMES = `
@keyframes lm_pop { 0%{transform:scale(.2);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes lm_fade { from{opacity:0} to{opacity:1} }
`;

// ── 스타일 ───────────────────────────────────────────────────
const sx = {
  page: {
    minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1e2440 0%, #0b0f1e 60%)',
    color: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '28px 16px 40px', fontFamily: 'system-ui,-apple-system,sans-serif', boxSizing: 'border-box',
  },
  head: { textAlign: 'center', marginBottom: 18 },
  title: { fontSize: 30, fontWeight: 800, letterSpacing: '-.5px' },
  sub: { fontSize: 15, color: '#94a3b8', marginTop: 6 },

  recentWrap: { marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 },
  recentLabel: { fontSize: 12, fontWeight: 700, color: '#a5b4fc' },
  recentDate: { color: '#64748b', fontWeight: 500 },
  recentBalls: { display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' },
  recentBall: {
    width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 12, color: '#3a2c00', textShadow: '0 1px 1px rgba(255,255,255,.4)',
    boxShadow: '0 2px 5px rgba(0,0,0,.35)',
  },
  recentPlus: { color: '#94a3b8', fontSize: 13, margin: '0 3px' },

  stage: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  machine: {
    position: 'relative', width: MACHINE, height: MACHINE, borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,.18), rgba(255,255,255,.02) 45%, rgba(0,0,0,.35) 100%)',
    border: '3px solid rgba(255,255,255,.35)',
    boxShadow: '0 0 0 8px rgba(255,255,255,.05), inset 0 0 40px rgba(120,150,255,.15), 0 20px 50px rgba(0,0,0,.5)',
    overflow: 'hidden',
  },
  glassShine: {
    position: 'absolute', top: '8%', left: '14%', width: '38%', height: '26%',
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.5), transparent 70%)',
    pointerEvents: 'none', zIndex: 60, filter: 'blur(2px)',
  },
  ball: {
    position: 'absolute', top: '50%', left: '50%', width: BALL, height: BALL,
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 12, color: '#3a2c00', textShadow: '0 1px 1px rgba(255,255,255,.4)',
    willChange: 'transform', boxShadow: '0 2px 4px rgba(0,0,0,.3)', zIndex: 10,
  },
  outlet: {
    position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
    width: 46, height: 22, borderRadius: '0 0 40px 40px',
    background: 'linear-gradient(#0b0f1e,#000)', border: '2px solid rgba(255,255,255,.2)', borderTop: 'none', zIndex: 50,
  },
  base: {
    width: 150, height: 26, marginTop: -6, borderRadius: '0 0 14px 14px',
    background: 'linear-gradient(#334155,#1e293b)', boxShadow: '0 10px 24px rgba(0,0,0,.5)',
  },

  drawBtn: {
    marginTop: 26, padding: '17px 52px', borderRadius: 40, border: 'none',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
    fontSize: 20, fontWeight: 800, letterSpacing: '.5px',
    boxShadow: '0 10px 26px rgba(99,102,241,.45)', transition: 'opacity .2s',
  },

  tray: {
    marginTop: 26, display: 'flex', gap: 10, minHeight: 48, justifyContent: 'center', flexWrap: 'wrap',
  },
  slot: {
    width: 44, height: 44, borderRadius: '50%', border: '2px dashed #334155', boxSizing: 'border-box',
  },
  resultBall: {
    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 17, color: '#3a2c00', textShadow: '0 1px 1px rgba(255,255,255,.4)',
    boxShadow: '0 4px 10px rgba(0,0,0,.4)',
  },

  analysis: {
    marginTop: 30, display: 'flex', gap: 12, width: '100%', maxWidth: 420, justifyContent: 'center', flexWrap: 'wrap',
  },
  analCol: { flex: '1 1 180px', background: '#141a2e', borderRadius: 12, padding: 12, border: '1px solid #232b45' },
  analLabel: { fontSize: 15, fontWeight: 700, color: '#a5b4fc', marginBottom: 10 },
  analRow: { display: 'flex', gap: 6, justifyContent: 'space-between' },
  miniWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  mini: {
    width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 12, color: '#3a2c00',
  },
  miniCnt: { fontSize: 10, color: '#64748b' },

  // ── 모달 ──
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(4,7,18,.72)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
    animation: 'lm_fade .2s ease',
  },
  modal: {
    position: 'relative', width: '100%', maxWidth: 360, background: 'linear-gradient(#1a2138,#141a2e)',
    borderRadius: 20, padding: '30px 24px 22px', border: '1px solid #2c3559',
    boxShadow: '0 30px 70px rgba(0,0,0,.6)', textAlign: 'center', animation: 'lm_pop .32s ease',
  },
  modalClose: {
    position: 'absolute', top: 12, right: 14, width: 30, height: 30, borderRadius: '50%',
    border: 'none', background: '#232b45', color: '#94a3b8', fontSize: 14, cursor: 'pointer',
  },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#e2e8f0', marginBottom: 20 },
  modalBalls: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 },
  modalBtns: { display: 'flex', gap: 10, marginBottom: 18 },
  copyBtn: {
    flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid #3b4a7a',
    background: '#232b45', color: '#c7d2fe', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  redrawBtn: {
    flex: 1, padding: '13px 0', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  modalFoot: { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
};
