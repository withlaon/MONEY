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

  const officeCategories = categories.filter(c => c.type === 'office')
  const personalCategories = categories.filter(c => c.type === 'personal')
  const currentCategories = expenseType === 'office' ? officeCategories : personalCategories

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setError('금액을 올바르게 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        transaction_type: type,
        amount: Number(amount.replace(/,/g, '')),
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
      setIncomeSourceId(src.id)
      setNewSourceName('')
      setShowAddSource(false)
    } catch {
      setError('입금처 추가에 실패했습니다.')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const cat = await addCategory(newCategoryName.trim(), expenseType)
      setExpenseCategoryId(cat.id)
      setNewCategoryName('')
      setShowAddCategory(false)
    } catch {
      setError('카테고리 추가에 실패했습니다.')
    }
  }

  const formatAmountInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    return num ? Number(num).toLocaleString('ko-KR') : ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#13151f] border border-[#252836] rounded-2xl w-full max-w-md shadow-2xl fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2130]">
          <h2 className="text-white font-semibold text-lg">거래 추가</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a1d27] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 수입/지출 타입 선택 */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a1d27] rounded-xl">
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-[#6b7280] hover:text-white'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              수입
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                type === 'expense'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-[#6b7280] hover:text-white'
              )}
            >
              <TrendingDown className="w-4 h-4" />
              지출
            </button>
          </div>

          {/* 금액 */}
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">금액 *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-sm">₩</span>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(formatAmountInput(e.target.value))}
                placeholder="0"
                className="w-full bg-[#1a1d27] border border-[#252836] rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:border-[#6c63ff] transition-colors number-input"
                required
              />
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">날짜 *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#1a1d27] border border-[#252836] rounded-xl px-4 py-3 text-white text-sm focus:border-[#6c63ff] transition-colors [color-scheme:dark]"
              required
            />
          </div>

          {/* 내역 설명 */}
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">내역</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 스마트스토어 3월 정산"
              className="w-full bg-[#1a1d27] border border-[#252836] rounded-xl px-4 py-3 text-white text-sm focus:border-[#6c63ff] transition-colors"
            />
          </div>

          {/* 수입일 때: 입금처 */}
          {type === 'income' && (
            <div>
              <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">입금처</label>
              {!showAddSource ? (
                <div className="flex gap-2">
                  <select
                    value={incomeSourceId}
                    onChange={e => setIncomeSourceId(e.target.value)}
                    className="flex-1 bg-[#1a1d27] border border-[#252836] rounded-xl px-4 py-3 text-white text-sm focus:border-[#6c63ff] transition-colors"
                  >
                    <option value="">선택하세요</option>
                    {sources.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddSource(true)}
                    className="w-11 h-11 rounded-xl bg-[#6c63ff20] border border-[#6c63ff30] flex items-center justify-center text-[#6c63ff] hover:bg-[#6c63ff30] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={e => setNewSourceName(e.target.value)}
                    placeholder="새 입금처 이름"
                    className="flex-1 bg-[#1a1d27] border border-[#6c63ff50] rounded-xl px-4 py-3 text-white text-sm focus:border-[#6c63ff]"
                    autoFocus
                  />
                  <button type="button" onClick={handleAddSource} className="px-4 py-2 rounded-xl bg-[#6c63ff] text-white text-sm hover:bg-[#5b52ee] transition-colors">추가</button>
                  <button type="button" onClick={() => setShowAddSource(false)} className="px-3 py-2 rounded-xl bg-[#1a1d27] border border-[#252836] text-[#6b7280] text-sm">취소</button>
                </div>
              )}
            </div>
          )}

          {/* 지출일 때: 사무실/개인 구분 + 카테고리 + 고정비 */}
          {type === 'expense' && (
            <>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">지출 구분</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setExpenseType('office'); setExpenseCategoryId('') }}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all',
                      expenseType === 'office'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-[#1a1d27] text-[#6b7280] border-[#252836] hover:text-white'
                    )}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    사무실
                  </button>
                  <button
                    type="button"
                    onClick={() => { setExpenseType('personal'); setExpenseCategoryId('') }}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all',
                      expenseType === 'personal'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-[#1a1d27] text-[#6b7280] border-[#252836] hover:text-white'
                    )}
                  >
                    <User className="w-3.5 h-3.5" />
                    개인
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">카테고리</label>
                {!showAddCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={expenseCategoryId}
                      onChange={e => setExpenseCategoryId(e.target.value)}
                      className="flex-1 bg-[#1a1d27] border border-[#252836] rounded-xl px-4 py-3 text-white text-sm focus:border-[#6c63ff] transition-colors"
                    >
                      <option value="">선택하세요</option>
                      {currentCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="w-11 h-11 rounded-xl bg-[#6c63ff20] border border-[#6c63ff30] flex items-center justify-center text-[#6c63ff] hover:bg-[#6c63ff30] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder={`새 ${expenseType === 'office' ? '사무실' : '개인'} 카테고리`}
                      className="flex-1 bg-[#1a1d27] border border-[#6c63ff50] rounded-xl px-4 py-3 text-white text-sm"
                      autoFocus
                    />
                    <button type="button" onClick={handleAddCategory} className="px-4 py-2 rounded-xl bg-[#6c63ff] text-white text-sm hover:bg-[#5b52ee] transition-colors">추가</button>
                    <button type="button" onClick={() => setShowAddCategory(false)} className="px-3 py-2 rounded-xl bg-[#1a1d27] border border-[#252836] text-[#6b7280] text-sm">취소</button>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsFixed(!isFixed)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                    isFixed
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      : 'bg-[#1a1d27] text-[#6b7280] border-[#252836] hover:text-white'
                  )}
                >
                  {isFixed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {isFixed ? '고정비 (매달 반복)' : '변동비 (비정기)'}
                  <span className="ml-auto text-xs opacity-60">{isFixed ? '클릭하여 변동비로' : '클릭하여 고정비로'}</span>
                </button>
              </div>
            </>
          )}

          {/* 메모 */}
          <div>
            <label className="block text-xs text-[#6b7280] mb-1.5 font-medium">메모</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="추가 메모..."
              rows={2}
              className="w-full bg-[#1a1d27] border border-[#252836] rounded-xl px-4 py-3 text-white text-sm focus:border-[#6c63ff] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#1a1d27] border border-[#252836] text-[#6b7280] text-sm font-medium hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex-1 py-3 rounded-xl text-white text-sm font-medium transition-all',
                type === 'income'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-[#6c63ff] hover:bg-[#5b52ee]',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
