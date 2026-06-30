'use client'

import { useState } from 'react'
import { X, Plus, TrendingUp, TrendingDown, Building2, User, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Transaction } from '@/lib/supabase'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'income_sources' | 'expense_categories'>) => Promise<void>
  onClose: () => void
  defaultType?: 'income' | 'expense'
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  transition: 'border-color 0.15s',
} as React.CSSProperties

const selectStyle = { ...inputStyle }

export default function TransactionForm({ onSubmit, onClose, defaultType = 'income' }: TransactionFormProps) {
  const { sources, addSource } = useIncomeSources()
  const { categories, addCategory } = useExpenseCategories()

  const [type, setType] = useState<'income' | 'expense'>(defaultType)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [memo, setMemo] = useState('')
  const [incomeSourceId, setIncomeSourceId] = useState('')
  const [expenseCategoryId, setExpenseCategoryId] = useState('')
  const [expenseType, setExpenseType] = useState<'office' | 'personal'>('office')
  const [isFixed, setIsFixed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showAddSource, setShowAddSource] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const currentCategories = categories.filter(c => c.type === expenseType)

  const formatAmountInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    return num ? Number(num).toLocaleString('ko-KR') : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = Number(amount.replace(/,/g, ''))
    if (!raw || raw <= 0) { setError('금액을 올바르게 입력해주세요.'); return }
    setLoading(true); setError('')
    try {
      await onSubmit({
        transaction_type: type,
        amount: raw,
        transaction_date: date,
        description: description || null,
        memo: memo || null,
        income_source_id: type === 'income' ? (incomeSourceId || null) : null,
        expense_category_id: type === 'expense' ? (expenseCategoryId || null) : null,
        expense_type: type === 'expense' ? expenseType : null,
        is_fixed: type === 'expense' ? isFixed : false,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    try {
      const src = await addSource(newSourceName.trim())
      setIncomeSourceId(src.id); setNewSourceName(''); setShowAddSource(false)
    } catch { setError('입금처 추가 실패') }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const cat = await addCategory(newCategoryName.trim(), expenseType)
      setExpenseCategoryId(cat.id); setNewCategoryName(''); setShowAddCategory(false)
    } catch { setError('카테고리 추가 실패') }
  }

  const sectionLabel = (text: string) => (
    <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{text}</p>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-md scale-in"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
            거래 추가
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">

          {/* 수입/지출 토글 */}
          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl"
            style={{ background: 'var(--bg-base)' }}
          >
            {(['income', 'expense'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                style={{
                  background: type === t
                    ? t === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'
                    : 'transparent',
                  border: `1px solid ${type === t
                    ? t === 'income' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'
                    : 'transparent'}`,
                  color: type === t
                    ? t === 'income' ? '#10b981' : '#f43f5e'
                    : 'var(--text-muted)',
                }}
              >
                {t === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {t === 'income' ? '수입' : '지출'}
              </button>
            ))}
          </div>

          {/* 금액 */}
          <div>
            {sectionLabel('금액 *')}
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >₩</span>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(formatAmountInput(e.target.value))}
                placeholder="0"
                style={{ ...inputStyle, paddingLeft: 32 }}
                className="focus:border-[var(--primary)]"
                required
              />
            </div>
          </div>

          {/* 날짜 */}
          <div>
            {sectionLabel('날짜 *')}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              className="focus:border-[var(--primary)]"
              required
            />
          </div>

          {/* 내역 */}
          <div>
            {sectionLabel('내역')}
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 스마트스토어 정산"
              style={inputStyle}
              className="focus:border-[var(--primary)]"
            />
          </div>

          {/* 수입: 입금처 */}
          {type === 'income' && (
            <div>
              {sectionLabel('입금처')}
              {!showAddSource ? (
                <div className="flex gap-2">
                  <select
                    value={incomeSourceId}
                    onChange={e => setIncomeSourceId(e.target.value)}
                    style={{ ...selectStyle, flex: 1 }}
                    className="focus:border-[var(--primary)]"
                  >
                    <option value="">선택하세요</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddSource(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(123,111,224,0.1)', border: '1px solid rgba(123,111,224,0.25)', color: 'var(--primary-light)' }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newSourceName}
                    onChange={e => setNewSourceName(e.target.value)}
                    placeholder="새 입금처 이름"
                    style={{ ...inputStyle, flex: 1, borderColor: 'var(--primary)' }}
                    onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                  />
                  <button type="button" onClick={handleAddSource} className="px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors" style={{ background: 'var(--primary)', color: 'white' }}>추가</button>
                  <button type="button" onClick={() => { setShowAddSource(false); setNewSourceName('') }} className="px-3 py-2 rounded-xl text-[12px] font-medium transition-colors" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>취소</button>
                </div>
              )}
            </div>
          )}

          {/* 지출: 구분 + 카테고리 + 고정비 */}
          {type === 'expense' && (
            <>
              <div>
                {sectionLabel('지출 구분')}
                <div className="grid grid-cols-2 gap-2">
                  {(['office', 'personal'] as const).map(et => (
                    <button
                      key={et}
                      type="button"
                      onClick={() => { setExpenseType(et); setExpenseCategoryId('') }}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold border transition-all"
                      style={{
                        background: expenseType === et
                          ? et === 'office' ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)'
                          : 'var(--bg-base)',
                        border: `1px solid ${expenseType === et
                          ? et === 'office' ? 'rgba(59,130,246,0.3)' : 'rgba(249,115,22,0.3)'
                          : 'var(--border)'}`,
                        color: expenseType === et
                          ? et === 'office' ? '#3b82f6' : '#f97316'
                          : 'var(--text-muted)',
                      }}
                    >
                      {et === 'office' ? <Building2 size={14} /> : <User size={14} />}
                      {et === 'office' ? '사무실' : '개인'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {sectionLabel('카테고리')}
                {!showAddCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={expenseCategoryId}
                      onChange={e => setExpenseCategoryId(e.target.value)}
                      style={{ ...selectStyle, flex: 1 }}
                      className="focus:border-[var(--primary)]"
                    >
                      <option value="">선택하세요</option>
                      {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: 'rgba(123,111,224,0.1)', border: '1px solid rgba(123,111,224,0.25)', color: 'var(--primary-light)' }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder={`새 ${expenseType === 'office' ? '사무실' : '개인'} 카테고리`}
                      style={{ ...inputStyle, flex: 1, borderColor: 'var(--primary)' }}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    />
                    <button type="button" onClick={handleAddCategory} className="px-3 py-2 rounded-xl text-[12px] font-semibold" style={{ background: 'var(--primary)', color: 'white' }}>추가</button>
                    <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName('') }} className="px-3 py-2 rounded-xl text-[12px] font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>취소</button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFixed(!isFixed)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all"
                style={{
                  background: isFixed ? 'rgba(148,163,184,0.08)' : 'var(--bg-base)',
                  border: `1px solid ${isFixed ? 'rgba(148,163,184,0.25)' : 'var(--border)'}`,
                  color: isFixed ? '#94a3b8' : 'var(--text-muted)',
                }}
              >
                {isFixed ? <Lock size={14} /> : <Unlock size={14} />}
                <span>{isFixed ? '고정비 (매달 반복 지출)' : '변동비 (비정기 지출)'}</span>
                <span className="ml-auto text-[11px] opacity-50">
                  {isFixed ? '→ 변동비로 전환' : '→ 고정비로 전환'}
                </span>
              </button>
            </>
          )}

          {/* 메모 */}
          <div>
            {sectionLabel('메모')}
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="추가 메모 (선택)"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              className="focus:border-[var(--primary)]"
            />
          </div>

          {error && (
            <p
              className="text-[12px] px-3 py-2 rounded-lg"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}
            >
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn('flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-all', loading && 'opacity-60 cursor-not-allowed')}
              style={{
                background: type === 'income'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #7b6fe0, #5b4fd4)',
                boxShadow: type === 'income'
                  ? '0 4px 15px rgba(16,185,129,0.25)'
                  : '0 4px 15px rgba(123,111,224,0.25)',
              }}
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
