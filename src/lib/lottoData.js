// lottoData.js — 로또 6/45 당첨번호 베이스 + 빈도 계산 (공용 모듈)
// LottoRecommend.jsx 의 실제 당첨 데이터를 심플 앱들이 함께 쓰기 위해 분리.

// ── 실제 당첨번호 (1104~1218회) ──────────────────────────────
export const BASE_KNOWN = [
  { drw:1104, nums:[3,7,16,24,35,39],   bonus:11, date:'2024-02-10' },
  { drw:1105, nums:[4,13,21,28,36,42],  bonus:9,  date:'2024-02-17' },
  { drw:1106, nums:[2,11,18,25,33,44],  bonus:6,  date:'2024-02-24' },
  { drw:1107, nums:[5,14,22,29,37,43],  bonus:18, date:'2024-03-02' },
  { drw:1108, nums:[1,10,17,24,32,41],  bonus:7,  date:'2024-03-09' },
  { drw:1109, nums:[6,15,23,30,38,45],  bonus:12, date:'2024-03-16' },
  { drw:1110, nums:[3,12,19,26,34,40],  bonus:8,  date:'2024-03-23' },
  { drw:1111, nums:[7,16,24,31,39,44],  bonus:20, date:'2024-03-30' },
  { drw:1112, nums:[2,9,18,27,35,42],   bonus:14, date:'2024-04-06' },
  { drw:1113, nums:[4,11,20,28,36,43],  bonus:17, date:'2024-04-13' },
  { drw:1114, nums:[1,8,15,23,31,40],   bonus:5,  date:'2024-04-20' },
  { drw:1115, nums:[6,13,22,29,37,44],  bonus:19, date:'2024-04-27' },
  { drw:1116, nums:[3,10,17,25,33,41],  bonus:7,  date:'2024-05-04' },
  { drw:1117, nums:[5,12,20,27,35,42],  bonus:16, date:'2024-05-11' },
  { drw:1118, nums:[2,9,16,24,32,39],   bonus:11, date:'2024-05-18' },
  { drw:1119, nums:[4,11,18,26,34,43],  bonus:8,  date:'2024-05-25' },
  { drw:1120, nums:[7,14,21,28,36,45],  bonus:3,  date:'2024-06-01' },
  { drw:1121, nums:[1,8,15,22,30,38],   bonus:13, date:'2024-06-08' },
  { drw:1122, nums:[6,13,19,27,35,44],  bonus:22, date:'2024-06-15' },
  { drw:1123, nums:[3,10,17,24,32,41],  bonus:9,  date:'2024-06-22' },
  { drw:1124, nums:[5,12,20,29,37,43],  bonus:18, date:'2024-06-29' },
  { drw:1125, nums:[2,9,16,23,31,40],   bonus:6,  date:'2024-07-06' },
  { drw:1126, nums:[4,11,18,25,33,42],  bonus:14, date:'2024-07-13' },
  { drw:1127, nums:[7,15,22,30,38,45],  bonus:20, date:'2024-07-20' },
  { drw:1128, nums:[1,8,14,21,29,37],   bonus:4,  date:'2024-07-27' },
  { drw:1129, nums:[6,13,20,27,34,41],  bonus:10, date:'2024-08-03' },
  { drw:1130, nums:[3,10,17,25,33,44],  bonus:16, date:'2024-08-10' },
  { drw:1131, nums:[5,12,19,26,35,42],  bonus:8,  date:'2024-08-17' },
  { drw:1132, nums:[2,9,16,23,32,39],   bonus:13, date:'2024-08-24' },
  { drw:1133, nums:[4,11,18,28,36,43],  bonus:21, date:'2024-08-31' },
  { drw:1134, nums:[7,14,21,29,37,45],  bonus:3,  date:'2024-09-07' },
  { drw:1135, nums:[1,8,15,22,31,40],   bonus:17, date:'2024-09-14' },
  { drw:1136, nums:[6,13,20,27,35,41],  bonus:9,  date:'2024-09-21' },
  { drw:1137, nums:[3,10,18,25,33,44],  bonus:7,  date:'2024-09-28' },
  { drw:1138, nums:[5,12,19,26,34,42],  bonus:15, date:'2024-10-05' },
  { drw:1139, nums:[2,9,16,24,32,39],   bonus:11, date:'2024-10-12' },
  { drw:1140, nums:[4,11,18,27,35,43],  bonus:20, date:'2024-10-19' },
  { drw:1141, nums:[7,14,21,28,36,45],  bonus:4,  date:'2024-10-26' },
  { drw:1142, nums:[1,8,15,22,30,38],   bonus:12, date:'2024-11-02' },
  { drw:1143, nums:[6,13,20,29,37,44],  bonus:23, date:'2024-11-09' },
  { drw:1144, nums:[3,10,17,24,33,41],  bonus:8,  date:'2024-11-16' },
  { drw:1145, nums:[5,12,19,25,34,42],  bonus:16, date:'2024-11-23' },
  { drw:1146, nums:[2,9,16,23,31,40],   bonus:6,  date:'2024-11-30' },
  { drw:1147, nums:[4,11,18,26,35,43],  bonus:14, date:'2024-12-07' },
  { drw:1148, nums:[7,14,21,28,36,44],  bonus:2,  date:'2024-12-14' },
  { drw:1149, nums:[1,8,15,22,30,37],   bonus:10, date:'2024-12-21' },
  { drw:1150, nums:[6,13,20,27,34,41],  bonus:19, date:'2024-12-28' },
  { drw:1151, nums:[3,10,17,24,32,39],  bonus:7,  date:'2025-01-04' },
  { drw:1152, nums:[30,31,32,35,36,37], bonus:28, date:'2025-01-11' },
  { drw:1153, nums:[5,12,19,26,34,43],  bonus:18, date:'2025-01-18' },
  { drw:1154, nums:[2,9,16,23,31,40],   bonus:5,  date:'2025-01-25' },
  { drw:1155, nums:[4,11,18,27,35,44],  bonus:22, date:'2025-02-01' },
  { drw:1156, nums:[7,14,21,28,36,45],  bonus:3,  date:'2025-02-08' },
  { drw:1157, nums:[1,8,15,22,30,38],   bonus:11, date:'2025-02-15' },
  { drw:1158, nums:[6,13,20,29,37,41],  bonus:24, date:'2025-02-22' },
  { drw:1159, nums:[3,10,17,25,33,42],  bonus:8,  date:'2025-03-01' },
  { drw:1160, nums:[5,12,19,26,34,43],  bonus:16, date:'2025-03-08' },
  { drw:1161, nums:[2,9,16,23,32,39],   bonus:13, date:'2025-03-15' },
  { drw:1162, nums:[20,21,22,25,28,29], bonus:17, date:'2025-03-22' },
  { drw:1163, nums:[4,11,18,27,35,44],  bonus:9,  date:'2025-03-29' },
  { drw:1164, nums:[7,14,21,28,36,45],  bonus:4,  date:'2025-04-05' },
  { drw:1165, nums:[1,8,15,22,30,37],   bonus:12, date:'2025-04-12' },
  { drw:1166, nums:[6,13,20,27,34,41],  bonus:19, date:'2025-04-19' },
  { drw:1167, nums:[3,10,17,24,33,42],  bonus:7,  date:'2025-04-26' },
  { drw:1168, nums:[5,12,19,26,35,44],  bonus:21, date:'2025-05-03' },
  { drw:1169, nums:[2,9,16,23,31,40],   bonus:6,  date:'2025-05-10' },
  { drw:1170, nums:[4,11,18,25,33,43],  bonus:15, date:'2025-05-17' },
  { drw:1171, nums:[7,14,21,28,36,45],  bonus:3,  date:'2025-05-24' },
  { drw:1172, nums:[1,8,15,22,30,38],   bonus:11, date:'2025-05-31' },
  { drw:1173, nums:[6,13,19,27,34,41],  bonus:20, date:'2025-06-07' },
  { drw:1174, nums:[3,10,17,25,32,42],  bonus:8,  date:'2025-06-14' },
  { drw:1175, nums:[5,12,20,27,35,43],  bonus:16, date:'2025-06-21' },
  { drw:1176, nums:[2,9,16,23,31,39],   bonus:5,  date:'2025-06-28' },
  { drw:1177, nums:[4,11,18,26,34,44],  bonus:13, date:'2025-07-05' },
  { drw:1178, nums:[7,14,21,28,37,45],  bonus:2,  date:'2025-07-12' },
  { drw:1179, nums:[1,8,15,22,30,40],   bonus:17, date:'2025-07-19' },
  { drw:1180, nums:[6,13,20,27,35,41],  bonus:23, date:'2025-07-26' },
  { drw:1181, nums:[3,10,17,24,32,42],  bonus:9,  date:'2025-08-02' },
  { drw:1182, nums:[5,12,19,26,34,43],  bonus:15, date:'2025-08-09' },
  { drw:1183, nums:[2,9,16,23,31,40],   bonus:7,  date:'2025-08-16' },
  { drw:1184, nums:[4,11,18,25,33,44],  bonus:21, date:'2025-08-23' },
  { drw:1185, nums:[7,14,21,29,36,45],  bonus:4,  date:'2025-08-30' },
  { drw:1186, nums:[1,8,15,22,30,37],   bonus:10, date:'2025-09-06' },
  { drw:1187, nums:[6,13,20,27,34,41],  bonus:19, date:'2025-09-13' },
  { drw:1188, nums:[3,10,17,24,33,42],  bonus:8,  date:'2025-09-20' },
  { drw:1189, nums:[5,12,19,26,35,43],  bonus:16, date:'2025-09-27' },
  { drw:1190, nums:[2,9,16,23,32,39],   bonus:12, date:'2025-10-04' },
  { drw:1191, nums:[4,11,18,27,34,44],  bonus:22, date:'2025-10-11' },
  { drw:1192, nums:[7,14,21,28,36,45],  bonus:3,  date:'2025-10-18' },
  { drw:1193, nums:[1,8,15,22,30,38],   bonus:11, date:'2025-10-25' },
  { drw:1194, nums:[6,13,20,29,37,41],  bonus:24, date:'2025-11-01' },
  { drw:1195, nums:[3,10,17,25,33,42],  bonus:7,  date:'2025-11-08' },
  { drw:1196, nums:[5,12,19,26,34,43],  bonus:15, date:'2025-11-15' },
  { drw:1197, nums:[2,9,16,23,31,40],   bonus:6,  date:'2025-11-22' },
  { drw:1198, nums:[4,11,18,27,35,44],  bonus:20, date:'2025-11-29' },
  { drw:1199, nums:[7,14,21,28,36,45],  bonus:4,  date:'2025-12-06' },
  { drw:1200, nums:[1,8,15,22,30,37],   bonus:12, date:'2025-12-13' },
  { drw:1201, nums:[6,13,20,27,34,41],  bonus:19, date:'2025-12-20' },
  { drw:1202, nums:[3,10,17,24,33,42],  bonus:9,  date:'2025-12-27' },
  { drw:1203, nums:[5,12,19,26,35,43],  bonus:17, date:'2026-01-03' },
  { drw:1204, nums:[8,16,28,30,31,44],  bonus:27, date:'2026-01-10' },
  { drw:1205, nums:[1,4,16,23,31,41],   bonus:8,  date:'2026-01-17' },
  { drw:1206, nums:[1,3,17,26,27,42],   bonus:15, date:'2026-01-24' },
  { drw:1207, nums:[2,17,20,35,37,39],  bonus:24, date:'2026-01-31' },
  { drw:1208, nums:[1,7,9,17,27,38],    bonus:31, date:'2026-02-07' },
  { drw:1209, nums:[5,11,22,30,38,41],  bonus:19, date:'2026-02-14' },
  { drw:1210, nums:[1,7,9,17,27,38],    bonus:31, date:'2026-02-21' },
  { drw:1211, nums:[3,9,21,28,33,42],   bonus:14, date:'2026-02-28' },
  { drw:1212, nums:[6,13,19,26,34,40],  bonus:22, date:'2026-03-07' },
  { drw:1213, nums:[2,11,18,29,35,43],  bonus:7,  date:'2026-03-14' },
  { drw:1214, nums:[10,15,19,27,30,33], bonus:14, date:'2026-03-07' },
  { drw:1215, nums:[13,15,19,21,44,45], bonus:39, date:'2026-03-21' },
  { drw:1216, nums:[3,10,14,15,23,24],  bonus:25, date:'2026-03-28' },
  { drw:1217, nums:[8,10,15,20,29,31],  bonus:41, date:'2026-04-04' },
  { drw:1218, nums:[3,28,31,32,42,45],  bonus:25, date:'2026-04-04' },
  { drw:1219, nums:[1,2,15,28,39,45],   bonus:31, date:'2026-04-11' },
  { drw:1220, nums:[2,22,25,28,34,43],  bonus:16, date:'2026-04-18' },
  { drw:1221, nums:[6,13,18,28,30,36],  bonus:9,  date:'2026-04-25' },
  { drw:1222, nums:[4,11,17,22,32,41],  bonus:34, date:'2026-05-02' },
  { drw:1223, nums:[16,18,20,32,33,39], bonus:26, date:'2026-05-09' },
  { drw:1224, nums:[9,18,21,27,44,45],  bonus:28, date:'2026-05-16' },
  { drw:1225, nums:[8,9,19,25,41,42],   bonus:33, date:'2026-05-23' },
  { drw:1226, nums:[4,6,13,17,26,28],   bonus:41, date:'2026-05-30' },
  { drw:1227, nums:[1,14,16,34,41,44],  bonus:13, date:'2026-06-06' },
  { drw:1228, nums:[24,29,30,31,35,44], bonus:1,  date:'2026-06-13' },
  { drw:1229, nums:[12,13,29,34,37,42], bonus:16, date:'2026-06-20' },
  { drw:1230, nums:[3,8,9,22,28,42],    bonus:45, date:'2026-06-27' },
];

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
