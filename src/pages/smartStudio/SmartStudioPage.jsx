// SmartStudioPage.jsx — 스마트스토어 마진 계산기
// 상단: 입력 폼(상품명/판매가/매입가/배송비/수수료율/반품충당율) + 실시간 계산 미리보기
// 하단: 저장된 상품 목록(수정·삭제) + 엑셀 다운로드
// 저장은 localStorage(브라우저) 기준. 계산식은 marginCalc.js 참고.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { trackVisit } from '../../lib/visits'
import { calcMargin, loadItems, saveItems, newId } from './marginCalc'
import { fetchItems, pushItem, removeItemRemote } from './marginSync'

const won = (n) => Math.round(n).toLocaleString('ko-KR')
const pct = (n) => `${n.toFixed(1)}%`

const EMPTY = { name: '', price: '', cost: '', shipping: '', feeRate: '5', returnRate: '5' }

export default function SmartStudioPage() {
  const [form, setForm] = useState(EMPTY)
  const [items, setItems] = useState([])
  const [editId, setEditId] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    trackVisit('smart')
    // 1) 로컬 캐시로 즉시 렌더 → 2) 원격 최신본으로 교체
    setItems(loadItems())
    fetchItems().then((remote) => {
      if (remote) {
        setItems(remote)
        saveItems(remote)
      }
    })
  }, [])

  // 로컬 캐시 갱신 (원격은 항목 단위로 별도 반영)
  const persist = useCallback((next) => {
    setItems(next)
    saveItems(next)
  }, [])

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  const preview = useMemo(() => calcMargin(form), [form])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const resetForm = () => { setForm(EMPTY); setEditId(null) }

  const submit = () => {
    if (!String(form.name).trim()) { flash('상품명을 입력하세요'); return }
    if (!form.price) { flash('판매가를 입력하세요'); return }

    if (editId) {
      const updated = { ...items.find((it) => it.id === editId), ...form, id: editId }
      persist(items.map((it) => (it.id === editId ? updated : it)))
      pushItem(updated).then((ok) => flash(ok ? '수정되었습니다' : '수정됨(원격 저장 대기)'))
    } else {
      const created = { id: newId(), ...form }
      persist([created, ...items])
      pushItem(created).then((ok) => flash(ok ? '저장되었습니다' : '저장됨(원격 저장 대기)'))
    }
    resetForm()
  }

  const startEdit = (it) => {
    setForm({
      name: it.name, price: it.price, cost: it.cost,
      shipping: it.shipping, feeRate: it.feeRate, returnRate: it.returnRate,
    })
    setEditId(it.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = (id) => {
    if (!confirm('이 상품을 삭제할까요?')) return
    persist(items.filter((it) => it.id !== id))
    removeItemRemote(id)
    if (editId === id) resetForm()
  }

  // 합계 / 평균
  const totals = useMemo(() => {
    if (items.length === 0) return null
    const calc = items.map(calcMargin)
    const profit = calc.reduce((s, c) => s + c.profit, 0)
    const price = calc.reduce((s, c) => s + c.price, 0)
    return { profit, avgMargin: price === 0 ? 0 : (profit / price) * 100, count: items.length }
  }, [items])

  // 엑셀 다운로드 (원본 엑셀과 동일한 컬럼 구성)
  const downloadExcel = () => {
    if (items.length === 0) { flash('저장된 상품이 없습니다'); return }
    const rows = items.map((it) => {
      const c = calcMargin(it)
      return {
        '상품명': it.name,
        '판매가': c.price,
        '매입가': c.cost,
        '배송비': c.shipping,
        '수수료율(%)': c.feeRate,
        '반품충당율(%)': c.returnRate,
        '수수료': Math.round(c.fee),
        '반품충당금': Math.round(c.returnReserve),
        '예상순익': Math.round(c.profit),
        '순마진율(%)': Number(c.marginRate.toFixed(1)),
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '마진계산기')
    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `스마트스토어_마진계산_${stamp}.xlsx`)
  }

  const marginColor = (m) => (m < 0 ? '#f87171' : m < 15 ? '#fbbf24' : '#34d399')

  return (
    <div style={sx.page}>
      <Link to="/" style={sx.home}>← 홈으로</Link>

      <div style={sx.head}>
        <div style={sx.title}>🧮 스마트스토어 마진 계산기</div>
        <div style={sx.sub}>판매가·원가를 입력하면 수수료·반품충당금까지 반영한 실제 순마진을 계산해요</div>
      </div>

      {/* 입력 폼 */}
      <div style={sx.card}>
        <div style={sx.cardTitle}>{editId ? '✏️ 상품 수정' : '➕ 새 상품 입력'}</div>
        <div style={sx.formGrid}>
          <Field label="상품명" wide>
            <input style={sx.input} value={form.name} placeholder="예: 무선 충전기"
              onChange={(e) => setField('name', e.target.value)} />
          </Field>
          <Field label="판매가" unit="원">
            <input style={sx.input} type="number" inputMode="numeric" value={form.price} placeholder="0"
              onChange={(e) => setField('price', e.target.value)} />
          </Field>
          <Field label="매입가" unit="원">
            <input style={sx.input} type="number" inputMode="numeric" value={form.cost} placeholder="0"
              onChange={(e) => setField('cost', e.target.value)} />
          </Field>
          <Field label="배송비" unit="원">
            <input style={sx.input} type="number" inputMode="numeric" value={form.shipping} placeholder="0"
              onChange={(e) => setField('shipping', e.target.value)} />
          </Field>
          <Field label="수수료율" unit="%">
            <input style={sx.input} type="number" inputMode="decimal" value={form.feeRate} placeholder="5"
              onChange={(e) => setField('feeRate', e.target.value)} />
          </Field>
          <Field label="반품충당율" unit="%">
            <input style={sx.input} type="number" inputMode="decimal" value={form.returnRate} placeholder="5"
              onChange={(e) => setField('returnRate', e.target.value)} />
          </Field>
        </div>

        {/* 실시간 계산 미리보기 */}
        <div style={sx.preview}>
          <Stat label="수수료" value={`${won(preview.fee)}원`} />
          <Stat label="반품충당금" value={`${won(preview.returnReserve)}원`} />
          <Stat label="예상순익" value={`${won(preview.profit)}원`} strong
            color={marginColor(preview.marginRate)} />
          <Stat label="순마진율" value={pct(preview.marginRate)} strong
            color={marginColor(preview.marginRate)} />
        </div>

        <div style={sx.formBtns}>
          <button style={sx.saveBtn} onClick={submit}>
            {editId ? '수정 저장' : '저장하기'}
          </button>
          {editId && <button style={sx.ghostBtn} onClick={resetForm}>취소</button>}
        </div>
      </div>

      {/* 목록 */}
      <div style={sx.listHead}>
        <div style={sx.listTitle}>
          📋 저장된 상품 <span style={sx.count}>{items.length}</span>
        </div>
        <button style={sx.excelBtn} onClick={downloadExcel}>⬇️ 엑셀 다운로드</button>
      </div>

      {items.length === 0 ? (
        <div style={sx.empty}>아직 저장된 상품이 없어요. 위에서 입력 후 저장해보세요.</div>
      ) : (
        <div style={sx.tableWrap}>
          <table style={sx.table}>
            <thead>
              <tr>
                {['상품명', '판매가', '매입가', '배송비', '수수료', '반품충당금', '예상순익', '순마진율', ''].map((h, i) => (
                  <th key={i} style={{ ...sx.th, textAlign: i === 0 ? 'left' : i === 8 ? 'center' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const c = calcMargin(it)
                return (
                  <tr key={it.id} style={sx.tr}>
                    <td style={{ ...sx.td, textAlign: 'left', fontWeight: 600, color: '#e2e8f0' }}>{it.name}</td>
                    <td style={sx.tdNum}>{won(c.price)}</td>
                    <td style={sx.tdNum}>{won(c.cost)}</td>
                    <td style={sx.tdNum}>{won(c.shipping)}</td>
                    <td style={sx.tdNum}>{won(c.fee)}</td>
                    <td style={sx.tdNum}>{won(c.returnReserve)}</td>
                    <td style={{ ...sx.tdNum, fontWeight: 700, color: marginColor(c.marginRate) }}>{won(c.profit)}</td>
                    <td style={{ ...sx.tdNum, fontWeight: 700, color: marginColor(c.marginRate) }}>{pct(c.marginRate)}</td>
                    <td style={{ ...sx.td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button style={sx.rowBtn} onClick={() => startEdit(it)}>수정</button>
                      <button style={{ ...sx.rowBtn, color: '#f87171' }} onClick={() => remove(it.id)}>삭제</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  <td style={{ ...sx.tfoot, textAlign: 'left' }}>합계 · 평균</td>
                  <td colSpan={5} style={sx.tfoot}></td>
                  <td style={{ ...sx.tfoot, textAlign: 'right', color: marginColor(totals.avgMargin) }}>{won(totals.profit)}</td>
                  <td style={{ ...sx.tfoot, textAlign: 'right', color: marginColor(totals.avgMargin) }}>{pct(totals.avgMargin)}</td>
                  <td style={sx.tfoot}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {toast && <div style={sx.toast}>{toast}</div>}
      <div style={sx.foot}>저장 데이터는 클라우드에 보관돼 어느 기기에서도 열려요 · 계산식은 스마트스토어 마진계산기 기준 🧮</div>
    </div>
  )
}

function Field({ label, unit, wide, children }) {
  return (
    <div style={{ ...sx.field, gridColumn: wide ? '1 / -1' : 'auto' }}>
      <label style={sx.label}>{label}{unit && <span style={sx.unit}> ({unit})</span>}</label>
      {children}
    </div>
  )
}

function Stat({ label, value, strong, color }) {
  return (
    <div style={sx.stat}>
      <div style={sx.statLabel}>{label}</div>
      <div style={{ ...sx.statValue, fontSize: strong ? 18 : 15, color: color || '#c7d2fe' }}>{value}</div>
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
  sub: { fontSize: 14, color: '#94a3b8', marginTop: 6, maxWidth: 520 },

  card: {
    width: '100%', maxWidth: 780, background: '#131a30', border: '1px solid #232b45',
    borderRadius: 18, padding: 20, boxSizing: 'border-box',
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#c7d2fe', marginBottom: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: 600 },
  unit: { color: '#64748b', fontWeight: 400 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none',
  },

  preview: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
    marginTop: 16, padding: 14, background: '#0f172a', borderRadius: 12, border: '1px solid #232b45',
  },
  stat: { display: 'flex', flexDirection: 'column', gap: 3 },
  statLabel: { fontSize: 11, color: '#64748b' },
  statValue: { fontWeight: 800 },

  formBtns: { display: 'flex', gap: 10, marginTop: 16 },
  saveBtn: {
    flex: 1, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800,
    boxShadow: '0 8px 20px rgba(99,102,241,.35)',
  },
  ghostBtn: {
    padding: '13px 24px', borderRadius: 12, border: '1px solid #334155', cursor: 'pointer',
    background: 'transparent', color: '#94a3b8', fontSize: 14, fontWeight: 600,
  },

  listHead: {
    width: '100%', maxWidth: 780, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 30, marginBottom: 12,
  },
  listTitle: { fontSize: 17, fontWeight: 800 },
  count: {
    fontSize: 12, fontWeight: 700, color: '#a5b4fc', background: '#232b45',
    padding: '2px 9px', borderRadius: 20, marginLeft: 4,
  },
  excelBtn: {
    padding: '9px 16px', borderRadius: 10, border: '1px solid #059669', cursor: 'pointer',
    background: 'rgba(16,185,129,.15)', color: '#34d399', fontSize: 13, fontWeight: 700,
  },

  empty: {
    width: '100%', maxWidth: 780, padding: '40px 16px', textAlign: 'center',
    color: '#64748b', fontSize: 14, background: '#131a30', borderRadius: 16, border: '1px dashed #232b45',
  },

  tableWrap: {
    width: '100%', maxWidth: 780, overflowX: 'auto', background: '#131a30',
    borderRadius: 16, border: '1px solid #232b45',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 },
  th: {
    padding: '12px 10px', fontSize: 11, color: '#94a3b8', fontWeight: 700,
    borderBottom: '1px solid #232b45', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #1a2138' },
  td: { padding: '11px 10px', color: '#cbd5e1' },
  tdNum: { padding: '11px 10px', textAlign: 'right', color: '#cbd5e1', whiteSpace: 'nowrap' },
  rowBtn: {
    padding: '4px 9px', margin: '0 2px', borderRadius: 7, border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  tfoot: {
    padding: '12px 10px', fontSize: 12, fontWeight: 800, color: '#94a3b8',
    borderTop: '2px solid #232b45', background: '#0f172a', textAlign: 'right', whiteSpace: 'nowrap',
  },

  toast: {
    position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    background: '#232b45', color: '#e2e8f0', padding: '10px 22px', borderRadius: 30,
    fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 50,
  },
  foot: { marginTop: 26, fontSize: 12, color: '#475569', textAlign: 'center' },
}
