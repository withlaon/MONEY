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

const F: React.CSSProperties = {
  width: '100%',
  background: 'var(--day-card2)',
  border: '1px solid var(--day-border)',
  borderRadius: 14,
  padding: '12px 16px',
  fontSize: 15,
  color: 'var(--day-text1)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export default function TransactionForm({ onSubmit, onClose, defaultType = 'income' }: Props) {
  const { sources, addSource } = useIncomeSources()
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
  const [addSrc,  setAddSrc]  = useState(false)
  const [newSrc,  setNewSrc]  = useState('')
  const [addCat,  setAddCat]  = useState(false)
  const [newCat,  setNewCat]  = useState('')

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
    } catch(err: unknown) { setError(err instanceof Error ? err.message : '저장 오류') }
    finally { setLoading(false) }
  }

  const doSrc = async () => {
    if (!newSrc.trim()) return
    try { const s = await addSource(newSrc.trim()); setSrcId(s.id); setNewSrc(''); setAddSrc(false) }
    catch { setError('입금처 추가 실패') }
  }
  const doCat = async () => {
    if (!newCat.trim()) return
    try { const c = await addCategory(newCat.trim(), expType); setCatId(c.id); setNewCat(''); setAddCat(false) }
    catch { setError('카테고리 추가 실패') }
  }

  const Label = ({t}: {t:string}) => (
    <p className="text-[13px] sm:text-[14px] font-bold mb-2" style={{ color: 'var(--day-text2)' }}>{t}</p>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-6"
      onClick={onClose}
      style={{ background: 'rgba(15,18,32,0.6)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="relative w-full sm:max-w-xl scale-in"
        style={{
          background: 'var(--day-surface)',
          border: '1px solid var(--day-border)',
          /* 모바일: 위쪽만 둥글게 / 데스크탑: 완전 둥글게 */
          borderRadius: 'clamp(20px, 3vw, 28px) clamp(20px, 3vw, 28px) 0 0',
          boxShadow: 'var(--day-shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 (모바일) */}
        <div className="flex justify-center pt-3.5 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--day-border2)' }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-7 py-5 sm:px-8 sm:py-5"
          style={{ borderBottom: '1px solid var(--day-border)' }}>
          <p className="text-[18px] sm:text-[20px] font-extrabold" style={{ color: 'var(--day-text1)' }}>
            거래 추가
          </p>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)', color: 'var(--day-text2)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit}
          className="px-7 py-6 sm:px-8 sm:py-7 space-y-5 overflow-y-auto"
          style={{ maxHeight: 'min(78vh, 680px)' }}>

          {/* 수입/지출 탭 */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl"
            style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)' }}>
            {(['income','expense'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-bold transition-all"
                style={{
                  background: type===t ? (t==='income' ? 'var(--income-soft)' : 'var(--expense-soft)') : 'transparent',
                  border: `1px solid ${type===t ? (t==='income' ? 'var(--income-border)' : 'var(--expense-border)') : 'transparent'}`,
                  color: type===t ? (t==='income' ? 'var(--income)' : 'var(--expense)') : 'var(--day-text3)',
                  boxShadow: type===t ? 'var(--day-shadow)' : 'none',
                }}>
                {t==='income' ? <TrendingUp size={17}/> : <TrendingDown size={17}/>}
                {t==='income' ? '수입' : '지출'}
              </button>
            ))}
          </div>

          {/* 금액 */}
          <div>
            <Label t="금액 *" />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-extrabold" style={{ color: 'var(--day-text3)' }}>₩</span>
              <input type="text" value={amount} onChange={e => setAmount(fmt(e.target.value))}
                placeholder="0" style={{ ...F, paddingLeft: 38 }} required
                className="focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(80,70,228,0.1)]" />
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <Label t="날짜 *" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={F} required
              className="focus:border-[var(--primary)]" />
          </div>

          {/* 내역 */}
          <div>
            <Label t="내역" />
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="예: 스마트스토어 6월 정산" style={F}
              className="focus:border-[var(--primary)]" />
          </div>

          {/* 수입: 입금처 */}
          {type==='income' && (
            <div>
              <Label t="입금처" />
              {!addSrc ? (
                <div className="flex gap-2">
                  <select value={srcId} onChange={e => setSrcId(e.target.value)} style={{ ...F, flex:1 }}
                    className="focus:border-[var(--primary)]">
                    <option value="">선택하세요</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setAddSrc(true)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-light)' }}>
                    <Plus size={17}/>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input autoFocus value={newSrc} onChange={e => setNewSrc(e.target.value)} placeholder="새 입금처 이름"
                    style={{ ...F, flex:1, borderColor:'var(--primary)' }} onKeyDown={e => e.key==='Enter' && doSrc()}/>
                  <button type="button" onClick={doSrc} className="px-4 rounded-xl text-[14px] font-bold"
                    style={{ background: 'var(--primary)', color: 'white' }}>추가</button>
                  <button type="button" onClick={() => {setAddSrc(false);setNewSrc('')}}
                    className="px-3 rounded-xl text-[13px]"
                    style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)', color: 'var(--day-text2)' }}>취소</button>
                </div>
              )}
            </div>
          )}

          {/* 지출 */}
          {type==='expense' && (
            <>
              <div>
                <Label t="지출 구분" />
                <div className="grid grid-cols-2 gap-2.5">
                  {(['office','personal'] as const).map(et => (
                    <button key={et} type="button" onClick={() => { setExpType(et); setCatId('') }}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold border transition-all"
                      style={{
                        background: expType===et ? (et==='office' ? 'var(--office-soft)' : 'var(--personal-soft)') : 'var(--day-card2)',
                        border: `1px solid ${expType===et ? (et==='office' ? 'var(--office-border)' : 'var(--personal-border)') : 'var(--day-border)'}`,
                        color: expType===et ? (et==='office' ? 'var(--office)' : 'var(--personal)') : 'var(--day-text3)',
                        boxShadow: expType===et ? 'var(--day-shadow)' : 'none',
                      }}>
                      {et==='office' ? <Building2 size={16}/> : <User size={16}/>}
                      {et==='office' ? '사무실' : '개인'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label t="카테고리" />
                {!addCat ? (
                  <div className="flex gap-2">
                    <select value={catId} onChange={e => setCatId(e.target.value)} style={{ ...F, flex:1 }}
                      className="focus:border-[var(--primary)]">
                      <option value="">선택하세요</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setAddCat(true)}
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-light)' }}>
                      <Plus size={17}/>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                      placeholder={`새 ${expType==='office'?'사무실':'개인'} 카테고리`}
                      style={{ ...F, flex:1, borderColor:'var(--primary)' }} onKeyDown={e => e.key==='Enter' && doCat()}/>
                    <button type="button" onClick={doCat} className="px-4 rounded-xl text-[14px] font-bold"
                      style={{ background: 'var(--primary)', color: 'white' }}>추가</button>
                    <button type="button" onClick={() => {setAddCat(false);setNewCat('')}}
                      className="px-3 rounded-xl text-[13px]"
                      style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)', color: 'var(--day-text2)' }}>취소</button>
                  </div>
                )}
              </div>

              <button type="button" onClick={() => setFixed(!fixed)}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[14px] font-bold transition-all"
                style={{
                  background: fixed ? 'var(--fixed-soft)' : 'var(--day-card2)',
                  border: `1px solid ${fixed ? 'var(--fixed-border)' : 'var(--day-border)'}`,
                  color: fixed ? 'var(--fixed)' : 'var(--day-text3)',
                }}>
                {fixed ? <Lock size={16}/> : <Unlock size={16}/>}
                <span>{fixed ? '고정비 (매달 반복)' : '변동비 (비정기 지출)'}</span>
                <span className="ml-auto text-[12px] opacity-40">{fixed ? '→ 변동비로' : '→ 고정비로'}</span>
              </button>
            </>
          )}

          {/* 메모 */}
          <div>
            <Label t="메모" />
            <textarea value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="추가 메모 (선택사항)" rows={2}
              style={{ ...F, resize: 'none' }} className="focus:border-[var(--primary)]" />
          </div>

          {error && (
            <p className="text-[13px] px-4 py-3 rounded-xl"
              style={{ background: 'var(--expense-soft)', border: '1px solid var(--expense-border)', color: 'var(--expense)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[15px] font-bold"
              style={{ background: 'var(--day-card2)', border: '1px solid var(--day-border)', color: 'var(--day-text2)' }}>
              취소
            </button>
            <button type="submit" disabled={loading}
              className={cn('flex-1 py-4 rounded-2xl text-[15px] font-extrabold text-white', loading && 'opacity-60 cursor-not-allowed')}
              style={{
                background: type==='income'
                  ? 'linear-gradient(135deg, #047857, #10b981)'
                  : 'linear-gradient(135deg, #5046e4, #7c72f0)',
                boxShadow: type==='income'
                  ? '0 4px 16px rgba(4,120,87,0.28)'
                  : '0 4px 16px rgba(80,70,228,0.32)',
              }}>
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
