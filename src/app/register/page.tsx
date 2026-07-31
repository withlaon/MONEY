'use client'

import { useState, useRef, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Building2, User, Lock, Zap,
  CreditCard, Banknote, Plus, Check, ChevronDown, CalendarClock,
} from 'lucide-react'
import { useIncomeSources, useExpenseCategories, useDescriptionPresets, clearTransactionCache } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'

/* ══════════════════════════════
   카드 결제 예상액 패널
══════════════════════════════ */

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function mmdd(d: Date) {
  return `${d.getMonth()+1}/${d.getDate()}`
}

function getCardBillingInfo(today: Date) {
  const y = today.getFullYear()
  const m = today.getMonth() // 0-indexed
  const d = today.getDate()

  /* 삼성카드: 결제일 10일, 전전월 29일 ~ 전월 28일 */
  const samPayM = d > 10 ? m + 1 : m
  const samPayY = samPayM > 11 ? y + 1 : y
  const samPM   = samPayM % 12
  const samPayDate = new Date(samPayY, samPM, 10)
  const samStart   = new Date(samPayY, samPM - 2, 29)
  const samEnd     = new Date(samPayY, samPM - 1, 28)

  /* 현대카드: 결제일 1일, 전전월 20일 ~ 전월 19일 */
  const hydPayM = d > 1 ? m + 1 : m
  const hydPayY = hydPayM > 11 ? y + 1 : y
  const hydPM   = hydPayM % 12
  const hydPayDate = new Date(hydPayY, hydPM, 1)
  const hydStart   = new Date(hydPayY, hydPM - 2, 20)
  const hydEnd     = new Date(hydPayY, hydPM - 1, 19)

  /* KB카드: 결제일 27일, 전월 14일 ~ 당월 13일 */
  const kbPayM = d > 27 ? m + 1 : m
  const kbPayY = kbPayM > 11 ? y + 1 : y
  const kbPM   = kbPayM % 12
  const kbPayDate = new Date(kbPayY, kbPM, 27)
  const kbStart   = new Date(kbPayY, kbPM - 1, 14)
  const kbEnd     = new Date(kbPayY, kbPM, 13)

  return [
    { key:'samsung', name:'삼성카드', method:'삼성카드', color:'#1d4ed8', accent:'#dbeafe',
      payDate: samPayDate, start: samStart, end: samEnd },
    { key:'hyundai', name:'현대카드', method:'현대카드', color:'#dc2626', accent:'#fee2e2',
      payDate: hydPayDate, start: hydStart, end: hydEnd },
    { key:'kb',      name:'KB카드',   method:'KB카드',   color:'#b45309', accent:'#fef3c7',
      payDate: kbPayDate,  start: kbStart,  end: kbEnd  },
  ]
}

type CardRow = {
  transaction_type: string; amount: number
  payment_method: string | null; transaction_date: string
  installment_months?: number | null
}

const LOOKBACK = 36 // 최대 할부 개월 수

/**
 * 이 결제기간([start, end]) 기준으로 해당 거래가 몇 번째 회차인지 반환
 * 0  = 이번 결제기간 안에 있음 (1회차)
 * 1  = 1개월 전 기간 (2회차)
 * -1 = 결제기간 이후 (미래) → 제외
 */
function billingOffset(txDate: Date, cardStart: Date, cardEnd: Date): number {
  const tx = txDate.getTime()
  if (tx >= cardStart.getTime() && tx <= cardEnd.getTime()) return 0 // 이번 기간 내
  if (tx > cardEnd.getTime()) return -1 // 미래
  // tx < cardStart: 몇 개월 이전인지 (카드 시작월 기준 month diff)
  const diff =
    (cardStart.getFullYear() - txDate.getFullYear()) * 12 +
    (cardStart.getMonth() - txDate.getMonth())
  return diff > 0 ? diff : 1
}

function CardSummaryPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const today = new Date()
  const cards = getCardBillingInfo(today)
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const allEnds   = cards.map(c => c.end)
    const allStarts = cards.map(c => c.start)
    const maxDate = allEnds.reduce((a, b) => a > b ? a : b)
    // 할부 조회를 위해 최대 할부 개월수만큼 과거로 확장 (시작일 기준)
    const minDate = allStarts.reduce((a, b) => a < b ? a : b)
    minDate.setMonth(minDate.getMonth() - LOOKBACK)

    fetch(`/api/transactions?start=${fmtDate(minDate)}&end=${fmtDate(maxDate)}&detail=1`)
      .then(r => r.json())
      .then((res: { data?: CardRow[] }) => {
        const txs = res.data || []
        const next: Record<string, number> = {}
        for (const card of cards) {
          next[card.key] = txs
            .filter(t => t.transaction_type === 'expense' && t.payment_method === card.method)
            .reduce((sum, t) => {
              const months = t.installment_months && t.installment_months > 1 ? t.installment_months : 1
              const txDate = new Date(t.transaction_date)
              const offset = billingOffset(txDate, card.start, card.end)
              // offset=0 → 1회차, offset=1 → 2회차, ..., offset=months-1 → 마지막 회차
              if (offset >= 0 && offset < months) {
                return sum + Math.round(t.amount / months)
              }
              return sum
            }, 0)
        }
        setTotals(next)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const daysUntil = (d: Date) => {
    const ms = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    return Math.round(ms / 86400000)
  }

  return (
    <div style={{ background:'#fff', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}>
      {/* 헤더 */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f3fb', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center', color:'#4f46e5' }}>
          <CalendarClock size={18} />
        </div>
        <div>
          <p style={{ fontSize:16, fontWeight:800, color:'#111827' }}>카드 예상 결제액</p>
          <p style={{ fontSize:11, color:'#9ca3af' }}>다음 결제일 기준 청구 예정</p>
        </div>
      </div>

      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {loading ? (
          <p style={{ fontSize:12, color:'#9ca3af' }}>조회 중...</p>
        ) : cards.map(card => {
          const total  = totals[card.key] || 0
          const days   = daysUntil(card.payDate)
          const dLabel = days === 0 ? '오늘 결제' : days > 0 ? `${days}일 후` : `${Math.abs(days)}일 전`
          const isUrgent = days >= 0 && days <= 3

          return (
            <div key={card.key} style={{ border:`1px solid ${card.accent}`, background: total > 0 ? card.accent : '#fafafa' }}>
              {/* 카드사명 + 결제일 */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:`1px solid ${card.accent}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:800, color: card.color }}>{card.name}</span>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:'2px 6px',
                    background: isUrgent ? card.color : '#f3f4f6',
                    color: isUrgent ? '#fff' : '#6b7280',
                  }}>{dLabel}</span>
                </div>
                <span style={{ fontSize:11, color:'#9ca3af' }}>
                  {card.payDate.getMonth()+1}월 {card.payDate.getDate()}일 결제
                </span>
              </div>

              {/* 금액 + 사용기간 */}
              <div style={{ padding:'10px 14px' }}>
                <p style={{ fontSize:22, fontWeight:800, color: total > 0 ? card.color : '#d1d5db', lineHeight:1.2 }}>
                  {total > 0 ? formatCurrency(Math.round(total)) : '—'}
                  {total > 0 && <span style={{ fontSize:13, fontWeight:700, marginLeft:3 }}>원</span>}
                </p>
                <p style={{ fontSize:10, color:'#9ca3af', marginTop:5 }}>
                  사용기간 {mmdd(card.start)} ~ {mmdd(card.end)}
                </p>
                <p style={{ fontSize:10, color:'#b0b7c3', marginTop:2 }}>
                  * 할부는 회차별 금액으로 산정
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PAYMENT_METHODS = ['현금', '삼성카드', 'KB카드', '현대카드'] as const
const INCOME_CATS = ['판매대금', '기타'] as const

const today = () => new Date().toISOString().split('T')[0]

/* ── 공통 스타일 ── */
const INP: React.CSSProperties = {
  width: '100%', background: '#f8faff', border: '1.5px solid #e4e9f5',
  padding: '10px 14px', fontSize: 14, color: '#111827',
}
const LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6, display: 'block',
}
const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--day-border)',
  boxShadow: 'var(--day-shadow)',
}
const BTN_PILL = (active: boolean, activeStyle: { bg: string; border: string; color: string }) => ({
  padding: '9px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: active ? activeStyle.bg : '#f8faff',
  border: `1.5px solid ${active ? activeStyle.border : '#e4e9f5'}`,
  color: active ? activeStyle.color : '#9ca3af',
  transition: 'all 0.12s',
} as React.CSSProperties)

/* ── 내역 콤보박스 ── */
function DescCombobox({ value, onChange, presets, onAddPreset }: {
  value: string; onChange: (v: string) => void
  presets: { id: string; name: string }[]
  onAddPreset: (name: string) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = value ? presets.filter(p => p.name.toLowerCase().includes(value.toLowerCase())) : presets
  const alreadyExists = presets.some(p => p.name === value.trim())

  const handleAdd = async () => {
    if (!value.trim() || adding) return
    setAdding(true)
    try { await onAddPreset(value.trim()) } finally { setAdding(false); setOpen(false) }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input type="text" value={value}
            onChange={e => { onChange(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="직접 입력하거나 선택하세요"
            style={INP}
          />
          <button type="button" onClick={() => setOpen(o => !o)} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
          }}>
            <ChevronDown size={15} />
          </button>
        </div>
        {value.trim() && !alreadyExists && (
          <button type="button" onClick={handleAdd} disabled={adding} style={{
            width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#eef0fe', border: '1.5px solid #c7c3fa', color: '#4f46e5', cursor: 'pointer',
          }}>
            <Plus size={16} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
          background: '#fff', border: '1.5px solid #e4e9f5',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 180, overflowY: 'auto',
        }}>
          {filtered.map(p => (
            <button key={p.id} type="button" onClick={() => { onChange(p.name); setOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#111827', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >{p.name}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 성공 토스트 ── */
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: '#111827', color: '#fff', padding: '12px 24px',
      fontWeight: 700, fontSize: 14, zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      animation: 'fadeUp 0.25s ease',
    }}>
      {msg}
    </div>
  )
}

const INSTALLMENT_OPTIONS = [2, 3, 6, 9, 12, 18, 24, 36]
const CARD_METHODS = ['삼성카드', 'KB카드', '현대카드']

type IncomeEntry = { cat: string; desc: string; amount: number }
type ExpenseEntry = { desc: string; catName: string; expType: string; payMethod: string; amount: number; installMonths: number }

/* ── 수입 등록 폼 ── */
function IncomeForm() {
  const { sources } = useIncomeSources()
  const { presets, addPreset } = useDescriptionPresets()

  const [date, setDate] = useState(today())
  const [incomeCat, setIncomeCat] = useState<'판매대금' | '기타'>('판매대금')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(false)
  const [savedList, setSavedList] = useState<IncomeEntry[]>([])

  const fmt = (v: string) => { const n = v.replace(/\D/g, ''); return n ? Number(n).toLocaleString('ko-KR') : '' }

  const resolveSourceId = () => {
    const match = sources.find(s => s.name === incomeCat)
    return match?.id ?? null
  }

  const save = async () => {
    const raw = Number(amount.replace(/,/g, ''))
    if (!raw) { setError('금액을 입력해주세요.'); return }
    setSaving(true); setError('')
    try {
      const d = new Date(date)
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_type: 'income',
          amount: raw,
          transaction_date: date,
          description: desc || null,
          memo: memo || null,
          payment_method: null,
          income_source_id: resolveSourceId(),
          expense_category_id: null,
          expense_type: null,
          is_fixed: false,
        }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || '저장 실패')
      clearTransactionCache(d.getFullYear(), d.getMonth() + 1)
      // 당일 등록분만 목록에 추가
      if (date === today()) {
        setSavedList(prev => [...prev, { cat: incomeCat, desc: desc || incomeCat, amount: raw }])
      }
      setAmount(''); setDesc(''); setMemo('')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const todayTotal = savedList.reduce((s, e) => s + e.amount, 0)

  return (
    <div style={CARD}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f3fb', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
          <TrendingUp size={18} />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>수입 등록</p>
          <p style={{ fontSize: 11, color: '#9ca3af' }}>판매대금 및 기타 수입</p>
        </div>
      </div>

      {/* 폼 */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 날짜 */}
        <div>
          <span style={LABEL}>날짜</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INP} />
        </div>

        {/* 카테고리 */}
        <div>
          <span style={LABEL}>카테고리</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {INCOME_CATS.map(cat => (
              <button key={cat} type="button" onClick={() => setIncomeCat(cat)}
                style={BTN_PILL(incomeCat === cat, { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' })}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 내역 */}
        <div>
          <span style={LABEL}>내역</span>
          <DescCombobox value={desc} onChange={setDesc} presets={presets} onAddPreset={addPreset} />
        </div>

        {/* 금액 */}
        <div>
          <span style={LABEL}>금액 *</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 800, color: '#9ca3af' }}>₩</span>
            <input type="text" value={amount}
              onChange={e => setAmount(fmt(e.target.value))}
              placeholder="0"
              style={{ ...INP, paddingLeft: 34, fontSize: 18, fontWeight: 800, color: '#059669' }}
            />
          </div>
          {amount && (
            <p style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 700 }}>
              {formatCurrency(Number(amount.replace(/,/g, '')))}원
            </p>
          )}
        </div>

        {/* 메모 */}
        <div>
          <span style={LABEL}>메모 (선택)</span>
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="추가 메모" rows={2}
            style={{ ...INP, resize: 'none' }} />
        </div>

        {error && (
          <p style={{ fontSize: 13, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
            {error}
          </p>
        )}

        <button type="button" onClick={save} disabled={saving}
          style={{
            padding: '13px', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? '#d1fae5' : 'linear-gradient(135deg,#047857,#10b981)',
            color: '#fff', border: 'none', opacity: saving ? 0.7 : 1,
          }}>
          {saving ? '저장 중...' : '수입 저장하기'}
        </button>

        {/* 당일 등록 목록 */}
        {savedList.length > 0 && (
          <div style={{ borderTop: '1px solid #e4e9f5', paddingTop: 14, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>오늘 등록한 수입</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>합계 {formatCurrency(todayTotal)}원</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {savedList.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#059669', padding: '2px 6px' }}>{e.cat}</span>
                    <span style={{ fontSize: 12, color: '#374151' }}>{e.desc !== e.cat ? e.desc : ''}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>+{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg="✓ 수입이 등록되었습니다" />}
    </div>
  )
}

/* ── 지출 등록 폼 ── */
function ExpenseForm({ onSaved }: { onSaved?: () => void }) {
  const { categories, addCategory } = useExpenseCategories()

  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [expType, setExpType] = useState<'office' | 'personal'>('office')
  const [fixed, setFixed] = useState(false)
  const [payMethod, setPayMethod] = useState('')
  const [catId, setCatId] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(false)
  const [savedList, setSavedList] = useState<ExpenseEntry[]>([])
  const [installType, setInstallType] = useState<'일시불' | '할부'>('일시불')
  const [installMonths, setInstallMonths] = useState(3)

  const [addCat, setAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catErr, setCatErr] = useState('')
  const newCatRef = useRef<HTMLInputElement>(null)

  const fmt = (v: string) => { const n = v.replace(/\D/g, ''); return n ? Number(n).toLocaleString('ko-KR') : '' }
  const cats = categories.filter(c => c.type === expType)

  const doCat = async () => {
    if (!newCat.trim() || catSaving) return
    setCatSaving(true); setCatErr('')
    try {
      const c = await addCategory(newCat.trim(), expType)
      setCatId(c?.id ?? '')
      setNewCat(''); setAddCat(false)
    } catch (e: unknown) {
      setCatErr(e instanceof Error ? e.message : '카테고리 추가 실패')
    } finally { setCatSaving(false) }
  }

  const save = async () => {
    const raw = Number(amount.replace(/,/g, ''))
    if (!raw) { setError('금액을 입력해주세요.'); return }
    setSaving(true); setError('')
    try {
      const d = new Date(date)
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_type: 'expense',
          amount: raw,
          transaction_date: date,
          description: desc || null,
          memo: memo || null,
          payment_method: payMethod || null,
          installment_months: CARD_METHODS.includes(payMethod) && installType === '할부' ? installMonths : 1,
          income_source_id: null,
          expense_category_id: catId || null,
          expense_type: expType,
          is_fixed: fixed,
        }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || '저장 실패')
      clearTransactionCache(d.getFullYear(), d.getMonth() + 1)
      // 당일 등록분만 목록에 추가
      if (date === today()) {
        const catName = categories.find(c => c.id === catId)?.name || ''
        const iM = CARD_METHODS.includes(payMethod) && installType === '할부' ? installMonths : 1
        setSavedList(prev => [...prev, {
          desc: desc || catName || '지출',
          catName,
          expType,
          payMethod,
          amount: raw,
          installMonths: iM,
        }])
      }
      onSaved?.()
      setAmount(''); setDesc(''); setMemo(''); setPayMethod(''); setCatId('')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally { setSaving(false) }
  }

  const todayTotal = savedList.reduce((s, e) => s + e.amount, 0)

  return (
    <div style={CARD}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f3fb', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: '#eef0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
          <TrendingDown size={18} />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#4f46e5' }}>지출 등록</p>
          <p style={{ fontSize: 11, color: '#9ca3af' }}>사무실 / 개인 지출</p>
        </div>
      </div>

      {/* 폼 */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 날짜 */}
        <div>
          <span style={LABEL}>날짜</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INP} />
        </div>

        {/* 금액 */}
        <div>
          <span style={LABEL}>금액 *</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 800, color: '#9ca3af' }}>₩</span>
            <input type="text" value={amount}
              onChange={e => setAmount(fmt(e.target.value))}
              placeholder="0"
              style={{ ...INP, paddingLeft: 34, fontSize: 18, fontWeight: 800, color: '#4f46e5' }}
            />
          </div>
          {amount && (
            <p style={{ fontSize: 12, color: '#4f46e5', marginTop: 4, fontWeight: 700 }}>
              {formatCurrency(Number(amount.replace(/,/g, '')))}원
            </p>
          )}
        </div>

        {/* 내역 */}
        <div>
          <span style={LABEL}>내역</span>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="예: 창고 임대료" style={INP} />
        </div>

        {/* 지출 구분 */}
        <div>
          <span style={LABEL}>지출 구분</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: 'office' as const, label: '사무실', icon: <Building2 size={13}/>, active: { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' } },
              { key: 'personal' as const, label: '개인', icon: <User size={13}/>, active: { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' } },
            ].map(opt => (
              <button key={opt.key} type="button" onClick={() => { setExpType(opt.key); setCatId('') }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...BTN_PILL(expType === opt.key, opt.active) }}>
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 비용 유형 */}
        <div>
          <span style={LABEL}>비용 유형</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: false, label: '변동비', icon: <Zap size={13}/>, active: { bg: '#eef0fe', border: '#c7c3fa', color: '#4f46e5' } },
              { key: true,  label: '고정비', icon: <Lock size={13}/>, active: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151' } },
            ].map(opt => (
              <button key={String(opt.key)} type="button" onClick={() => setFixed(opt.key)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...BTN_PILL(fixed === opt.key, opt.active) }}>
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 결제수단 */}
        <div>
          <span style={LABEL}>결제수단</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PAYMENT_METHODS.map(pm => {
              const active = payMethod === pm
              const isCash = pm === '현금'
              return (
                <button key={pm} type="button" onClick={() => setPayMethod(active ? '' : pm)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: active ? (isCash ? '#ecfdf5' : '#eef0fe') : '#f3f4f6',
                    border: `1.5px solid ${active ? (isCash ? '#6ee7b7' : '#c7c3fa') : '#e5e7eb'}`,
                    color: active ? (isCash ? '#047857' : '#4f46e5') : '#6b7280',
                  }}>
                  {isCash ? <Banknote size={13}/> : <CreditCard size={13}/>}
                  {pm}
                </button>
              )
            })}
          </div>
        </div>

        {/* 결제 방식 (카드 선택 시에만) */}
        {CARD_METHODS.includes(payMethod) && (
          <div>
            <span style={LABEL}>결제 방식</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              {(['일시불', '할부'] as const).map(opt => (
                <button key={opt} type="button" onClick={() => setInstallType(opt)}
                  style={BTN_PILL(installType === opt, { bg: '#eef0fe', border: '#c7c3fa', color: '#4f46e5' })}>
                  {opt}
                </button>
              ))}
            </div>
            {installType === '할부' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INSTALLMENT_OPTIONS.map(m => (
                  <button key={m} type="button" onClick={() => setInstallMonths(m)}
                    style={{
                      padding: '6px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: installMonths === m ? '#4f46e5' : '#f3f4f6',
                      color: installMonths === m ? '#fff' : '#6b7280',
                      border: `1px solid ${installMonths === m ? '#4f46e5' : '#e5e7eb'}`,
                    }}>
                    {m}개월
                  </button>
                ))}
              </div>
            )}
            {installType === '할부' && (
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                월 {formatCurrency(Math.round(Number(amount.replace(/,/g,'') || 0) / installMonths))}원 × {installMonths}개월
              </p>
            )}
          </div>
        )}

        {/* 카테고리 */}
        <div>
          <span style={LABEL}>카테고리</span>
          {!addCat ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={catId} onChange={e => setCatId(e.target.value)} style={{ ...INP, flex: 1 }}>
                <option value="">선택하세요</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => { setAddCat(true); setCatErr(''); setTimeout(() => newCatRef.current?.focus(), 50) }}
                style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef0fe', border: '1.5px solid #c7c3fa', color: '#4f46e5', cursor: 'pointer' }}>
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <div style={{ background: '#f8faff', border: '1.5px solid #c7c3fa', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5' }}>새 {expType === 'office' ? '사무실' : '개인'} 카테고리</p>
              <input ref={newCatRef} value={newCat} onChange={e => setNewCat(e.target.value)}
                placeholder={expType === 'office' ? '예: 보관료, 광고비' : '예: 헬스장, 식비'}
                style={INP}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); doCat() } }}
              />
              {catErr && <p style={{ fontSize: 12, color: '#dc2626' }}>{catErr}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={doCat} disabled={!newCat.trim() || catSaving}
                  style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 800, cursor: 'pointer', background: '#4f46e5', color: '#fff', border: 'none', opacity: (!newCat.trim() || catSaving) ? 0.5 : 1 }}>
                  <Check size={13} style={{ display: 'inline', marginRight: 5 }} />{catSaving ? '추가 중...' : '추가'}
                </button>
                <button type="button" onClick={() => { setAddCat(false); setNewCat(''); setCatErr('') }}
                  style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: '#f3f4f6', border: 'none', color: '#6b7280' }}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 메모 */}
        <div>
          <span style={LABEL}>메모 (선택)</span>
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="추가 메모" rows={2} style={{ ...INP, resize: 'none' }} />
        </div>

        {error && (
          <p style={{ fontSize: 13, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
            {error}
          </p>
        )}

        <button type="button" onClick={save} disabled={saving}
          style={{
            padding: '13px', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? '#e0e7ff' : 'linear-gradient(135deg,#4f46e5,#7c72f0)',
            color: '#fff', border: 'none', opacity: saving ? 0.7 : 1,
          }}>
          {saving ? '저장 중...' : '지출 저장하기'}
        </button>

        {/* 당일 등록 목록 */}
        {savedList.length > 0 && (
          <div style={{ borderTop: '1px solid #e4e9f5', paddingTop: 14, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5' }}>오늘 등록한 지출</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#4f46e5' }}>합계 {formatCurrency(todayTotal)}원</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {savedList.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: e.expType === 'office' ? '#2563eb' : '#ea580c', padding: '2px 6px', flexShrink: 0 }}>
                      {e.expType === 'office' ? '사무실' : '개인'}
                    </span>
                    {e.catName && <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{e.catName}</span>}
                    <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc !== e.catName ? e.desc : ''}</span>
                    {e.payMethod && (
                      <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                        {e.payMethod}{e.installMonths > 1 ? ` ${e.installMonths}개월 할부` : ' 일시불'}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>-{formatCurrency(e.amount)}</div>
                    {e.installMonths > 1 && (
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>월 {formatCurrency(Math.round(e.amount / e.installMonths))}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg="✓ 지출이 등록되었습니다" />}
    </div>
  )
}

/* ── 메인 페이지 ── */
export default function RegisterPage() {
  const [cardRefresh, setCardRefresh] = useState(0)

  return (
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--day-text1)' }}>내역 등록</h1>
        <p style={{ fontSize: 13, color: 'var(--day-text3)', marginTop: 3 }}>수입과 지출을 직접 입력하세요</p>
      </div>
      <div className="register-layout fade-up">
        <IncomeForm />
        <ExpenseForm onSaved={() => setCardRefresh(r => r + 1)} />
        <CardSummaryPanel refreshTrigger={cardRefresh} />
      </div>
    </div>
  )
}
