// CostStudioPage.jsx — 1688 다품목 중국 사입 원가 계산기
// 상단: 환율 → 품목 입력(여러 줄) → 기본/배대지/포장/판매 설정 → 결과(KPI + 원가 내역)
// 하단: 계산안 저장 목록(불러오기·삭제) + 엑셀 다운로드
// 작업 중 상태는 localStorage 캐시, 저장한 계산안은 Supabase(cost_projects) 공유.
// 계산식은 costCalc.js 참고. 환율은 /api/fx (Vercel 서버리스) 로 불러온다.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { trackVisit } from '../../lib/visits'
import {
  DEFAULT_SETTINGS, SAMPLE_ITEMS, calcCost, itemKrw,
  loadState, saveState, newId, newItem,
} from './costCalc'
import { fetchProjects, pushProject, removeProject } from './costSync'

const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`

// 설정 카드 구성 — [key, 라벨, 단위, step]
const SETTING_GROUPS = [
  {
    title: '② 기본 설정',
    fields: [
      ['setQty', '완성 세트 수량', '개', 1],
      ['agentPct', '구매/결제 대행수수료율', '%', 0.1],
      ['chinaCommon', '중국 현지 공통 기타비', 'CNY', 0.01],
    ],
  },
  {
    title: '③ 배대지 · 통관',
    fields: [
      ['intlShip', '중국→한국 국제배송비', '원', 1],
      ['forwarderFee', '배대지 검수/합배송 수수료', '원', 1],
      ['dutyPct', '관세율', '%', 0.1],
      ['vatPct', '수입 부가세율', '%', 0.1],
      ['customFee', '통관/관세사 기타비', '원', 1],
      ['domesticInbound', '배대지→집 국내배송', '원', 1],
    ],
  },
  {
    title: '④ 국내 포장 · 제작',
    fields: [
      ['packageUnit', '박스/파우치 1세트', '원', 1],
      ['printUnit', '스티커/카드 1세트', '원', 1],
      ['partsUnit', '오링/키링 부자재 1세트', '원', 1],
      ['makeUnit', '기타 제작비 1세트', '원', 1],
      ['lossPct', '불량/예비비율', '%', 0.1],
    ],
  },
  {
    title: '⑤ 판매 · 광고',
    fields: [
      ['sellPrice', '판매가(무료배송)', '원', 1],
      ['outShip', '고객 발송 택배비', '원', 1],
      ['platformPct', '플랫폼/결제 수수료율', '%', 0.1],
      ['adCost', '주문 1건당 광고비', '원', 1],
      ['returnPct', '반품/CS 충당률', '%', 0.1],
      ['sellEtc', '기타 주문당 비용', '원', 1],
    ],
  },
]

const ITEM_COLS = [
  ['name', '품목명', 'text', null],
  ['cny', '단가(CNY)', 'number', 0.01],
  ['perSet', '1세트 사용수량', 'number', 0.1],
  ['orderQty', '사입수량', 'number', 1],
  ['ship', '중국내 배송(CNY)', 'number', 0.01],
  ['etc', '기타 현지비(CNY)', 'number', 0.01],
]

export default function CostStudioPage() {
  const [items, setItems] = useState(() => SAMPLE_ITEMS.map((s) => newItem(s)))
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [projects, setProjects] = useState([])
  const [projectName, setProjectName] = useState('')
  const [editId, setEditId] = useState(null)     // 불러온 계산안 id (있으면 덮어쓰기)
  const [fxLoading, setFxLoading] = useState(false)
  const [toast, setToast] = useState('')
  const restored = useRef(false)

  useEffect(() => {
    trackVisit('cost')
    const cached = loadState()
    if (cached && cached.items.length) {
      setItems(cached.items)
      setSettings(cached.settings)
    }
    restored.current = true
    fetchProjects().then((list) => { if (list) setProjects(list) })
  }, [])

  // 작업 중 상태 자동 캐시 (초기 복원 이후부터)
  useEffect(() => {
    if (restored.current) saveState(items, settings)
  }, [items, settings])

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  const result = useMemo(() => calcCost(items, settings), [items, settings])

  const setField = useCallback((k, v) => setSettings((s) => ({ ...s, [k]: v })), [])

  const updItem = useCallback((id, key, val) => {
    setItems((list) => list.map((r) => (r.id === id ? { ...r, [key]: val } : r)))
  }, [])

  const addItem = () => setItems((list) => [...list, newItem({}, settings.setQty)])
  const removeItem = (id) => setItems((list) => list.filter((r) => r.id !== id))
  const loadSample = () => {
    setItems(SAMPLE_ITEMS.map((s) => newItem(s)))
    flash('예시 세트를 불러왔어요')
  }

  // 실시간 환율 (Vercel 서버리스 /api/fx)
  const loadFx = async () => {
    setFxLoading(true)
    try {
      const res = await fetch('/api/fx?from=CNY&to=KRW')
      const j = await res.json()
      if (!res.ok || !Number.isFinite(j?.rate)) throw new Error('rate')
      setField('fx', Number(j.rate.toFixed(2)))
      flash(`환율 갱신: 1위안 = ${j.rate.toFixed(2)}원`)
    } catch {
      flash('환율을 가져오지 못했어요. 직접 입력해주세요')
    } finally {
      setFxLoading(false)
    }
  }

  // ── 계산안 저장/불러오기 (Supabase) ─────────────────────────────
  const saveProject = async () => {
    const name = projectName.trim()
    if (!name) { flash('계산안 이름을 입력하세요'); return }
    const id = editId || newId()
    const row = { id, name, items, settings, updatedAt: new Date().toISOString() }
    setProjects((list) => [row, ...list.filter((p) => p.id !== id)])
    setEditId(id)
    const ok = await pushProject(row)
    flash(ok ? '계산안을 저장했어요' : '저장됨(원격 저장 대기)')
  }

  const openProject = (p) => {
    setItems((p.items || []).map((it) => ({ ...newItem(it), ...it, id: it.id || newId() })))
    setSettings({ ...DEFAULT_SETTINGS, ...(p.settings || {}) })
    setProjectName(p.name)
    setEditId(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    flash(`"${p.name}" 불러옴`)
  }

  const deleteProject = async (p) => {
    if (!confirm(`"${p.name}" 계산안을 삭제할까요?`)) return
    setProjects((list) => list.filter((x) => x.id !== p.id))
    if (editId === p.id) { setEditId(null); setProjectName('') }
    await removeProject(p.id)
  }

  const newProject = () => {
    setEditId(null)
    setProjectName('')
    flash('새 계산안으로 전환했어요')
  }

  // ── 엑셀 다운로드 ─────────────────────────────────────────────
  const downloadExcel = () => {
    const itemRows = items.map((r) => ({
      '품목명': r.name,
      '단가(CNY)': Number(r.cny) || 0,
      '1세트 사용수량': Number(r.perSet) || 0,
      '사입수량': Number(r.orderQty) || 0,
      '중국내 배송(CNY)': Number(r.ship) || 0,
      '기타 현지비(CNY)': Number(r.etc) || 0,
      '원화 상품비': Math.round(itemKrw(r, settings.fx)),
    }))
    const costRows = result.breakdown.map((b) => ({
      '항목': b.label, '총액': Math.round(b.total), '세트당': Math.round(b.perSet),
    }))
    costRows.push(
      { '항목': '초기 투입 현금', '총액': Math.round(result.initial), '세트당': Math.round(result.landed) },
      { '항목': '완성원가 / 세트', '총액': '', '세트당': Math.round(result.landed) },
      { '항목': '1개 판매 순이익', '총액': Math.round(result.profitAll), '세트당': Math.round(result.profit) },
      { '항목': '순이익률(%)', '총액': '', '세트당': Number(result.marginRate.toFixed(1)) },
      { '항목': '손익분기 판매수량(개)', '총액': result.bep, '세트당': '' },
    )
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(itemRows)
    ws1['!cols'] = [{ wch: 24 }, { wch: 11 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws1, '품목')
    const ws2 = XLSX.utils.json_to_sheet(costRows)
    ws2['!cols'] = [{ wch: 26 }, { wch: 14 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws2, '원가내역')
    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `사입원가_${(projectName || '계산안').replace(/\s+/g, '_')}_${stamp}.xlsx`)
  }

  const marginColor = result.marginRate < 0 ? '#f87171' : result.marginRate < 15 ? '#fbbf24' : '#34d399'

  return (
    <div style={sx.page}>
      <Link to="/" style={sx.home}>← 홈으로</Link>

      <div style={sx.head}>
        <div style={sx.title}>📦 사입 원가계산기</div>
        <div style={sx.sub}>
          알람시계·팔찌·거울·수정테이프처럼 품목을 여러 줄 추가하면 국제배송·통관·포장·판매비까지
          합산해 세트 1개의 완성원가와 순이익을 계산해요
        </div>
      </div>

      {/* 환율 */}
      <div style={{ ...sx.card, ...sx.fxCard }}>
        <div style={sx.cardTitle}>💱 중국 환율</div>
        <div style={sx.fxRow}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={sx.label}>1위안(CNY) = 몇 원?</label>
            <input
              style={{ ...sx.input, fontSize: 20, fontWeight: 800, borderColor: '#f59e0b' }}
              type="number" step="0.01" value={settings.fx}
              onChange={(e) => setField('fx', e.target.value)}
            />
          </div>
          <button style={sx.fxBtn} onClick={loadFx} disabled={fxLoading}>
            {fxLoading ? '불러오는 중…' : '🔄 실시간 환율'}
          </button>
        </div>
        <div style={sx.note}>적용할 환율을 직접 입력하거나 실시간 환율을 불러오세요. 품목 원가가 즉시 다시 계산돼요.</div>
      </div>

      {/* ① 품목 입력 */}
      <div style={sx.card}>
        <div style={sx.cardTitle}>① 품목 입력</div>
        <div style={sx.tableWrap}>
          <table style={sx.table}>
            <thead>
              <tr>
                {ITEM_COLS.map(([k, label]) => (
                  <th key={k} style={{ ...sx.th, textAlign: k === 'name' ? 'left' : 'center' }}>{label}</th>
                ))}
                <th style={{ ...sx.th, textAlign: 'right' }}>원화 상품비</th>
                <th style={sx.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} style={sx.tr}>
                  {ITEM_COLS.map(([k, , type, step]) => (
                    <td key={k} style={sx.td}>
                      <input
                        style={{ ...sx.input, minWidth: k === 'name' ? 130 : 84, textAlign: k === 'name' ? 'left' : 'right' }}
                        type={type} step={step ?? undefined}
                        value={r[k]}
                        placeholder={k === 'name' ? '예: 클로버 팔찌' : '0'}
                        onChange={(e) => updItem(r.id, k, e.target.value)}
                      />
                    </td>
                  ))}
                  <td style={{ ...sx.td, textAlign: 'right', fontWeight: 700, color: '#c7d2fe', whiteSpace: 'nowrap' }}>
                    {won(itemKrw(r, settings.fx))}
                  </td>
                  <td style={{ ...sx.td, textAlign: 'center' }}>
                    <button style={sx.delBtn} onClick={() => removeItem(r.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} style={sx.emptyCell}>품목을 추가해주세요</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={sx.rowBtns}>
          <button style={sx.addBtn} onClick={addItem}>+ 품목 추가</button>
          <button style={sx.ghostBtn} onClick={loadSample}>예시 세트 불러오기</button>
        </div>
        <div style={sx.summary}>
          <span style={sx.summaryItem}>상품대금 합계 <strong style={sx.summaryVal}>{won(result.goodsTotal)}</strong></span>
          <span style={sx.summaryItem}>세트당 중국 상품원가 <strong style={sx.summaryVal}>{won(result.setGoods)}</strong></span>
        </div>
      </div>

      {/* ②③④⑤ 설정 */}
      <div style={sx.grid}>
        {SETTING_GROUPS.map((g) => (
          <div key={g.title} style={sx.card}>
            <div style={sx.cardTitle}>{g.title}</div>
            <div style={sx.formGrid}>
              {g.fields.map(([k, label, unit, step]) => (
                <div key={k} style={sx.field}>
                  <label style={sx.label}>{label}<span style={sx.unit}> ({unit})</span></label>
                  <input
                    style={sx.input} type="number" step={step} value={settings[k]}
                    onChange={(e) => setField(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ⑥ 결과 */}
      <div style={sx.card}>
        <div style={sx.cardTitle}>⑥ 결과</div>
        <div style={sx.kpis}>
          <Kpi label="완성원가 / 세트" value={won(result.landed)} accent />
          <Kpi label="1개 판매 순이익" value={won(result.profit)} color={marginColor} />
          <Kpi label="순이익률" value={`${result.marginRate.toFixed(1)}%`} color={marginColor} />
          <Kpi label="전량 판매 순이익" value={won(result.profitAll)} color={marginColor} />
          <Kpi label="초기 투입 현금" value={won(result.initial)} />
          <Kpi label="손익분기 판매수량" value={`${result.bep.toLocaleString('ko-KR')}개`} />
        </div>

        <div style={{ ...sx.tableWrap, marginTop: 16 }}>
          <table style={sx.table}>
            <thead>
              <tr>
                <th style={{ ...sx.th, textAlign: 'left' }}>항목</th>
                <th style={{ ...sx.th, textAlign: 'right' }}>총액</th>
                <th style={{ ...sx.th, textAlign: 'right' }}>세트당</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((b) => (
                <tr key={b.label} style={sx.tr}>
                  <td style={{ ...sx.td, color: '#cbd5e1' }}>{b.label}</td>
                  <td style={sx.tdNum}>{won(b.total)}</td>
                  <td style={sx.tdNum}>{won(b.perSet)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...sx.tfoot, textAlign: 'left' }}>합계 (초기 투입 현금)</td>
                <td style={sx.tfoot}>{won(result.initial)}</td>
                <td style={sx.tfoot}>{won(result.landed)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 계산안 저장 */}
      <div style={sx.card}>
        <div style={sx.cardTitle}>💾 계산안 저장</div>
        <div style={sx.saveRow}>
          <input
            style={{ ...sx.input, flex: 1, minWidth: 180 }}
            value={projectName} placeholder="예: 수능세트 100개"
            onChange={(e) => setProjectName(e.target.value)}
          />
          <button style={sx.saveBtn} onClick={saveProject}>{editId ? '덮어쓰기 저장' : '저장하기'}</button>
          {editId && <button style={sx.ghostBtn} onClick={newProject}>새 계산안</button>}
          <button style={sx.excelBtn} onClick={downloadExcel}>⬇️ 엑셀</button>
        </div>

        {projects.length === 0 ? (
          <div style={sx.empty}>저장된 계산안이 없어요. 이름을 적고 저장해보세요.</div>
        ) : (
          <div style={sx.projectList}>
            {projects.map((p) => (
              <div key={p.id} style={{ ...sx.project, borderColor: p.id === editId ? '#6366f1' : '#232b45' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={sx.projectName}>{p.name || '(이름 없음)'}</div>
                  <div style={sx.projectMeta}>
                    품목 {(p.items || []).length}개 · {(p.updatedAt || '').slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={sx.rowBtn} onClick={() => openProject(p)}>불러오기</button>
                  <button style={{ ...sx.rowBtn, color: '#f87171' }} onClick={() => deleteProject(p)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div style={sx.toast}>{toast}</div>}
      <div style={sx.foot}>저장한 계산안은 클라우드에 보관돼 어느 기기에서도 열려요 · 환율은 ECB 고시 기준 🇨🇳→🇰🇷</div>
    </div>
  )
}

function Kpi({ label, value, accent, color }) {
  return (
    <div style={{ ...sx.kpi, ...(accent ? sx.kpiAccent : null) }}>
      <div style={sx.kpiLabel}>{label}</div>
      <div style={{ ...sx.kpiValue, color: color || (accent ? '#fdba74' : '#e2e8f0') }}>{value}</div>
    </div>
  )
}

const sx = {
  page: {
    minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1c2440 0%, #0b0f1e 60%)',
    color: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '28px 16px 48px', fontFamily: 'system-ui,-apple-system,sans-serif', boxSizing: 'border-box',
  },
  home: { position: 'fixed', top: 14, left: 16, fontSize: 13, color: '#94a3b8', textDecoration: 'none', zIndex: 10 },
  head: { textAlign: 'center', marginBottom: 22, marginTop: 8 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: '-.5px' },
  sub: { fontSize: 14, color: '#94a3b8', marginTop: 6, maxWidth: 620 },

  card: {
    width: '100%', maxWidth: 960, background: '#131a30', border: '1px solid #232b45',
    borderRadius: 18, padding: 20, boxSizing: 'border-box', marginBottom: 16,
  },
  fxCard: { border: '1px solid #f59e0b', background: '#1b1a2e' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#c7d2fe', marginBottom: 14 },
  note: { fontSize: 12, color: '#64748b', marginTop: 10 },

  fxRow: { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' },
  fxBtn: {
    padding: '11px 16px', borderRadius: 10, border: '1px solid #f59e0b', cursor: 'pointer',
    background: 'rgba(245,158,11,.15)', color: '#fbbf24', fontSize: 13, fontWeight: 700,
  },

  grid: { width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: 600 },
  unit: { color: '#64748b', fontWeight: 400 },
  input: {
    width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  },

  tableWrap: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 },
  th: {
    padding: '8px 8px', fontSize: 11, color: '#94a3b8', fontWeight: 700,
    borderBottom: '1px solid #232b45', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #1a2138' },
  td: { padding: '7px 6px', color: '#cbd5e1' },
  tdNum: { padding: '9px 8px', textAlign: 'right', color: '#cbd5e1', whiteSpace: 'nowrap' },
  emptyCell: { padding: '28px 10px', textAlign: 'center', color: '#64748b' },
  tfoot: {
    padding: '12px 8px', fontSize: 13, fontWeight: 800, color: '#e2e8f0',
    borderTop: '2px solid #232b45', background: '#0f172a', textAlign: 'right', whiteSpace: 'nowrap',
  },

  rowBtns: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  addBtn: {
    padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', fontSize: 13, fontWeight: 800,
  },
  ghostBtn: {
    padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', cursor: 'pointer',
    background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 700,
  },
  delBtn: {
    padding: '5px 10px', borderRadius: 8, border: '1px solid #46223a', cursor: 'pointer',
    background: 'rgba(248,113,113,.1)', color: '#f87171', fontSize: 12, fontWeight: 700,
  },
  summary: { display: 'flex', gap: 20, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' },
  summaryItem: { fontSize: 13, color: '#94a3b8' },
  summaryVal: { color: '#e2e8f0', fontWeight: 800, marginLeft: 6 },

  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 },
  kpi: { border: '1px solid #232b45', borderRadius: 12, padding: '13px 14px', background: '#0f172a' },
  kpiAccent: { background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.4)' },
  kpiLabel: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  kpiValue: { fontSize: 20, fontWeight: 800, whiteSpace: 'nowrap' },

  saveRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  saveBtn: {
    padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 800,
    boxShadow: '0 8px 20px rgba(99,102,241,.3)',
  },
  excelBtn: {
    padding: '10px 16px', borderRadius: 10, border: '1px solid #059669', cursor: 'pointer',
    background: 'rgba(16,185,129,.15)', color: '#34d399', fontSize: 13, fontWeight: 700,
  },
  empty: {
    marginTop: 14, padding: '26px 16px', textAlign: 'center',
    color: '#64748b', fontSize: 13, borderRadius: 14, border: '1px dashed #232b45',
  },
  projectList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 14 },
  project: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    padding: '11px 13px', borderRadius: 12, border: '1px solid #232b45', background: '#0f172a',
  },
  projectName: { fontSize: 14, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  projectMeta: { fontSize: 11, color: '#64748b', marginTop: 3 },
  rowBtn: {
    padding: '5px 10px', borderRadius: 8, border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },

  toast: {
    position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    background: '#232b45', color: '#e2e8f0', padding: '10px 22px', borderRadius: 30,
    fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 50,
  },
  foot: { marginTop: 26, fontSize: 12, color: '#475569', textAlign: 'center' },
}
