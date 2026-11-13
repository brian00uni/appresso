// 로또 분석: 공식 스냅샷과 공통 자동 갱신기를 사용합니다.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { trackVisit } from '../../lib/visits';
import { LATEST_DRW as BASE_LATEST_DRW } from '../../lib/lottoData';
import { msUntilNextDrawUpdate, getExpectedLatestDraw, drawDate } from '../../lib/lottoCore';
import { currentDraws, syncLatestDraws, watchLotto, lastSuccess, saveDraws, clearDrawCache } from '../../lib/lottoUpdater';

// ══════════════════════════════════════════════════════════════
// § 상수
// ══════════════════════════════════════════════════════════════
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ══════════════════════════════════════════════════════════════
// § 6. 분석 유틸
// ══════════════════════════════════════════════════════════════
function getFrequency(data) {
  const f = new Array(46).fill(0);
  data.forEach(({ nums }) => nums.forEach(n => f[n]++));
  return f;
}
function getPatterns(data) {
  return data.map(({ drw, nums, bonus }) => {
    const sum = nums.reduce((a, b) => a + b, 0);
    const odd = nums.filter(n => n % 2 === 1).length;
    const low = nums.filter(n => n <= 22).length;
    let mr = 1, r = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i - 1] + 1) { r++; mr = Math.max(mr, r); } else r = 1;
    }
    return { drw, nums, bonus, sum, odd, even: 6 - odd, low, high: 6 - low, consecutive: mr };
  });
}
function buildScoreMap(data, latestDrw) {
  const all45   = Array.from({ length: 45 }, (_, i) => i + 1);
  const fAll    = getFrequency(data);
  const f52     = getFrequency(data.slice(-52));
  const f26     = getFrequency(data.slice(-26));
  const f13     = getFrequency(data.slice(-13));
  const la      = new Array(46).fill(0);
  for (let i = data.length - 1; i >= 0; i--)
    data[i].nums.forEach(n => { if (!la[n]) la[n] = data[i].drw; });
  const absence = all45.map(n => latestDrw - (la[n] || 0));
  const oeCnt   = {};
  data.forEach(({ nums }) => {
    const k = nums.filter(n => n % 2 === 1).length;
    oeCnt[k] = (oeCnt[k] || 0) + 1;
  });
  const bestOdd = parseInt(Object.entries(oeCnt).sort((a, b) => b[1] - a[1])[0][0]);
  const zones     = [{ min:1,max:9 },{ min:10,max:19 },{ min:20,max:29 },{ min:30,max:39 },{ min:40,max:45 }];
  const zTotal    = zones.map(z => { let c = 0; for (let n = z.min; n <= z.max; n++) c += fAll[n]; return c; });
  const zGrand    = zTotal.reduce((a, b) => a + b, 0);
  const zIdeal    = [9,10,10,10,6].map(v => v / 45);
  const zoneBonus = all45.map(n => {
    const zi = zones.findIndex(z => n >= z.min && n <= z.max);
    const actual = zTotal[zi] / zGrand;
    return actual < zIdeal[zi] ? (zIdeal[zi] - actual) * 80 : 0;
  });
  const score = new Array(46).fill(0);
  for (let n = 1; n <= 45; n++) {
    const i = n - 1;
    score[n] = fAll[n]*0.25 + f52[n]*0.35 + f26[n]*0.55 + f13[n]*0.85
      + (absence[i] >= 20 ? absence[i]*1.2 : absence[i] >= 10 ? absence[i]*0.7 : 0)
      + (((bestOdd >= 3 && n%2===1)||(bestOdd <= 3 && n%2===0)) ? 2.5 : 0)
      + zoneBonus[i];
  }
  return { score, absence, bestOdd, fAll, f52, f13 };
}
function genIntegrated(data, latestDrw, seed) {
  const all45   = Array.from({ length:45 }, (_, i) => i + 1);
  const { score, absence, bestOdd } = buildScoreMap(data, latestDrw);
  const rand    = seededRand(seed);
  const topPool = [...all45].sort((a, b) => score[b] - score[a]).slice(0, 28);
  const missPool = [...all45].sort((a, b) => absence[b-1] - absence[a-1]).slice(0, 8);
  let best = null, bestFit = -Infinity;
  for (let att = 0; att < 5000; att++) {
    const sh = [...topPool].sort(() => rand() - 0.5);
    const pk = new Set();
    pk.add(missPool[Math.floor(rand() * Math.min(4, missPool.length))]);
    for (const n of sh) { if (pk.size >= 6) break; pk.add(n); }
    if (pk.size < 6) {
      const rest = all45.filter(n => !pk.has(n)).sort(() => rand() - 0.5);
      for (const n of rest) { if (pk.size >= 6) break; pk.add(n); }
    }
    const nums = Array.from(pk).sort((a, b) => a - b);
    const sum  = nums.reduce((a, b) => a + b, 0);
    const odd  = nums.filter(n => n % 2 === 1).length;
    const low  = nums.filter(n => n <= 22).length;
    let mr = 1, r = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i-1]+1) { r++; mr = Math.max(mr,r); } else r = 1;
    }
    if (sum < 105 || sum > 175) continue;
    if (odd < 2 || odd > 4) continue;
    if (low < 1 || low > 5) continue;
    if (mr > 3) continue;
    const fit = nums.reduce((a, n) => a + score[n], 0) - Math.abs(sum - 140)*0.3 + (odd === bestOdd ? 5 : 0);
    if (fit > bestFit) { bestFit = fit; best = { nums, sum, odd, even:6-odd, low, high:6-low, maxRun:mr }; }
  }
  return best;
}
function genStrategies(data, latestDrw, seed) {
  const all45  = Array.from({ length:45 }, (_, i) => i + 1);
  const { score, absence } = buildScoreMap(data, latestDrw);
  const rand   = seededRand(seed);
  const strats = [
    { name:'🔥 고빈도 위주',   pool:[...all45].sort((a,b)=>score[b]-score[a]).slice(0,18) },
    { name:'❄️ 고+저 혼합',    pool:[...[...all45].sort((a,b)=>score[b]-score[a]).slice(0,10),...[...all45].sort((a,b)=>score[a]-score[b]).slice(0,10)] },
    { name:'⏳ 미출현 집중',   pool:[...all45].sort((a,b)=>absence[b-1]-absence[a-1]).slice(0,18) },
    { name:'🎲 홀3짝3 균형',   pool:all45, constraint:'odd3' },
    { name:'📐 합계 115~165',  pool:all45, constraint:'sum' },
  ];
  return strats.map(s => {
    const pool = [...new Set(s.pool)];
    for (let att = 0; att < 2000; att++) {
      const sh = [...pool].sort(() => rand() - 0.5);
      const pk = new Set();
      for (const n of sh) { if (pk.size >= 6) break; pk.add(n); }
      if (pk.size < 6) {
        const rest = all45.filter(n => !pk.has(n)).sort(() => rand() - 0.5);
        for (const n of rest) { if (pk.size >= 6) break; pk.add(n); }
      }
      const nums = Array.from(pk).sort((a, b) => a - b);
      const sum  = nums.reduce((a, b) => a + b, 0);
      const odd  = nums.filter(n => n % 2 === 1).length;
      if (s.constraint === 'odd3' && odd !== 3) continue;
      if (s.constraint === 'sum'  && (sum < 115 || sum > 165)) continue;
      return { name:s.name, nums, sum, odd, even:6-odd };
    }
    return null;
  }).filter(Boolean);
}

function analyzePick(nums) {
  const sum  = nums.reduce((a, b) => a + b, 0);
  const odd  = nums.filter(n => n % 2 === 1).length;
  const low  = nums.filter(n => n <= 22).length;
  const zones = [0, 0, 0, 0, 0];
  nums.forEach(n => { zones[n <= 9 ? 0 : n <= 19 ? 1 : n <= 29 ? 2 : n <= 39 ? 3 : 4]++; });
  let maxRun = 1, run = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1] + 1) { run++; maxRun = Math.max(maxRun, run); } else run = 1;
  }
  return { sum, odd, even: 6 - odd, low, high: 6 - low, zones, maxRun };
}

function isBalancedPick(nums) {
  const { sum, odd, low, zones, maxRun } = analyzePick(nums);
  return sum >= 105 && sum <= 175
    && odd >= 2 && odd <= 4
    && low >= 2 && low <= 4
    && zones.filter(Boolean).length >= 4
    && maxRun <= 2;
}

function genCodexAiPick(data, latestDrw, seed) {
  const all45 = Array.from({ length:45 }, (_, i) => i + 1);
  const rand = seededRand(seed);
  const { score, absence, f13 } = buildScoreMap(data, latestDrw);
  const recent = data.slice(-10);
  const recentSet = new Set(recent.flatMap(d => d.nums));
  const weighted = all45.map(n => {
    const freshness = recentSet.has(n) ? 0.9 : 1.12;
    const noise = 0.82 + rand() * 0.42;
    return {
      n,
      w: (score[n] * 0.45 + absence[n - 1] * 0.9 + f13[n] * 1.4 + 8) * freshness * noise,
    };
  });

  let best = null, bestFit = -Infinity;
  for (let att = 0; att < 2500; att++) {
    const pool = [...weighted].sort((a, b) => (b.w * (0.9 + rand() * 0.2)) - (a.w * (0.9 + rand() * 0.2)));
    const nums = pool.slice(0, 18).sort(() => rand() - 0.5).slice(0, 6).map(v => v.n).sort((a, b) => a - b);
    if (!isBalancedPick(nums)) continue;
    const p = analyzePick(nums);
    const fit = nums.reduce((a, n) => a + score[n], 0)
      + nums.reduce((a, n) => a + Math.min(absence[n - 1], 18), 0) * 0.45
      - Math.abs(p.sum - 140) * 0.35
      + p.zones.filter(Boolean).length * 3;
    if (fit > bestFit) { bestFit = fit; best = { nums, ...p }; }
  }

  if (best) return {
    ...best,
    notes: ['Codex 랜덤 시드', '합계·홀짝·구간 균형', '최근 과열 번호 일부 완화'],
  };

  const nums = all45.sort(() => rand() - 0.5).slice(0, 6).sort((a, b) => a - b);
  return { nums, ...analyzePick(nums), notes: ['Codex 랜덤 시드', '기본 랜덤 조합'] };
}

function genRecentAnalysisPick(data, latestDrw, seed) {
  const all45 = Array.from({ length:45 }, (_, i) => i + 1);
  const rand = seededRand(seed);
  const recent = data.slice(-10);
  const last = recent[recent.length - 1];
  const freq10 = getFrequency(recent);
  const lastSeen = new Array(46).fill(0);
  const pair = Array.from({ length:46 }, () => new Array(46).fill(0));

  recent.forEach(({ drw, nums }) => {
    nums.forEach(n => { lastSeen[n] = Math.max(lastSeen[n], drw); });
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        pair[nums[i]][nums[j]]++;
        pair[nums[j]][nums[i]]++;
      }
    }
  });

  const rows = all45.map(n => {
    const gap = lastSeen[n] ? latestDrw - lastSeen[n] : 10;
    const termScore = gap >= 3 && gap <= 8 ? 8 : gap >= 9 ? 5 : gap === 2 ? 3 : -2;
    const repeatScore = last?.nums.includes(n) ? 5 : 0;
    return {
      n,
      gap,
      score: freq10[n] * 5 + termScore + repeatScore + rand() * 2,
      hot: freq10[n],
      repeated: Boolean(last?.nums.includes(n)),
    };
  });

  const hotPool = [...rows].sort((a, b) => b.hot - a.hot || b.score - a.score).slice(0, 14);
  const termPool = [...rows].sort((a, b) => b.gap - a.gap || b.score - a.score).slice(0, 16);
  const repeatPool = rows.filter(r => r.repeated);
  let best = null, bestFit = -Infinity;

  for (let att = 0; att < 3000; att++) {
    const pk = new Set();
    const repeatTarget = repeatPool.length ? 1 + Math.floor(rand() * Math.min(2, repeatPool.length)) : 0;
    [...repeatPool].sort(() => rand() - 0.5).slice(0, repeatTarget).forEach(r => pk.add(r.n));
    [...hotPool].sort(() => rand() - 0.5).forEach(r => { if (pk.size < 3) pk.add(r.n); });
    [...termPool].sort(() => rand() - 0.5).forEach(r => { if (pk.size < 5) pk.add(r.n); });
    [...rows].sort((a, b) => b.score - a.score).forEach(r => { if (pk.size < 6) pk.add(r.n); });

    const nums = Array.from(pk).slice(0, 6).sort((a, b) => a - b);
    if (!isBalancedPick(nums)) continue;
    const p = analyzePick(nums);
    const overlap = last ? nums.filter(n => last.nums.includes(n)).length : 0;
    if (overlap < 1 || overlap > 2) continue;
    const pairFit = nums.reduce((acc, n, i) => acc + nums.slice(i + 1).reduce((s, m) => s + pair[n][m], 0), 0);
    const fit = nums.reduce((a, n) => a + rows.find(r => r.n === n).score, 0)
      + pairFit * 2
      - Math.abs(p.sum - 140) * 0.3
      + (overlap === 1 ? 4 : 2);
    if (fit > bestFit) { bestFit = fit; best = { nums, ...p, overlap, pairFit }; }
  }

  if (!best) {
    const nums = [...rows].sort((a, b) => b.score - a.score).slice(0, 6).map(r => r.n).sort((a, b) => a - b);
    best = { nums, ...analyzePick(nums), overlap: last ? nums.filter(n => last.nums.includes(n)).length : 0, pairFit: 0 };
  }

  const selected = best.nums.map(n => rows.find(r => r.n === n));
  const hotCount = selected.filter(r => r.hot >= 2).length;
  const termCount = selected.filter(r => r.gap >= 3).length;
  return {
    ...best,
    notes: [
      `최근 10회 중복 ${best.overlap}개`,
      `3회 이상 텀 ${termCount}개`,
      `최근 10회 2번 이상 출현 ${hotCount}개`,
    ],
  };
}

// ══════════════════════════════════════════════════════════════
// § 7. 공통 UI
// ══════════════════════════════════════════════════════════════
const ballColor = n => {
  if (n <= 10) return '#fbc400';
  if (n <= 20) return '#69c8f2';
  if (n <= 30) return '#ff7272';
  if (n <= 40) return '#aaaaaa';
  return '#b0d840';
};
function Ball({ n, size = 32, bonus = false }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background: bonus ? '#c084fc' : ballColor(n),
      color:'#fff', fontWeight:700, fontSize:size*0.38,
      margin:'0 2px', boxShadow:'0 1px 4px rgba(0,0,0,.3)',
    }}>{n}</span>
  );
}
function Card({ title, children, accent = '#1e293b', style: s = {} }) {
  return (
    <div style={{ background:'#1a1f35', borderRadius:12, padding:14, marginTop:12, border:`1px solid ${accent}`, ...s }}>
      {title && <div style={{ fontSize:14, fontWeight:700, color:'#a5b4fc', marginBottom:12 }}>{title}</div>}
      {children}
    </div>
  );
}
function Bar({ pct, color = '#6366f1', h = 14 }) {
  return (
    <div style={{ flex:1, background:'#1e293b', borderRadius:4, height:h, overflow:'hidden' }}>
      <div style={{ width:`${Math.min(Math.max(pct,0),100).toFixed(1)}%`, height:'100%', background:color, borderRadius:4 }} />
    </div>
  );
}
function RangeBtn({ values, labels, active, onChange, color = '#6366f1' }) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
      {values.map((v, i) => (
        <button key={String(v)} onClick={() => onChange(v)} style={{
          padding:'5px 11px', borderRadius:16, border:'none', cursor:'pointer',
          fontSize:11, fontWeight:600,
          background: active === v ? color : '#1e293b',
          color:      active === v ? '#fff' : '#94a3b8',
        }}>{labels[i]}</button>
      ))}
    </div>
  );
}
function Spinner() {
  return (
    <>
      <style>{`@keyframes lo_spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{
        display:'inline-block', width:15, height:15,
        border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff',
        borderRadius:'50%', animation:'lo_spin .7s linear infinite', flexShrink:0,
      }} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// § 8. 직접 입력 폼 — CORS 막혀도 수동 등록 가능
// ══════════════════════════════════════════════════════════════
function ManualInputForm({ latestDrw, onAdd }) {
  const [open,  setOpen]  = useState(false);
  const [drw,   setDrw]   = useState('');
  const [n1,setN1]=useState(''); const [n2,setN2]=useState(''); const [n3,setN3]=useState('');
  const [n4,setN4]=useState(''); const [n5,setN5]=useState(''); const [n6,setN6]=useState('');
  const [bon,  setBon]    = useState('');
  const [date, setDate]   = useState('');
  const [err,  setErr]    = useState('');

  const handleAdd = () => {
    setErr('');
    const drwN  = Number(drw);
    const nums  = [n1,n2,n3,n4,n5,n6].map(Number);
    const bonN  = Number(bon);

    if (!Number.isInteger(drwN) || drwN <= latestDrw) return setErr(`회차는 ${latestDrw + 1}회 이상이어야 합니다.`);
    if (drwN > getExpectedLatestDraw()) return setErr("아직 발표 시각이 되지 않은 회차입니다.");
    if (date && date !== drawDate(drwN)) return setErr("회차와 추첨일이 일치하지 않습니다.");
    if (nums.some(n => !Number.isInteger(n) || n < 1 || n > 45)) return setErr('번호는 1~45 사이 숫자만 입력하세요.');
    if (new Set(nums).size !== 6) return setErr('번호 6개가 모두 달라야 합니다.');
    if (!Number.isInteger(bonN) || bonN < 1 || bonN > 45 || nums.includes(bonN)) return setErr('보너스 번호가 잘못됐습니다.');

    onAdd({
      drw:   drwN,
      nums:  [...nums].sort((a, b) => a - b),
      bonus: bonN,
      date:  date || drawDate(drwN),
    });
    // 초기화
    setDrw(''); setN1(''); setN2(''); setN3(''); setN4(''); setN5(''); setN6(''); setBon(''); setDate('');
    setOpen(false);
  };

  const inp = (val, set, ph) => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
      style={{
        width:'100%', background:'#0f172a', border:'1px solid #334155',
        borderRadius:6, padding:'7px 9px', color:'#e2e8f0', fontSize:13,
        outline:'none', boxSizing:'border-box',
      }} />
  );

  return (
    <div style={{ marginTop:10 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', padding:'9px', borderRadius:8,
        border:'1px solid #6366f1', background:'transparent',
        color:'#818cf8', cursor:'pointer', fontWeight:600, fontSize:13,
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        ✏️ {open ? '직접 입력 닫기' : '당첨번호 직접 입력 (CORS 차단 시)'}
      </button>

      {open && (
        <div style={{ background:'#0f172a', borderRadius:10, padding:14, marginTop:8, border:'1px solid #334155' }}>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:10 }}>
            API가 막혀있을 때 동행복권 사이트에서 직접 확인 후 입력하세요.
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <div>
              <div style={{ fontSize:10, color:'#64748b', marginBottom:4 }}>회차 번호</div>
              {inp(drw, setDrw, `${latestDrw + 1}`)}
            </div>
            <div>
              <div style={{ fontSize:10, color:'#64748b', marginBottom:4 }}>추첨일 (선택)</div>
              {inp(date, setDate, '2026-04-11')}
            </div>
          </div>

          <div style={{ fontSize:10, color:'#64748b', marginBottom:4 }}>당첨번호 6개 (오름차순 불필요)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:4, marginBottom:8 }}>
            {[[n1,setN1],[n2,setN2],[n3,setN3],[n4,setN4],[n5,setN5],[n6,setN6]].map(([v,set], i) => (
              <input key={i} value={v} onChange={e => set(e.target.value)} placeholder={String(i+1)}
                style={{
                  background:'#1e293b', border:'1px solid #334155', borderRadius:6,
                  padding:'7px 4px', color:'#e2e8f0', fontSize:13, textAlign:'center',
                  outline:'none', width:'100%', boxSizing:'border-box',
                }} />
            ))}
          </div>

          <div style={{ fontSize:10, color:'#64748b', marginBottom:4 }}>보너스 번호</div>
          <div style={{ marginBottom:10, maxWidth:60 }}>
            {inp(bon, setBon, '보너스')}
          </div>

          {err && <div style={{ fontSize:11, color:'#f87171', marginBottom:8 }}>⚠ {err}</div>}

          <button onClick={handleAdd} style={{
            width:'100%', padding:10, borderRadius:8, border:'none',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13,
          }}>✅ 등록하기</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// § 9. 업데이트 탭
// ══════════════════════════════════════════════════════════════
function UpdateTab({ allData, latestDrw, status, log, lastFetch, onUpdate, onManualAdd, onClearCache }) {
  const [remain, setRemain] = useState(() => msUntilNextDrawUpdate());
  useEffect(() => {
    const id = setInterval(() => setRemain(msUntilNextDrawUpdate()), 60_000);
    return () => clearInterval(id);
  }, []);
  const expectedLatestDrw = getExpectedLatestDraw();
  const hh = Math.floor(remain / 3_600_000);
  const mm = Math.floor((remain % 3_600_000) / 60_000);
  const lastStr = lastFetch
    ? new Date(lastFetch).toLocaleString('ko-KR', { timeZone:'Asia/Seoul' })
    : '없음';

  return (
    <div>
      {/* 현황 */}
      <Card title="📡 데이터 현황" accent="#6366f1">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          {[
            ['총 회차',    `${allData.length}회`],
            ['최신 회차',  `제 ${latestDrw}회`],
            ['업데이트 대상', `제 ${expectedLatestDrw}회`],
            ['마지막 갱신', lastStr.split(' ')[0] || '없음'],
            ['갱신 시각',  lastStr.split(' ')[1] || '-'],
          ].map(([l, v]) => (
            <div key={l} style={{ background:'#0f172a', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'#64748b', marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#a5b4fc' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* ★ API 자동 업데이트 버튼 */}
        <button onClick={onUpdate} disabled={status === 'loading'} style={{
          width:'100%', padding:13, borderRadius:10, border:'none',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          background: status === 'loading' ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color:'#fff', fontWeight:700, fontSize:15,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          opacity: status === 'loading' ? 0.75 : 1, transition:'opacity .2s',
        }}>
          {status === 'loading' ? <><Spinner /> API 업데이트 중…</> : '🔄  API로 지금 업데이트'}
        </button>
        <div style={{ fontSize:11, color:'#475569', marginTop:5, textAlign:'center' }}>
          동행복권 API → 제 {latestDrw + 1}회 이후 신규 회차를 자동으로 가져옵니다
        </div>

        {/* ★ 직접 입력 폼 (CORS 차단 시 대안) */}
        <ManualInputForm latestDrw={latestDrw} onAdd={onManualAdd} />
      </Card>

      {/* 자동 스케줄 */}
      <Card title="⏰ 자동 업데이트 일정" accent="#f59e0b">
        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:10 }}>
          <span style={{ fontSize:36 }}>🗓</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fbbf24' }}>매주 토요일 오후 9:35 (KST)</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>결과 확인을 시작하며, 실패하면 5분 간격으로 재시도합니다</div>
          </div>
        </div>
        <div style={{
          background:'#0f172a', borderRadius:8, padding:'10px 14px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>다음 자동 업데이트까지</span>
          <span style={{ fontSize:17, fontWeight:700, color:'#fbbf24' }}>{hh}시간 {mm}분</span>
        </div>
        <div style={{ fontSize:11, color:'#475569', lineHeight:1.7, marginTop:8 }}>
          ※ 페이지가 열려 있을 때만 자동 실행됩니다.<br />
          ※ 페이지 재방문·화면 복귀·인터넷 재연결 시 갱신을 확인합니다.<br />
          ※ CORS 차단 환경: vite.config.js에 프록시 설정 또는 직접 입력 사용
        </div>
      </Card>

      {/* 로그 */}
      <Card title="📜 업데이트 로그">
        {log.length === 0
          ? <div style={{ fontSize:12, color:'#475569', textAlign:'center', padding:'16px 0' }}>아직 기록이 없습니다</div>
          : (
            <div style={{ maxHeight:220, overflowY:'auto' }}>
              {log.map((l, i) => (
                <div key={i} style={{
                  fontSize:11, padding:'4px 0', borderBottom:'1px solid #1e293b',
                  color: l.startsWith('✅') ? '#34d399' : l.startsWith('✏') ? '#60a5fa' : l.startsWith('ℹ') ? '#94a3b8' : '#f87171',
                }}>{l}</div>
              ))}
            </div>
          )
        }
      </Card>

      {/* CORS 안내 */}
      <Card title="🔧 CORS 차단 해결 방법" accent="#475569">
        <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.8 }}>
          <b style={{ color:'#a5b4fc' }}>방법 1 (권장) — vite.config.js 프록시 설정:</b><br />
          <code style={{ background:'#0f172a', padding:'6px 10px', borderRadius:6, display:'block', marginTop:4, marginBottom:8, fontSize:10, color:'#7dd3fc', whiteSpace:'pre' }}>{`server: {
  proxy: {
    '/api-lotto': {
      target: 'https://www.dhlottery.co.kr',
      changeOrigin: true,
      rewrite: p => p.replace('/api-lotto', '/common.do'),
    },
  },
},`}</code>
          <b style={{ color:'#a5b4fc' }}>방법 2 — 직접 입력:</b><br />
          동행복권 사이트에서 당첨번호 확인 후 위 "직접 입력" 폼 사용<br /><br />
          <b style={{ color:'#a5b4fc' }}>방법 3 — 공개 프록시 재시도:</b><br />
          네트워크 상태에 따라 다시 "API로 지금 업데이트" 버튼 클릭
        </div>
      </Card>

      {/* 캐시 초기화 */}
      <Card title="🗑 캐시 관리">
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:10 }}>
          API 또는 직접 입력으로 추가한 신규 회차 데이터를 삭제하고 내장 데이터로 복원합니다.
        </div>
        <button onClick={onClearCache} style={{
          padding:'8px 16px', borderRadius:8,
          border:'1px solid #ef4444', background:'transparent',
          color:'#ef4444', cursor:'pointer', fontWeight:600, fontSize:12,
        }}>⚠ 캐시 초기화</button>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// § 10. 나머지 탭 컴포넌트 (변경 없음)
// ══════════════════════════════════════════════════════════════
function FreqTab({ allData }) {
  const [range, setRange] = useState(52);
  const data  = range === 'all' ? allData : allData.slice(-range);
  const freq  = useMemo(() => getFrequency(data), [data]);
  const bFreq = useMemo(() => { const f=new Array(46).fill(0); data.forEach(d=>f[d.bonus]++); return f; }, [data]);
  const sorted = useMemo(() => Array.from({length:45},(_,i)=>i+1).sort((a,b)=>freq[b]-freq[a]), [freq]);
  const max=Math.max(...freq.slice(1)), bMax=Math.max(...bFreq.slice(1));
  return (
    <div>
      <Card title="조회 범위">
        <RangeBtn values={['all',52,26,13]} labels={['전체','1년','6개월','3개월']} active={range} onChange={setRange}/>
        <div style={{fontSize:11,color:'#64748b',marginTop:6}}>분석 대상: {data.length}회차</div>
      </Card>
      <Card title="🏆 많이 나온 번호 TOP 10">
        {sorted.slice(0,10).map((n,i)=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{width:18,color:'#f59e0b',fontWeight:700,fontSize:12}}>{i+1}</span>
            <Ball n={n} size={28}/>
            <Bar pct={freq[n]/max*100} color={ballColor(n)}/>
            <span style={{width:30,textAlign:'right',fontSize:12,color:'#94a3b8'}}>{freq[n]}</span>
          </div>
        ))}
      </Card>
      <Card title="🧊 적게 나온 번호 BOTTOM 10">
        {sorted.slice(-10).reverse().map((n,i)=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{width:18,color:'#64748b',fontWeight:700,fontSize:12}}>{i+1}</span>
            <Ball n={n} size={28}/>
            <Bar pct={freq[n]/max*100} color="#475569"/>
            <span style={{width:30,textAlign:'right',fontSize:12,color:'#94a3b8'}}>{freq[n]}</span>
          </div>
        ))}
      </Card>
      <Card title="🎱 전체 번호 출현 현황 (1~45)">
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {Array.from({length:45},(_,i)=>i+1).map(n=>(
            <div key={n} style={{width:46,background:'#1e293b',borderRadius:6,padding:'4px 2px',textAlign:'center'}}>
              <Ball n={n} size={28}/><div style={{fontSize:9,color:'#64748b',marginTop:2}}>{freq[n]}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="🟣 보너스 번호 TOP 5">
        {Array.from({length:45},(_,i)=>i+1).sort((a,b)=>bFreq[b]-bFreq[a]).slice(0,5).map((n,i)=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{width:18,color:'#c084fc',fontWeight:700,fontSize:12}}>{i+1}</span>
            <Ball n={n} size={28} bonus/>
            <Bar pct={bFreq[n]/bMax*100} color="#c084fc"/>
            <span style={{width:30,textAlign:'right',fontSize:12,color:'#94a3b8'}}>{bFreq[n]}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function PatternTab({ allData }) {
  const [range, setRange] = useState('all');
  const data = range === 'all' ? allData : allData.slice(-Number(range));
  const pats = useMemo(() => getPatterns(data), [data]);
  const N = pats.length;
  const stats = useMemo(() => {
    const sumDist={},oeDist={},hlDist={},consDist=new Array(7).fill(0);
    pats.forEach(p=>{
      const sb=Math.floor(p.sum/10)*10; sumDist[sb]=(sumDist[sb]||0)+1;
      const oeK=`홀${p.odd}짝${p.even}`; oeDist[oeK]=(oeDist[oeK]||0)+1;
      const hlK=`저${p.low}고${p.high}`; hlDist[hlK]=(hlDist[hlK]||0)+1;
      consDist[Math.min(p.consecutive,6)]++;
    });
    return { sumDist, oeDist, hlDist, consDist, avgSum:(pats.reduce((s,p)=>s+p.sum,0)/N).toFixed(1) };
  }, [pats, N]);
  const {sumDist,oeDist,hlDist,consDist,avgSum}=stats;
  const sumMax=Math.max(...Object.values(sumDist)), oeMax=Math.max(...Object.values(oeDist)), hlMax=Math.max(...Object.values(hlDist));
  return (
    <div>
      <Card title="조회 범위"><RangeBtn values={['all',104,52,13]} labels={['전체','2년','1년','3개월']} active={range} onChange={setRange}/></Card>
      <Card title="📊 요약">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[['분석 회차',`${N}회`],['평균 합계',avgSum],['합계 범위',`${Math.min(...pats.map(p=>p.sum))}~${Math.max(...pats.map(p=>p.sum))}`]].map(([l,v])=>(
            <div key={l} style={{background:'#0f172a',borderRadius:8,padding:'8px 10px'}}>
              <div style={{fontSize:10,color:'#64748b'}}>{l}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#a5b4fc'}}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="🔢 합계 분포 (권장: 100~175)">
        {Object.entries(sumDist).sort((a,b)=>Number(a[0])-Number(b[0])).map(([b,c])=>(
          <div key={b} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
            <span style={{width:62,fontSize:11,color:'#94a3b8'}}>{b}~{Number(b)+9}</span>
            <Bar pct={c/sumMax*100} color="#6366f1"/>
            <span style={{width:24,fontSize:11,color:'#94a3b8',textAlign:'right'}}>{c}</span>
            <span style={{width:38,fontSize:10,color:'#475569'}}>({(c/N*100).toFixed(0)}%)</span>
          </div>
        ))}
      </Card>
      <Card title="⚖️ 홀짝 비율">
        {Object.entries(oeDist).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
            <span style={{width:66,fontSize:11,color:'#94a3b8'}}>{k}</span>
            <Bar pct={v/oeMax*100} color="#f59e0b"/>
            <span style={{width:24,fontSize:11,color:'#94a3b8',textAlign:'right'}}>{v}</span>
            <span style={{width:38,fontSize:10,color:'#475569'}}>({(v/N*100).toFixed(1)}%)</span>
          </div>
        ))}
      </Card>
      <Card title="🔼🔽 고저 비율 (저≤22 / 고≥23)">
        {Object.entries(hlDist).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
            <span style={{width:66,fontSize:11,color:'#94a3b8'}}>{k}</span>
            <Bar pct={v/hlMax*100} color="#10b981"/>
            <span style={{width:24,fontSize:11,color:'#94a3b8',textAlign:'right'}}>{v}</span>
            <span style={{width:38,fontSize:10,color:'#475569'}}>({(v/N*100).toFixed(1)}%)</span>
          </div>
        ))}
      </Card>
      <Card title="🔗 연속번호 패턴">
        {[['없음',consDist[1]],['2연속',consDist[2]],['3연속',consDist[3]],['4연속+',consDist[4]+consDist[5]+consDist[6]]].map(([l,v])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
            <span style={{width:66,fontSize:11,color:'#94a3b8'}}>{l}</span>
            <Bar pct={v/N*100} color="#ec4899"/>
            <span style={{width:24,fontSize:11,color:'#94a3b8',textAlign:'right'}}>{v}</span>
            <span style={{width:38,fontSize:10,color:'#475569'}}>({(v/N*100).toFixed(1)}%)</span>
          </div>
        ))}
        <div style={{fontSize:11,color:'#64748b',marginTop:6}}>💡 연속없거나 2연속: 전체의 {((consDist[1]+consDist[2])/N*100).toFixed(0)}%</div>
      </Card>
    </div>
  );
}

function MissTab({ allData, latestDrw }) {
  const sorted = useMemo(() => {
    const la=new Array(46).fill(0);
    for (let i=allData.length-1;i>=0;i--) allData[i].nums.forEach(n=>{if(!la[n])la[n]=allData[i].drw;});
    return Array.from({length:45},(_,i)=>({n:i+1,last:la[i+1]||0,gap:la[i+1]?latestDrw-la[i+1]:latestDrw})).sort((a,b)=>b.gap-a.gap);
  }, [allData, latestDrw]);
  return (
    <div>
      <Card title={`⏳ 미출현 TOP 15 (기준: 제 ${latestDrw}회)`}>
        {sorted.slice(0,15).map(({n,last,gap},i)=>(
          <div key={n} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
            <span style={{width:16,fontSize:11,color:'#64748b'}}>{i+1}</span>
            <Ball n={n} size={28}/>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
                <span style={{color:'#94a3b8'}}>마지막: {last?`${last}회`:'미등장'}</span>
                <span style={{color:gap>=20?'#ef4444':gap>=10?'#fbbf24':'#34d399',fontWeight:700}}>{gap}회 결석</span>
              </div>
              <Bar pct={Math.min(gap/30*100,100)} color={gap>=20?'#ef4444':gap>=10?'#fbbf24':'#34d399'} h={8}/>
            </div>
          </div>
        ))}
        <div style={{fontSize:11,color:'#64748b',marginTop:4}}>🔴 20회↑ &nbsp;🟡 10~19회 &nbsp;🟢 10회 미만</div>
      </Card>
      <Card title="✅ 최근 3회 당첨번호">
        {allData.slice(-3).reverse().map(({drw,nums,bonus,date})=>(
          <div key={drw} style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
            <div style={{minWidth:52}}>
              <div style={{fontSize:11,color:'#6366f1',fontWeight:700}}>제{drw}회</div>
              {date&&<div style={{fontSize:9,color:'#475569'}}>{date}</div>}
            </div>
            {nums.map(n=><Ball key={n} n={n} size={28}/>)}
            <span style={{color:'#94a3b8',fontSize:11,margin:'0 2px'}}>+</span>
            <Ball n={bonus} size={28} bonus/>
          </div>
        ))}
      </Card>
    </div>
  );
}

function DecadeTab({ allData }) {
  const freq=useMemo(()=>getFrequency(allData),[allData]);
  const DR=[{label:'01~09',min:1,max:9,color:'#fbc400'},{label:'10~19',min:10,max:19,color:'#69c8f2'},{label:'20~29',min:20,max:29,color:'#ff7272'},{label:'30~39',min:30,max:39,color:'#aaaaaa'},{label:'40~45',min:40,max:45,color:'#b0d840'}];
  const totals=DR.map(r=>{let c=0;for(let n=r.min;n<=r.max;n++)c+=freq[n];return c;});
  const grand=totals.reduce((a,b)=>a+b,0);
  return (
    <div>
      <Card title="🗂 구간별 출현 비율">
        {DR.map((r,i)=>(
          <div key={r.label} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:13,fontWeight:600,color:r.color}}>{r.label}</span>
              <span style={{fontSize:11,color:'#94a3b8'}}>{totals[i]}회 ({(totals[i]/grand*100).toFixed(1)}%)</span>
            </div>
            <Bar pct={totals[i]/grand*100} color={r.color} h={16}/>
          </div>
        ))}
        <div style={{fontSize:11,color:'#64748b',marginTop:4}}>이론 균등 약 20% | 최다: {DR[totals.indexOf(Math.max(...totals))].label}</div>
      </Card>
      <Card title="🔢 구간별 번호 출현 순위">
        {DR.map(r=>{
          const nums=Array.from({length:r.max-r.min+1},(_,i)=>r.min+i).sort((a,b)=>freq[b]-freq[a]);
          return (
            <div key={r.label} style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:r.color,marginBottom:6}}>{r.label}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {nums.map(n=>(
                  <div key={n} style={{textAlign:'center'}}>
                    <Ball n={n} size={28}/><div style={{fontSize:9,color:'#64748b',marginTop:1}}>{freq[n]}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function IntegratedPick({ allData, latestDrw, seed, onRefresh }) {
  const res=useMemo(()=>genIntegrated(allData,latestDrw,seed),[allData,latestDrw,seed]);
  const sm =useMemo(()=>buildScoreMap(allData,latestDrw),[allData,latestDrw]);
  if(!res)return null;
  const {nums,sum,odd,even,low,high,maxRun}=res;
  const {score,absence,fAll,f13}=sm;
  const tags=nums.map(n=>{
    const t=[];
    if(absence[n-1]>=15) t.push({label:`${absence[n-1]}회 결석`,color:'#ef4444'});
    else if(absence[n-1]>=8) t.push({label:`${absence[n-1]}회 결석`,color:'#fbbf24'});
    const rank=[...Array.from({length:45},(_,i)=>i+1)].sort((a,b)=>fAll[b]-fAll[a]).indexOf(n);
    if(rank<8) t.push({label:'역대 고빈도',color:'#34d399'});
    if(rank>=37) t.push({label:'역대 저빈도',color:'#94a3b8'});
    const r13rank=[...Array.from({length:45},(_,i)=>i+1)].sort((a,b)=>f13[b]-f13[a]).indexOf(n);
    if(r13rank<5) t.push({label:'최근 핫',color:'#f97316'});
    return {n,tags:t};
  });
  const copyNumbers = async () => {
    const value = nums.join(', ');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      alert('추천번호가 복사되었습니다: ' + value);
    } catch {
      alert('복사에 실패했습니다. 번호를 수동으로 복사해 주세요.');
    }
  };
  const fitBars=[
    {label:'빈도 점수', pct:Math.min(nums.reduce((a,n)=>a+score[n],0)/nums.length/8*100,100),color:'#6366f1'},
    {label:'합계 적합', pct:Math.max(0,100-Math.abs(sum-140)*1.5),color:'#10b981'},
    {label:'홀짝 균형', pct:(1-Math.abs(odd-3)/3)*100,color:'#f59e0b'},
    {label:'미출현 반영',pct:Math.min(nums.filter(n=>absence[n-1]>=5).length/6*100+20,100),color:'#ef4444'},
    {label:'구간 분산', pct:(()=>{const z=[0,0,0,0,0];nums.forEach(n=>{z[n<=9?0:n<=19?1:n<=29?2:n<=39?3:4]++;});return(5-z.filter(v=>v===0).length)/5*100;})(),color:'#ec4899'},
  ];
  return (
    <div style={{background:'linear-gradient(135deg,#1e1b4b 0%,#0f172a 60%,#1a1035 100%)',borderRadius:16,padding:'18px 16px',marginTop:12,border:'2px solid #6366f1',boxShadow:'0 0 24px rgba(99,102,241,.25)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>⭐ 통합 추천번호</div>
          <div style={{fontSize:11,color:'#818cf8',marginTop:2}}>빈도·미출현·홀짝·합계·구간 5대 패턴 통합</div>
        </div>
        <div style={{fontSize:11,color:'#6366f1',fontWeight:700,background:'#1e293b',borderRadius:20,padding:'4px 10px'}}>제 {latestDrw+1}회</div>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {nums.map(n=>(
          <span key={n} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:44,height:44,borderRadius:'50%',background:ballColor(n),color:'#fff',fontWeight:800,fontSize:17,boxShadow:`0 0 12px ${ballColor(n)}88`}}>{n}</span>
        ))}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:14,justifyContent:'center'}}>
        {tags.map(({n,tags:tg})=>tg.map((t,i)=>(
          <span key={`${n}-${i}`} style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:10,background:`${t.color}22`,color:t.color,border:`1px solid ${t.color}44`}}>{n}번 · {t.label}</span>
        )))}
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16,justifyContent:'center'}}>
        {[{l:'합계',v:sum,good:sum>=115&&sum<=165},{l:'홀짝',v:`홀${odd}짝${even}`,good:odd>=2&&odd<=4},{l:'고저',v:`저${low}고${high}`,good:low>=2&&low<=4},{l:'최대연속',v:`${maxRun}개`,good:maxRun<=2}].map(({l,v,good})=>(
          <div key={l} style={{background:'#0f172a',borderRadius:8,padding:'5px 10px',textAlign:'center',border:`1px solid ${good?'#34d39955':'#475569'}`}}>
            <div style={{fontSize:9,color:'#64748b'}}>{l}</div>
            <div style={{fontSize:13,fontWeight:700,color:good?'#34d399':'#f87171'}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#0f172a',borderRadius:10,padding:'10px 12px',marginBottom:14}}>
        <div style={{fontSize:11,color:'#64748b',marginBottom:8}}>📐 패턴 충족도</div>
        {fitBars.map(({label,pct,color})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{width:68,fontSize:10,color:'#94a3b8',flexShrink:0}}>{label}</span>
            <Bar pct={pct} color={color} h={8}/>
            <span style={{width:28,fontSize:10,color,textAlign:'right',fontWeight:700}}>{pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <button onClick={copyNumbers} style={{width:'100%',padding:10,borderRadius:10,border:'1px solid #6366f1',cursor:'pointer',background:'#0f172a',color:'#a5b4fc',fontWeight:800,fontSize:14}}>📋 번호 복사</button>
        <button onClick={onRefresh} style={{width:'100%',padding:10,borderRadius:10,border:'none',cursor:'pointer',background:'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7)',color:'#fff',fontWeight:800,fontSize:14,boxShadow:'0 2px 12px rgba(99,102,241,.4)'}}>🔮 통합번호 재분석</button>
      </div>
    </div>
  );
}

function SimpleRecommendBox({ title, subtitle, pick, onRefresh, accent = '#6366f1' }) {
  if (!pick) return null;
  const copyNumbers = async () => {
    const value = pick.nums.join(', ');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      alert('추천번호가 복사되었습니다: ' + value);
    } catch {
      alert('복사에 실패했습니다. 번호를 수동으로 복사해 주세요.');
    }
  };
  return (
    <Card title={title} accent={accent} style={{background:'linear-gradient(135deg,#171b2d,#111827)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:12}}>
        <div style={{fontSize:11,color:'#94a3b8',lineHeight:1.5}}>{subtitle}</div>
        <div style={{fontSize:10,color:accent,fontWeight:800,background:'#0f172a',borderRadius:20,padding:'4px 9px',whiteSpace:'nowrap'}}>제 {pick.targetDrw}회</div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:4,marginBottom:12}}>
        {pick.nums.map(n => <Ball key={n} n={n} size={40}/>)}
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:12}}>
        {[
          ['합계', pick.sum],
          ['홀짝', `홀${pick.odd}짝${pick.even}`],
          ['고저', `저${pick.low}고${pick.high}`],
          ['연속', `${pick.maxRun}개`],
        ].map(([label, value]) => (
          <div key={label} style={{background:'#0f172a',borderRadius:8,padding:'5px 9px',textAlign:'center',border:'1px solid #26324a'}}>
            <div style={{fontSize:9,color:'#64748b'}}>{label}</div>
            <div style={{fontSize:12,fontWeight:800,color:'#c4b5fd'}}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12,justifyContent:'center'}}>
        {pick.notes.map(note => (
          <span key={note} style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background:`${accent}22`,color:accent,border:`1px solid ${accent}44`}}>{note}</span>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <button onClick={copyNumbers} style={{width:'100%',padding:10,borderRadius:8,border:`1px solid ${accent}`,background:'#0f172a',color:accent,fontWeight:800,cursor:'pointer',fontSize:13}}>번호 복사</button>
        <button onClick={onRefresh} style={{width:'100%',padding:10,borderRadius:8,border:'none',background:accent,color:'#0f172a',fontWeight:800,cursor:'pointer',fontSize:13}}>새 번호 생성</button>
      </div>
    </Card>
  );
}

function RecommendTab({ allData, latestDrw }) {
  const [intSeed,setIntSeed]=useState(()=>Date.now()&0xffffff);
  const [stratSeed,setStratSeed]=useState(()=>(Date.now()+1)&0xffffff);
  const [aiSeed,setAiSeed]=useState(()=>(Date.now()+2)&0xffffff);
  const [recentSeed,setRecentSeed]=useState(()=>(Date.now()+3)&0xffffff);
  const aiPick=useMemo(()=>({
    ...genCodexAiPick(allData,latestDrw,aiSeed),
    targetDrw: latestDrw + 1,
  }),[allData,latestDrw,aiSeed]);
  const recentPick=useMemo(()=>({
    ...genRecentAnalysisPick(allData,latestDrw,recentSeed),
    targetDrw: latestDrw + 1,
  }),[allData,latestDrw,recentSeed]);
  const combos=useMemo(()=>genStrategies(allData,latestDrw,stratSeed),[allData,latestDrw,stratSeed]);
  return (
    <div>
      <SimpleRecommendBox
        title="🤖 AI 추천번호"
        subtitle="Codex가 확률 균형을 깨지 않는 선에서 임의 시드로 생성한 추천 조합입니다."
        pick={aiPick}
        accent="#22c55e"
        onRefresh={()=>setAiSeed(Date.now()&0xffffff)}
      />
      <SimpleRecommendBox
        title="🧠 최근 분석 추천번호"
        subtitle="최근 10회 당첨번호 기준으로 출현 빈도, 번호 간 텀, 직전 회차 중복, 조합 패턴을 반영했습니다."
        pick={recentPick}
        accent="#f59e0b"
        onRefresh={()=>setRecentSeed(Date.now()&0xffffff)}
      />
      <IntegratedPick allData={allData} latestDrw={latestDrw} seed={intSeed} onRefresh={()=>setIntSeed(Date.now()&0xffffff)}/>
      <Card title={`🎯 전략별 추천번호 (제 ${latestDrw+1}회)`} accent="#6366f1">
        <div style={{fontSize:11,color:'#64748b',marginBottom:12}}>전체빈도 30% · 최근1년 50% · 최근3개월 80% · 미출현 보너스 반영</div>
        {combos.map((c,i)=>(
          <div key={i} style={{background:'#0f172a',borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:12,color:'#818cf8',fontWeight:700,marginBottom:8}}>{c.name}</div>
            <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:2,marginBottom:8}}>
              {c.nums.map(n=><Ball key={n} n={n} size={36}/>)}
            </div>
            <div style={{display:'flex',gap:12,fontSize:11,color:'#94a3b8'}}>
              <span>합계: <b style={{color:'#a5b4fc'}}>{c.sum}</b></span>
              <span>홀짝: <b style={{color:'#a5b4fc'}}>홀{c.odd}짝{c.even}</b></span>
            </div>
          </div>
        ))}
        <button onClick={()=>setStratSeed(Date.now()&0xffffff)} style={{width:'100%',padding:11,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:14}}>🔄 새로 생성</button>
        <div style={{fontSize:10,color:'#475569',marginTop:8,textAlign:'center'}}>※ 로또는 순수 확률 게임입니다. 당첨을 보장하지 않습니다.</div>
      </Card>
      <Card title="📌 주간 고정 조합">
        {[{day:'월',nums:[6,16,25,27,29,36]},{day:'화',nums:[12,14,15,25,33,35]},{day:'수',nums:[4,6,8,31,34,41]},{day:'목',nums:[4,14,17,18,30,33]},{day:'금★',nums:[5,8,14,31,35,41]}].map(c=>(
          <div key={c.day} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{width:26,fontSize:12,color:'#6366f1',fontWeight:700}}>{c.day}</span>
            {c.nums.map(n=><Ball key={n} n={n} size={28}/>)}
            <span style={{fontSize:11,color:'#475569',marginLeft:4}}>합:{c.nums.reduce((a,b)=>a+b,0)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function RecentTab({ allData }) {
  const [n,setN]=useState(10);
  const recent=allData.slice(-n).reverse();
  return (
    <div>
      <Card title="최근 회차 조회"><RangeBtn values={[5,10,20,30]} labels={['5회','10회','20회','30회']} active={n} onChange={setN}/></Card>
      {recent.map(({drw,nums,bonus,date})=>{
        const sum=nums.reduce((a,b)=>a+b,0), odd=nums.filter(n=>n%2===1).length;
        return (
          <div key={drw} style={{background:'#1a1f35',borderRadius:10,padding:12,marginBottom:8,border:'1px solid #1e293b'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <div>
                <span style={{fontSize:14,fontWeight:700,color:'#6366f1'}}>제 {drw}회</span>
                {date&&<span style={{fontSize:10,color:'#475569',marginLeft:7}}>{date}</span>}
              </div>
              <span style={{fontSize:11,color:'#475569'}}>합:{sum} 홀{odd}짝{6-odd}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:2}}>
              {nums.map(n=><Ball key={n} n={n} size={28}/>)}
              <span style={{color:'#94a3b8',fontSize:12,margin:'0 4px'}}>+</span>
              <Ball n={bonus} size={28} bonus/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// § 11. 메인 페이지
// ══════════════════════════════════════════════════════════════
const TABS = [
  { id:'update',    label:'🔄 업데이트' },
  { id:'freq',      label:'📊 빈도' },
  { id:'pattern',   label:'🔢 패턴' },
  { id:'miss',      label:'⏳ 미출현' },
  { id:'decade',    label:'🗂 구간' },
  { id:'recommend', label:'🎯 추천' },
  { id:'recent',    label:'📋 최근' },
];

export default function LottoRecommend() {
  const [tab,       setTab]      = useState('recommend');
  const [allData,   setAllData]  = useState(() => currentDraws());
  const [latestDrw, setLatestDrw]= useState(() => currentDraws().at(-1)?.drw || BASE_LATEST_DRW);
  const [status,    setStatus]   = useState('idle');
  const [log,       setLog]      = useState([]);
  const [lastFetch, setLastFetch]= useState(() => lastSuccess());

  // 방문 카운팅 (앱별 집계)
  useEffect(() => {
    trackVisit('lotto');
  }, []);

  const applyData = useCallback((data) => {
    setAllData(data); setLatestDrw(data.at(-1)?.drw || BASE_LATEST_DRW);
    setLastFetch(lastSuccess()); setStatus('success');
  }, []);
  const doFetch = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await syncLatestDraws(); applyData(data);
      setLog(prev => [`✅ 공식 데이터 확인 완료: 1~${data.at(-1).drw}회`, ...prev].slice(0,60));
    } catch (e) {
      setStatus('error'); setLog(prev => [`⚠️ ${e.message} — 5분 후 자동 재시도`, ...prev].slice(0,60));
    }
  }, [applyData]);
  useEffect(() => watchLotto(applyData, e => {
    setStatus('error'); setLog(prev => [`⚠️ ${e.message} — 5분 후 자동 재시도`, ...prev].slice(0,60));
  }), [applyData]);
  const handleManualAdd = useCallback(draw => {
    saveDraws([draw]);
    setLog(prev => [`✏️ ${draw.drw}회 로컬 입력 (자동 검증 대기)`, ...prev].slice(0,60));
    setStatus('idle');
  }, []);
  const handleClearCache = useCallback(() => {
    if (!window.confirm('캐시를 삭제하고 공식 기본 데이터로 복원합니다. 계속하시겠습니까?')) return;
    clearDrawCache(); setAllData(currentDraws()); setLatestDrw(BASE_LATEST_DRW);
    setLastFetch(0); setLog(['캐시 초기화 완료']); setStatus('idle');
  }, []);

  const statusBadge = { loading:<span style={{color:'#fbbf24'}}> · 업데이트 중…</span>, success:<span style={{color:'#34d399'}}> · ✓ 최신</span>, error:<span style={{color:'#f87171'}}> · ⚠ 오류</span> }[status] ?? null;

  // 최신 회차 (상단 고정 표시용) — 실제 당첨번호가 있는 마지막 회차
  const latestDraw = useMemo(
    () => allData.find(d => d.drw === latestDrw) || allData[allData.length - 1] || null,
    [allData, latestDrw]
  );

  return (
    <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',Arial,sans-serif",background:'#0f0f1a',width:'100vw',minHeight:'100vh',overflowY:'auto',color:'#e2e8f0',paddingBottom:60,boxSizing:'border-box'}}>
      <div style={{background:'linear-gradient(135deg,#1e1b4b,#312e81)',padding:'18px 16px 14px',textAlign:'center'}}>
        <div style={{fontSize:21,fontWeight:800,color:'#a5b4fc',letterSpacing:'-0.5px'}}>🎱 로또 6/45 완전 분석</div>
        <div style={{fontSize:12,color:'#818cf8',marginTop:3}}>
          제 1회 ~ 제 <b style={{color:'#a5b4fc'}}>{latestDrw}</b>회 &nbsp;·&nbsp; 총 <b style={{color:'#a5b4fc'}}>{allData.length}</b>회차 학습{statusBadge}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:5,marginTop:12,flexWrap:'wrap'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'6px 11px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,background:tab===t.id?'#6366f1':'#1e293b',color:tab===t.id?'#fff':'#94a3b8',transition:'background .15s'}}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* 최신 회차 당첨번호 — 탭 아래 상단 고정(sticky) */}
      {latestDraw && (
        <div style={{
          position:'sticky', top:0, zIndex:20,
          background:'rgba(15,15,26,0.96)', backdropFilter:'blur(6px)',
          borderBottom:'1px solid #1e293b', boxShadow:'0 2px 10px rgba(0,0,0,.35)',
          padding:'8px 12px',
        }}>
          <div style={{maxWidth:500, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap'}}>
            <div style={{display:'flex', flexDirection:'column', lineHeight:1.15}}>
              <span style={{fontSize:12, fontWeight:800, color:'#a5b4fc', whiteSpace:'nowrap'}}>🏆 최신 제{latestDraw.drw}회</span>
              {latestDraw.date && <span style={{fontSize:9, color:'#475569', whiteSpace:'nowrap'}}>{latestDraw.date}</span>}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:1}}>
              {latestDraw.nums.map(n=><Ball key={n} n={n} size={26}/>)}
              <span style={{color:'#94a3b8', fontSize:12, margin:'0 3px'}}>+</span>
              <Ball n={latestDraw.bonus} size={26} bonus/>
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:500,margin:'0 auto',padding:'0 12px'}}>
        {tab==='update'    && <UpdateTab allData={allData} latestDrw={latestDrw} status={status} log={log} lastFetch={lastFetch} onUpdate={()=>doFetch(latestDrw)} onManualAdd={handleManualAdd} onClearCache={handleClearCache}/>}
        {tab==='freq'      && <FreqTab    allData={allData}/>}
        {tab==='pattern'   && <PatternTab allData={allData}/>}
        {tab==='miss'      && <MissTab    allData={allData} latestDrw={latestDrw}/>}
        {tab==='decade'    && <DecadeTab  allData={allData}/>}
        {tab==='recommend' && <RecommendTab allData={allData} latestDrw={latestDrw}/>}
        {tab==='recent'    && <RecentTab  allData={allData}/>}
      </div>
    </div>
  );
}
