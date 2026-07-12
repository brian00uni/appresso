// EraserStudioPage.jsx — 영상 자막 지우개 (MVP)
// 흐름: 영상 업로드 → 영상 위에서 자막 영역 박스 드래그 → 처리 요청 → 결과·다운로드
// 처리 엔진: HuggingFace Space(FastAPI + OpenCV) — VITE_ERASER_ENDPOINT 로 지정
//   예) VITE_ERASER_ENDPOINT=https://<user>-studioproj.hf.space

import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackVisit } from '../../lib/visits';

const ENDPOINT = import.meta.env.VITE_ERASER_ENDPOINT || '';

export default function EraserStudioPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile]         = useState(null);
  const [box, setBox]           = useState(null);   // {x,y,w,h} — 표시 픽셀 기준
  const [drawing, setDrawing]   = useState(false);
  const [status, setStatus]     = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [err, setErr]           = useState('');

  const stageRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => { trackVisit('eraser'); }, []);

  // 업로드
  const onFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) { setErr('영상 파일만 올려주세요.'); return; }
    setErr('');
    setResultUrl(''); setBox(null); setStatus('idle');
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
  }, []);

  // 박스 드래그
  const localPos = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return {
      x: Math.max(0, Math.min(cx, r.width)),
      y: Math.max(0, Math.min(cy, r.height)),
    };
  };
  const onDown = (e) => {
    if (!videoUrl) return;
    e.preventDefault();
    const p = localPos(e);
    startRef.current = p;
    setDrawing(true);
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onMove = (e) => {
    if (!drawing) return;
    const p = localPos(e);
    const s = startRef.current;
    setBox({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const onUp = () => setDrawing(false);

  // 하단 밴드 자동 지정(빠른 시작용) — 흔한 자막 위치
  const presetBottom = () => {
    const r = stageRef.current.getBoundingClientRect();
    setBox({ x: r.width * 0.1, y: r.height * 0.78, w: r.width * 0.8, h: r.height * 0.17 });
  };

  // 처리 요청
  const handleRemove = useCallback(async () => {
    if (!file || !box || box.w < 8 || box.h < 8) { setErr('자막 영역을 드래그해서 지정해주세요.'); return; }
    if (!ENDPOINT) {
      setErr('처리 엔진(HF Space) 주소가 설정되지 않았습니다. 아래 안내대로 VITE_ERASER_ENDPOINT를 설정하세요.');
      return;
    }
    setErr(''); setStatus('processing'); setProgress('영상 업로드 중…'); setResultUrl('');

    // 표시 픽셀 → 정규화(0~1) 좌표 (백엔드가 실제 해상도에 매핑)
    const r = stageRef.current.getBoundingClientRect();
    const nx = box.x / r.width, ny = box.y / r.height;
    const nw = box.w / r.width, nh = box.h / r.height;

    const fd = new FormData();
    fd.append('video', file);
    fd.append('x', nx.toFixed(5));
    fd.append('y', ny.toFixed(5));
    fd.append('w', nw.toFixed(5));
    fd.append('h', nh.toFixed(5));

    try {
      setProgress('자막 제거 처리 중… (영상 길이에 따라 시간이 걸려요)');
      const res = await fetch(`${ENDPOINT.replace(/\/$/, '')}/remove`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setStatus('done');
    } catch (e) {
      setErr(`처리 실패: ${e.message}`);
      setStatus('error');
    }
  }, [file, box]);

  const reset = () => {
    setBox(null); setResultUrl(''); setStatus('idle'); setErr('');
  };

  return (
    <div style={sx.page}>
      <Link to="/" style={sx.home}>← 홈으로</Link>

      <div style={sx.head}>
        <div style={sx.title}>🧽 자막 지우개</div>
        <div style={sx.sub}>영상 속 자막 영역을 지정하면 자막만 깔끔하게 지워드려요</div>
      </div>

      {/* 업로드 or 스테이지 */}
      {!videoUrl ? (
        <label
          style={sx.drop}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
        >
          <div style={{ fontSize: 44 }}>📤</div>
          <div style={sx.dropTitle}>영상을 드래그하거나 클릭해서 업로드</div>
          <div style={sx.dropSub}>MP4 · MOV 등 · 짧은 영상 권장(무료 처리)</div>
          <input type="file" accept="video/*" style={{ display: 'none' }}
            onChange={e => onFile(e.target.files?.[0])} />
        </label>
      ) : (
        <>
          <div style={sx.toolbar}>
            <button style={sx.toolBtn} onClick={presetBottom}>⬇️ 하단 자막영역 자동지정</button>
            <button style={sx.toolBtn} onClick={reset}>↺ 영역 초기화</button>
            <button style={sx.toolBtnGhost} onClick={() => { setVideoUrl(''); setFile(null); reset(); }}>🗑 다른 영상</button>
          </div>

          <div
            ref={stageRef}
            style={sx.stage}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            <video src={videoUrl} style={sx.video} controls={!drawing} playsInline />
            {box && (
              <div style={{
                ...sx.boxSel,
                left: box.x, top: box.y, width: box.w, height: box.h,
              }}>
                <span style={sx.boxTag}>자막 영역</span>
              </div>
            )}
            {!box && <div style={sx.hint}>여기서 자막이 있는 부분을 드래그하세요</div>}
          </div>

          <button
            style={{ ...sx.runBtn, opacity: status === 'processing' ? 0.7 : 1, cursor: status === 'processing' ? 'not-allowed' : 'pointer' }}
            onClick={handleRemove}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? '처리 중…' : '✨ 자막 제거하기'}
          </button>

          {status === 'processing' && <div style={sx.progress}>{progress}</div>}
        </>
      )}

      {err && <div style={sx.error}>⚠ {err}</div>}

      {/* 결과 */}
      {resultUrl && (
        <div style={sx.result}>
          <div style={sx.resultTitle}>✅ 완료</div>
          <video src={resultUrl} style={sx.video} controls playsInline />
          <a href={resultUrl} download="subtitle-removed.mp4" style={sx.download}>⬇️ 결과 영상 다운로드</a>
        </div>
      )}

      {/* 엔진 미설정 안내 */}
      {!ENDPOINT && (
        <div style={sx.setup}>
          <b style={{ color: '#a5b4fc' }}>처리 엔진 설정 안내</b><br />
          HuggingFace Space(무료 CPU)에 처리 엔진을 올린 뒤, Vercel 환경변수에
          <code style={sx.code}>VITE_ERASER_ENDPOINT</code>로 Space 주소를 넣으면 실제 처리가 동작합니다.
          (엔진 코드는 <code style={sx.code}>eraser-space/</code> 폴더 참고)
        </div>
      )}

      <div style={sx.foot}>무료 처리 특성상 긴 영상은 시간이 오래 걸릴 수 있어요 🧽</div>
    </div>
  );
}

const sx = {
  page: {
    minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1c2440 0%, #0b0f1e 60%)',
    color: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '28px 16px 48px', fontFamily: 'system-ui,-apple-system,sans-serif', boxSizing: 'border-box',
  },
  home: { position: 'fixed', top: 14, left: 16, fontSize: 13, color: '#94a3b8', textDecoration: 'none' },
  head: { textAlign: 'center', marginBottom: 22, marginTop: 8 },
  title: { fontSize: 30, fontWeight: 800, letterSpacing: '-.5px' },
  sub: { fontSize: 15, color: '#94a3b8', marginTop: 6 },

  drop: {
    width: '100%', maxWidth: 560, minHeight: 220, borderRadius: 18, cursor: 'pointer',
    border: '2px dashed #3b4670', background: '#131a30',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  dropTitle: { fontSize: 16, fontWeight: 700, color: '#c7d2fe' },
  dropSub: { fontSize: 12, color: '#64748b' },

  toolbar: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' },
  toolBtn: {
    padding: '8px 14px', borderRadius: 10, border: '1px solid #3b4a7a',
    background: '#232b45', color: '#c7d2fe', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  toolBtnGhost: {
    padding: '8px 14px', borderRadius: 10, border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },

  stage: {
    position: 'relative', width: '100%', maxWidth: 640, borderRadius: 14, overflow: 'hidden',
    background: '#000', userSelect: 'none', touchAction: 'none', border: '1px solid #232b45',
  },
  video: { display: 'block', width: '100%', maxWidth: 640, borderRadius: 14 },
  boxSel: {
    position: 'absolute', border: '2px solid #8b5cf6', background: 'rgba(139,92,246,.22)',
    boxShadow: '0 0 0 9999px rgba(0,0,0,.12)', pointerEvents: 'none', borderRadius: 4,
  },
  boxTag: {
    position: 'absolute', top: -20, left: 0, fontSize: 10, fontWeight: 700,
    background: '#8b5cf6', color: '#fff', padding: '1px 6px', borderRadius: 4,
  },
  hint: {
    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
    fontSize: 12, color: '#e2e8f0', background: 'rgba(0,0,0,.55)', padding: '5px 12px', borderRadius: 20,
    pointerEvents: 'none',
  },

  runBtn: {
    marginTop: 18, padding: '16px 48px', borderRadius: 40, border: 'none',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
    fontSize: 18, fontWeight: 800, boxShadow: '0 10px 26px rgba(99,102,241,.45)',
  },
  progress: { marginTop: 12, fontSize: 13, color: '#a5b4fc' },
  error: { marginTop: 14, fontSize: 13, color: '#f87171', maxWidth: 560, textAlign: 'center' },

  result: {
    marginTop: 26, width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12, background: '#131a30', borderRadius: 16, padding: 16, border: '1px solid #232b45',
  },
  resultTitle: { fontSize: 16, fontWeight: 800, color: '#34d399' },
  download: {
    padding: '12px 26px', borderRadius: 30, background: 'linear-gradient(135deg,#10b981,#059669)',
    color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 15,
  },

  setup: {
    marginTop: 26, maxWidth: 560, fontSize: 12, color: '#94a3b8', lineHeight: 1.7,
    background: '#131a30', border: '1px solid #232b45', borderRadius: 12, padding: 14,
  },
  code: { background: '#0f172a', color: '#7dd3fc', padding: '1px 6px', borderRadius: 4, margin: '0 3px', fontSize: 11 },

  foot: { marginTop: 26, fontSize: 12, color: '#475569' },
};
