// Official draw snapshot; refreshed by npm run lotto:update.
import draws from '../data/lotto-draws.json' with { type: 'json' }
export const BASE_KNOWN = draws

export const LATEST_DRW = BASE_KNOWN[BASE_KNOWN.length - 1].drw;

// ── 1~45 출현 빈도 ───────────────────────────────────────────
export function getFrequency(data = BASE_KNOWN) {
  const f = new Array(46).fill(0);
  data.forEach(({ nums }) => nums.forEach(n => { f[n]++; }));
  return f;
}

// ── 번호별 통계 (빈도·순위·마지막 출현 회차) ──────────────────
export function getNumberStats(data = BASE_KNOWN) {
  const freq = getFrequency(data);
  const lastDrw = new Array(46).fill(0);
  data.forEach(({ drw, nums }) => nums.forEach(n => { lastDrw[n] = Math.max(lastDrw[n], drw); }));

  const stats = [];
  for (let n = 1; n <= 45; n++) {
    stats.push({ n, freq: freq[n], lastDrw: lastDrw[n] });
  }
  // 빈도 내림차순 순위 부여
  const ranked = [...stats].sort((a, b) => b.freq - a.freq);
  ranked.forEach((s, i) => { s.rank = i + 1; });
  return stats; // n 순서(1~45) 유지, 각 항목에 rank 포함
}

// ── 빈도 가중 무작위 6개 추첨 (비복원) ────────────────────────
export function drawWeighted(freq = getFrequency(), count = 6) {
  const pool = [];
  for (let n = 1; n <= 45; n++) {
    // 빈도가 높을수록 뽑힐 확률↑ (최소 1 보장)
    const w = Math.max(1, freq[n]);
    for (let i = 0; i < w; i++) pool.push(n);
  }
  const picked = new Set();
  while (picked.size < count && pool.length) {
    picked.add(pool[Math.floor(Math.random() * pool.length)]);
  }
  // 부족하면 순수 랜덤으로 채움
  while (picked.size < count) picked.add(Math.floor(Math.random() * 45) + 1);
  return Array.from(picked).sort((a, b) => a - b);
}

// ── 볼 색상 (동행복권 공식 색상) ──────────────────────────────
export const ballColor = (n) => {
  if (n <= 10) return '#fbc400';
  if (n <= 20) return '#69c8f2';
  if (n <= 30) return '#ff7272';
  if (n <= 40) return '#aaaaaa';
  return '#b0d840';
};
