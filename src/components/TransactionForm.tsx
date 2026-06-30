'use client'

import { useState } from 'react'
import { X, Plus, TrendingUp, TrendingDown, Building2, User, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'

interface Props {
  onSubmit: (d: Omit<Transaction, 'id'|'created_at'|'updated_at'|'income_sources'|'expense_categories'>) => Promise<void>
  onClose: () => void
  defaultType?: 'income' | 'expense'
}

const field: React.CSSProperties = {
  width: '100%', background: 'var(--bg-base)',
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '10px 14px', fontSize: 13, color: 'var(--text-1)',
  transition: 'border-color 0.15s',
}

export default function TransactionForm({ onSubmit, onClose, defaultType = 'income' }: Props) {
  const { sources, addSource }     = useIncomeSources()
  const { categories, addCategory } = useExpenseCategories()

  const [type,    setType]    = useState<'income'|'expense'>(defaultType)
  const [amount,  setAmount]  = useState('')
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [desc,    setDesc]    = useState('')
  const [memo,    setMemo]    = useState('')
  const [srcId,   setSrcId]   = useState('')
  const [catId,   setCatId]   = useState('')
  const [expType, setExpType] = useState<'office'|'personal'>('office')
  const [fixed,   setFixed]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const [addSrc, setAddSrc]   = useState(false)
  const [newSrc, setNewSrc]   = useState('')
  const [addCat, setAddCat]   = useState(false)
  const [newCat, setNewCat]   = useState('')

  const fmt = (v: string) => { const n = v.replace(/\D/g,''); return n ? Number(n).toLocaleString('ko-KR') : '' }
  const cats = categories.filter(c => c.type === expType)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = Number(amount.replace(/,/g,''))
    if (!raw) { setError('금액을 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      await onSubmit({
        transaction_type: type, amount: raw, transaction_date: date,
        description: desc||null, memo: memo||null,
        income_source_id:    type==='income'  ? (srcId||null) : null,
        expense_category_id: type==='expense' ? (catId||null) : null,
        expense_type: type==='expense' ? expType : null,
        is_fixed: type==='expense' ? fixed : false,
      })
      onClose()
    } catch(err: unknown) {
      setError(err instanceof Error ? err.message : '저장 오류')
    } finally { setLoading(false) }
  }

  const doAddSrc = async () => {
    if (!newSrc.trim()) return
    try { const s = await addSource(newSrc.trim()); setSrcId(s.id); setNewSrc(''); setAddSrc(false) }
    catch { setError('입금처 추가 실패') }
  }
  const doAddCat = async () => {
    if (!newCat.trim()) return
    try { const c = await addCategory(newCat.trim(), expType); setCatId(c.id); setNewCat(''); setAddCat(false) }
    catch { setError('카테고리 추가 실패') }
  }

  const Label = ({ t }: { t: string }) => (
    <p className="text-[11px] sm:text-[12px] font-semibold mb-1.5" style={{ color:'var(--text-3)' }}>{t}</p>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
    >
      <div
        className="relative w-full sm:max-w-md scale-in"
        style={{
          background:'var(--bg-surface)',
          border:'1px solid var(--border-mid)',
          /* 모바일: 하단 시트 */
          borderRadius:'20px 20px 0 0',
          boxShadow:'0 -8px 40px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 모바일 핸들 */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background:'var(--border-mid)' }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:rounded-t-[20px]" style={{ borderBottom:'1px solid var(--border)' }}>
          <p className="text-[15px] sm:text-[16px] font-bold" style={{ color:'var(--text-1)' }}>거래 추가</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'var(--bg-elevated)', color:'var(--text-2)' }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3.5 overflow-y-auto" style={{ maxHeight:'80vh' }}>

          {/* 타입 토글 */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl" style={{ background:'var(--bg-base)' }}>
            {(['income','expense'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                style={{
                  background: type===t ? (t==='income' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)') : 'transparent',
                  border: `1px solid ${type===t ? (t==='income' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)') : 'transparent'}`,
                  color: type===t ? (t==='income' ? 'var(--income)' : 'var(--expense)') : 'var(--text-3)',
                }}
              >
                {t==='income' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                {t==='income' ? '수입' : '지출'}
              </button>
            ))}
          </div>

          {/* 금액 */}
          <div>
            <Label t="금액 *" />
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold" style={{ color:'var(--text-3)' }}>₩</span>
              <input type="text" value={amount} onChange={e => setAmount(fmt(e.target.value))}
                placeholder="0" style={{ ...field, paddingLeft:32 }} className="focus:border-[var(--primary)]" required />
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <Label t="날짜 *" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} className="focus:border-[var(--primary)]" required />
          </div>

          {/* 내역 */}
          <div>
            <Label t="내역" />
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="예: 스마트스토어 정산" style={field} className="focus:border-[var(--primary)]" />
          </div>

          {/* 수입: 입금처 */}
          {type==='income' && (
            <div>
              <Label t="입금처" />
              {!addSrc ? (
                <div className="flex gap-2">
                  <select value={srcId} onChange={e => setSrcId(e.target.value)} style={{ ...field, flex:1 }} className="focus:border-[var(--primary)]">
                    <option value="">선택하세요</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setAddSrc(true)} className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background:'var(--primary-glow)', border:'1px solid rgba(124,111,224,0.25)', color:'var(--primary-light)' }}>
                    <Plus size={15}/>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input autoFocus value={newSrc} onChange={e => setNewSrc(e.target.value)} placeholder="새 입금처" style={{ ...field, flex:1, borderColor:'var(--primary)' }} onKeyDown={e => e.key==='Enter' && doAddSrc()}/>
                  <button type="button" onClick={doAddSrc} className="px-3 py-2 rounded-xl text-[12px] font-bold" style={{ background:'var(--primary)', color:'white' }}>추가</button>
                  <button type="button" onClick={() => {setAddSrc(false);setNewSrc('')}} className="px-3 py-2 rounded-xl text-[12px]" style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-2)' }}>취소</button>
                </div>
              )}
            </div>
          )}

          {/* 지출: 구분 + 카테고리 + 고정비 */}
          {type==='expense' && (
            <>
              <div>
                <Label t="지출 구분" />
                <div className="grid grid-cols-2 gap-2">
                  {(['office','personal'] as const).map(et => (
                    <button key={et} type="button" onClick={() => { setExpType(et); setCatId('') }}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold border transition-all"
                      style={{
                        background: expType===et ? (et==='office' ? 'var(--office-soft)' : 'var(--personal-soft)') : 'var(--bg-base)',
                        border: `1px solid ${expType===et ? (et==='office' ? 'rgba(59,130,246,0.3)' : 'rgba(249,115,22,0.3)') : 'var(--border)'}`,
                        color: expType===et ? (et==='office' ? 'var(--office)' : 'var(--personal)') : 'var(--text-3)',
                      }}>
                      {et==='office' ? <Building2 size={14}/> : <User size={14}/>}
                      {et==='office' ? '사무실' : '개인'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label t="카테고리" />
                {!addCat ? (
                  <div className="flex gap-2">
                    <select value={catId} onChange={e => setCatId(e.target.value)} style={{ ...field, flex:1 }} className="focus:border-[var(--primary)]">
                      <option value="">선택하세요</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setAddCat(true)} className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background:'var(--primary-glow)', border:'1px solid rgba(124,111,224,0.25)', color:'var(--primary-light)' }}>
                      <Plus size={15}/>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="새 카테고리" style={{ ...field, flex:1, borderColor:'var(--primary)' }} onKeyDown={e => e.key==='Enter' && doAddCat()}/>
                    <button type="button" onClick={doAddCat} className="px-3 py-2 rounded-xl text-[12px] font-bold" style={{ background:'var(--primary)', color:'white' }}>추가</button>
                    <button type="button" onClick={() => {setAddCat(false);setNewCat('')}} className="px-3 py-2 rounded-xl text-[12px]" style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-2)' }}>취소</button>
                  </div>
                )}
              </div>

              <button type="button" onClick={() => setFixed(!fixed)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-semibold transition-all"
                style={{
                  background: fixed ? 'var(--fixed-soft)' : 'var(--bg-base)',
                  border: `1px solid ${fixed ? 'rgba(148,163,184,0.25)' : 'var(--border)'}`,
                  color: fixed ? 'var(--fixed)' : 'var(--text-3)',
                }}>
                {fixed ? <Lock size={14}/> : <Unlock size={14}/>}
                <span>{fixed ? '고정비 (매달 반복)' : '변동비 (비정기)'}</span>
                <span className="ml-auto text-[11px] opacity-50">{fixed ? '→ 변동비로' : '→ 고정비로'}</span>
              </button>
            </>
          )}

          {/* 메모 */}
          <div>
            <Label t="메모" />
            <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="추가 메모 (선택사항)" rows={2}
              style={{ ...field, resize:'none' }} className="focus:border-[var(--primary)]" />
          </div>

          {error && (
            <p className="text-[12px] px-3 py-2.5 rounded-xl" style={{ background:'var(--expense-soft)', border:'1px solid var(--expense-border)', color:'var(--expense)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1 pb-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-[13px] font-semibold"
              style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-2)' }}>
              취소
            </button>
            <button type="submit" disabled={loading}
              className={cn('flex-1 py-3 rounded-xl text-[13px] font-bold text-white', loading && 'opacity-60 cursor-not-allowed')}
              style={{
                background: type==='income'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #7c6fe0, #5348c7)',
                boxShadow: type==='income'
                  ? '0 4px 14px rgba(16,185,129,0.25)'
                  : '0 4px 14px rgba(124,111,224,0.3)',
              }}>
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
