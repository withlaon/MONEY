'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, TrendingUp, TrendingDown, Building2, User, Lock, Zap, Check, CreditCard, Banknote, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'
import { useIncomeSources, useExpenseCategories, useDescriptionPresets } from '@/hooks/useTransactions'

const PAYMENT_METHODS = ['현금', '삼성카드', 'KB카드', '현대카드'] as const
const INCOME_CATS = ['판매대금', '기타'] as const

interface Props {
  onSubmit: (d: Omit<Transaction, 'id'|'created_at'|'updated_at'|'income_sources'|'expense_categories'>) => Promise<void>
  onClose: () => void
  defaultType?: 'income' | 'expense'
  initialValues?: Transaction
}

const INP: React.CSSProperties = {
  width: '100%', background: '#f8faff', border: '1.5px solid #e4e9f5',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827',
  transition: 'border-color 0.15s',
}

const Label = ({ t }: { t: string }) => (
  <p style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 8, letterSpacing: '0.02em' }}>{t}</p>
)

/* 내역 콤보박스 */
function DescCombobox({
  value, onChange, presets, onAddPreset,
}: {
  value: string
  onChange: (v: string) => void
  presets: { id: string; name: string }[]
  onAddPreset: (name: string) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = value
    ? presets.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
    : presets

  const handleAdd = async () => {
    if (!value.trim() || adding) return
    setAdding(true)
    try { await onAddPreset(value.trim()) } finally { setAdding(false) }
    setOpen(false)
  }

  const alreadyExists = presets.some(p => p.name === value.trim())

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={value}
            onChange={e => { onChange(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="직접 입력하거나 선택하세요"
            style={INP}
          />
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2,
            }}
          >
            <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
          </button>
        </div>
        {value.trim() && !alreadyExists && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            title="목록에 추가"
            style={{
              width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#eef0fe', border: '1.5px solid #c7c3fa', color: '#4f46e5', cursor: 'pointer', flexShrink: 0,
              opacity: adding ? 0.5 : 1,
            }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
          background: '#fff', border: '1.5px solid #e4e9f5', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 180, overflowY: 'auto',
        }}>
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.name); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#111827',
                borderBottom: '1px solid #f3f4f6',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TransactionForm({ onSubmit, onClose, defaultType = 'income', initialValues }: Props) {
  const { sources } = useIncomeSources()
  const { categories, addCategory } = useExpenseCategories()
  const { presets, addPreset } = useDescriptionPresets()

  /* 드래그로 창이 닫히는 버그 방지: mousedown이 오버레이에서 시작된 경우만 닫기 */
  const overlayMouseDownRef = useRef(false)

  const isEdit = !!initialValues?.id

  /* 초기값 설정 */
  const initIncomeCat = () => {
    if (!initialValues?.income_source_id) return '판매대금'
    const src = sources.find(s => s.id === initialValues.income_source_id)
    if (src?.name === '기타') return '기타'
    return '판매대금'
  }

  const [type,       setType]       = useState<'income'|'expense'>(initialValues?.transaction_type ?? defaultType)
  const [amount,     setAmount]     = useState(initialValues ? initialValues.amount.toLocaleString('ko-KR') : '')
  const [date,       setDate]       = useState(initialValues?.transaction_date ?? new Date().toISOString().split('T')[0])
  const [desc,       setDesc]       = useState(initialValues?.description ?? '')
  const [memo,       setMemo]       = useState(initialValues?.memo ?? '')
  const [catId,      setCatId]      = useState(initialValues?.expense_category_id ?? '')
  const [expType,    setExpType]    = useState<'office'|'personal'>(initialValues?.expense_type ?? 'office')
  const [fixed,      setFixed]      = useState(initialValues?.is_fixed ?? false)
  const [payMethod,  setPayMethod]  = useState(initialValues?.payment_method ?? '')
  const [incomeCat,  setIncomeCat]  = useState<'판매대금'|'기타'>(() => initIncomeCat() as '판매대금'|'기타')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  /* 카테고리 추가 */
  const [addCat,    setAddCat]    = useState(false)
  const [newCat,    setNewCat]    = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catErr,    setCatErr]    = useState('')
  const newCatRef = useRef<HTMLInputElement>(null)

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, '')
    return n ? Number(n).toLocaleString('ko-KR') : ''
  }

  const cats = categories.filter(c => c.type === expType)

  /* 수입 카테고리 → income_source_id 변환 */
  const resolveIncomeSrcId = () => {
    const match = sources.find(s => s.name === incomeCat)
    return match?.id ?? null
  }

  const submit = async () => {
    const raw = Number(amount.replace(/,/g, ''))
    if (!raw) { setError('금액을 입력해주세요.'); return }
    setSaving(true); setError('')
    try {
      await onSubmit({
        transaction_type: type,
        amount: raw,
        transaction_date: date,
        description: desc || null,
        memo: memo || null,
        payment_method: type === 'expense' ? (payMethod || null) : null,
        income_source_id:    type === 'income'  ? resolveIncomeSrcId() : null,
        expense_category_id: type === 'expense' ? (catId || null) : null,
        expense_type: type === 'expense' ? expType : null,
        is_fixed: type === 'expense' ? fixed : false,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const doCat = async () => {
    if (!newCat.trim() || catSaving) return
    setCatSaving(true); setCatErr('')
    try {
      const c = await addCategory(newCat.trim(), expType)
      setCatId(c?.id ?? '')
      setNewCat(''); setAddCat(false)
    } catch (e: unknown) {
      setCatErr(e instanceof Error ? e.message : '카테고리 추가 실패')
    } finally {
      setCatSaving(false)
    }
  }

  /* 공통 2-버튼 토글 */
  const Toggle2 = <T extends string>({
    options, value, onChange,
  }: {
    options: { key: T; label: string; icon: React.ReactNode; active: { bg: string; border: string; color: string } }[]
    value: T
    onChange: (v: T) => void
  }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 8 }}>
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
            background: value === opt.key ? opt.active.bg : '#f8faff',
            border: `1.5px solid ${value === opt.key ? opt.active.border : '#e4e9f5'}`,
            color: value === opt.key ? opt.active.color : '#9ca3af',
            transition: 'all 0.12s',
          }}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-8"
      onMouseDown={e => { overlayMouseDownRef.current = e.target === e.currentTarget }}
      onMouseUp={() => { if (overlayMouseDownRef.current) onClose() }}
      style={{ background: 'rgba(0,0,0,0.82)' }}
    >
      <div
        className="relative w-full sm:max-w-lg scale-in"
        style={{
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e4e9f5' }} />
        </div>

        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 14px', borderBottom: '1px solid #f0f3fb',
        }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>
            {isEdit ? '거래 수정' : '거래 추가'}
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center',
              background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#6b7280',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* 폼 */}
        <div
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >

          {/* 수입 / 지출 선택 */}
          <Toggle2
            value={type}
            onChange={setType}
            options={[
              { key: 'income' as const, label: '수입', icon: <TrendingUp size={15}/>,
                active: { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' } },
              { key: 'expense' as const, label: '지출', icon: <TrendingDown size={15}/>,
                active: { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' } },
            ]}
          />

          {/* 금액 */}
          <div>
            <Label t="금액 *" />
            <div style={{ position: 'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, fontWeight:800, color:'#9ca3af' }}>₩</span>
              <input
                type="text" value={amount}
                onChange={e => setAmount(fmt(e.target.value))}
                placeholder="0"
                style={{ ...INP, paddingLeft: 34 }}
              />
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <Label t="날짜 *" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INP} />
          </div>

          {/* ── 수입 전용 ── */}
          {type === 'income' && (
            <>
              {/* 수입 카테고리 */}
              <div>
                <Label t="카테고리" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {INCOME_CATS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIncomeCat(cat)}
                      style={{
                        padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.12s',
                        background: incomeCat === cat ? '#ecfdf5' : '#f8faff',
                        border: `1.5px solid ${incomeCat === cat ? '#a7f3d0' : '#e4e9f5'}`,
                        color: incomeCat === cat ? '#059669' : '#9ca3af',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 내역 콤보박스 */}
              <div>
                <Label t="내역 (선택·입력·추가 가능)" />
                <DescCombobox
                  value={desc}
                  onChange={setDesc}
                  presets={presets}
                  onAddPreset={addPreset}
                />
              </div>
            </>
          )}

          {/* ── 지출 전용 ── */}
          {type === 'expense' && (
            <>
              {/* 내역 */}
              <div>
                <Label t="내역 (선택)" />
                <input
                  type="text" value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="예: 창고 임대료"
                  style={INP}
                />
              </div>

              {/* 지출 구분 */}
              <div>
                <Label t="지출 구분" />
                <Toggle2
                  value={expType}
                  onChange={(v) => { setExpType(v); setCatId('') }}
                  options={[
                    { key: 'office' as const, label: '사무실', icon: <Building2 size={14}/>,
                      active: { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' } },
                    { key: 'personal' as const, label: '개인', icon: <User size={14}/>,
                      active: { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' } },
                  ]}
                />
              </div>

              {/* 비용 유형 */}
              <div>
                <Label t="비용 유형" />
                <Toggle2
                  value={fixed ? 'fixed' : 'variable'}
                  onChange={(v) => setFixed(v === 'fixed')}
                  options={[
                    { key: 'variable' as const, label: '변동비', icon: <Zap size={14}/>,
                      active: { bg: '#eef0fe', border: '#c7c3fa', color: '#4f46e5' } },
                    { key: 'fixed' as const, label: '고정비', icon: <Lock size={14}/>,
                      active: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151' } },
                  ]}
                />
                <p style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>
                  {fixed ? '매월 반복되는 고정 지출 (임대료, 구독료 등)' : '비정기적인 변동 지출'}
                </p>
              </div>

              {/* 결제수단 */}
              <div>
                <Label t="결제수단" />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PAYMENT_METHODS.map(pm => {
                    const isActive = payMethod === pm
                    const isCash = pm === '현금'
                    return (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPayMethod(isActive ? '' : pm)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.12s',
                          background: isActive ? (isCash ? '#ecfdf5' : '#eef0fe') : '#f3f4f6',
                          border: `1.5px solid ${isActive ? (isCash ? '#6ee7b7' : '#c7c3fa') : '#e5e7eb'}`,
                          color: isActive ? (isCash ? '#047857' : '#4f46e5') : '#6b7280',
                        }}
                      >
                        {isCash ? <Banknote size={13} /> : <CreditCard size={13} />}
                        {pm}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <Label t="카테고리" />
                {!addCat ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <select
                      value={catId}
                      onChange={e => setCatId(e.target.value)}
                      style={{ ...INP, flex:1 }}
                    >
                      <option value="">선택하세요</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setAddCat(true); setCatErr(''); setTimeout(() => newCatRef.current?.focus(), 50) }}
                      style={{
                        width:42, height:42, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
                        background:'#eef0fe', border:'1.5px solid #c7c3fa', color:'#4f46e5', cursor:'pointer', flexShrink:0,
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ background:'#f8faff', border:'1.5px solid #c7c3fa', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                    <p style={{ fontSize:12, fontWeight:800, color:'#4f46e5' }}>
                      새 {expType === 'office' ? '사무실' : '개인'} 카테고리 추가
                    </p>
                    <input
                      ref={newCatRef}
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                      placeholder={expType === 'office' ? '예: 보관료, 광고비' : '예: 헬스장, 식비'}
                      style={INP}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doCat() } }}
                    />
                    {catErr && <p style={{ fontSize:12, color:'#dc2626' }}>{catErr}</p>}
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={doCat} disabled={!newCat.trim() || catSaving}
                        style={{
                          flex:1, padding:'9px', borderRadius:9, fontSize:13, fontWeight:800, cursor:'pointer',
                          background:'#4f46e5', color:'#fff', border:'none', opacity:(!newCat.trim()||catSaving)?0.5:1,
                        }}>
                        <Check size={13} style={{ display:'inline', marginRight:5 }} />
                        {catSaving ? '추가 중...' : '추가'}
                      </button>
                      <button type="button" onClick={() => { setAddCat(false); setNewCat(''); setCatErr('') }}
                        style={{ padding:'9px 16px', borderRadius:9, fontSize:13, cursor:'pointer', background:'#f3f4f6', border:'none', color:'#6b7280' }}>
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 메모 */}
          <div>
            <Label t="메모 (선택)" />
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="추가 메모"
              rows={2}
              style={{ ...INP, resize:'none' }}
            />
          </div>

          {/* 에러 */}
          {error && (
            <p style={{ fontSize:13, padding:'10px 14px', borderRadius:10, background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626' }}>
              {error}
            </p>
          )}

          {/* 저장 버튼 */}
          <div style={{ display:'flex', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose}
              style={{
                flex:1, padding:'13px', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer',
                background:'#f3f4f6', border:'none', color:'#6b7280',
              }}>
              취소
            </button>
            <button type="button" onClick={submit} disabled={saving}
              className={cn(saving && 'opacity-60')}
              style={{
                flex:2, padding:'13px', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer',
                color:'#fff', border:'none',
                background: type === 'income'
                  ? 'linear-gradient(135deg,#047857,#10b981)'
                  : 'linear-gradient(135deg,#4f46e5,#7c72f0)',
              }}>
              {saving ? '저장 중...' : isEdit ? '수정하기' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
