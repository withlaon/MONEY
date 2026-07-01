'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { pgGet } from '@/lib/pgFetch'
import { Transaction, IncomeSource, ExpenseCategory, MonthlyStats } from '@/lib/supabase'
import { getMonthRange } from '@/lib/utils'

// 인메모리 캐시
const cache = new Map<string, Transaction[]>()

/* ══════════════════════════════
   거래 훅
══════════════════════════════ */
export function useTransactions(year: number, month: number) {
  const key = `${year}-${month}`
  const [transactions, setTransactions] = useState<Transaction[]>(() => cache.get(key) || [])
  const [loading, setLoading] = useState(!cache.has(key))
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchTransactions = useCallback(async () => {
    const cached = cache.get(key)
    if (cached) { setTransactions(cached); setLoading(false) }
    else setLoading(true)

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const { start, end } = getMonthRange(year, month)
    const sel = [
      'id', 'transaction_type', 'amount', 'transaction_date',
      'description', 'memo', 'expense_type', 'is_fixed', 'payment_method',
      'income_source_id', 'expense_category_id',
      'income_sources(id,name)',
      'expense_categories(id,name,type)',
    ].join(',')
    const q = `select=${sel}&transaction_date=gte.${start}&transaction_date=lte.${end}&order=transaction_date.desc`

    try {
      const result = await pgGet<Transaction>(
        'transactions', q
      )
      cache.set(key, result)
      setTransactions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패')
    } finally {
      setLoading(false)
    }
  }, [year, month, key])

  useEffect(() => {
    fetchTransactions()
    return () => { abortRef.current?.abort() }
  }, [fetchTransactions])

  /* 거래 추가 — API Route */
  const addTransaction = async (
    t: Omit<Transaction, 'id'|'created_at'|'updated_at'|'income_sources'|'expense_categories'>
  ) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    })
    const result = await res.json() as { data?: Record<string, unknown>; error?: string }
    if (!res.ok || result.error) throw new Error(result.error || '거래 저장 실패')
    const updated = [result.data as unknown as Transaction, ...transactions]
    cache.set(key, updated)
    setTransactions(updated)
    return result.data
  }

  /* 거래 삭제 — API Route */
  const deleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    const result = await res.json() as { error?: string }
    if (!res.ok || result.error) throw new Error(result.error || '거래 삭제 실패')
    const updated = transactions.filter(t => t.id !== id)
    cache.set(key, updated)
    setTransactions(updated)
  }

  const stats: MonthlyStats = {
    year, month,
    totalIncome:     transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0),
    totalExpense:    transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
    officeExpense:   transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'office').reduce((s, t) => s + t.amount, 0),
    personalExpense: transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'personal').reduce((s, t) => s + t.amount, 0),
    balance:
      transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0) -
      transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
    fixedExpense:    transactions.filter(t => t.transaction_type === 'expense' && t.is_fixed).reduce((s, t) => s + t.amount, 0),
    variableExpense: transactions.filter(t => t.transaction_type === 'expense' && !t.is_fixed).reduce((s, t) => s + t.amount, 0),
  }

  return { transactions, loading, error, stats, refetch: fetchTransactions, addTransaction, deleteTransaction }
}

/* ══════════════════════════════
   입금처 훅
══════════════════════════════ */
let srcCache: IncomeSource[] | null = null

export function useIncomeSources() {
  const [sources, setSources] = useState<IncomeSource[]>(srcCache || [])
  const [loading, setLoading] = useState(!srcCache)

  useEffect(() => {
    if (srcCache) { setSources(srcCache); setLoading(false); return }
    pgGet<IncomeSource>(
      'income_sources',
      'select=*&is_active=eq.true&order=name'
    ).then(data => {
      srcCache = data
      setSources([...data])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  /* 입금처 추가 — API Route */
  const addSource = async (name: string, description?: string) => {
    const res = await fetch('/api/income-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: description ?? null }),
    })
    const result = await res.json() as { data?: IncomeSource; error?: string }
    if (!res.ok || result.error) throw new Error(result.error || '입금처 저장 실패')
    const newItem = result.data as IncomeSource
    setSources(prev => {
      const next = [...prev, newItem]
      srcCache = next
      return next
    })
    return newItem
  }

  return { sources, loading, addSource }
}

/* ══════════════════════════════
   카테고리 훅
══════════════════════════════ */
let catCache: ExpenseCategory[] | null = null

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>(catCache || [])
  const [loading, setLoading] = useState(!catCache)

  useEffect(() => {
    if (catCache) { setCategories(catCache); setLoading(false); return }
    pgGet<ExpenseCategory>(
      'expense_categories',
      'select=*&is_active=eq.true&order=type'
    ).then(data => {
      catCache = data
      setCategories([...data])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  /* 카테고리 추가 — API Route */
  const addCategory = async (name: string, type: 'office'|'personal', description?: string) => {
    const res = await fetch('/api/expense-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, description: description ?? null }),
    })
    const result = await res.json() as { data?: ExpenseCategory; error?: string }
    if (!res.ok || result.error) throw new Error(result.error || '카테고리 저장 실패')
    const newItem = result.data as ExpenseCategory
    setCategories(prev => {
      const next = [...prev, newItem]
      catCache = next
      return next
    })
    return newItem
  }

  return { categories, loading, addCategory }
}

/* ══════════════════════════════
   월별 통계 훅 (분석 페이지)
══════════════════════════════ */
const statsCache = new Map<string, MonthlyStats>()

export function useMonthlyStats(months: { year: number; month: number }[]) {
  const [stats, setStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!months.length) return

    const cached = months.map(m => statsCache.get(`${m.year}-${m.month}`)).filter(Boolean) as MonthlyStats[]
    if (cached.length === months.length) { setStats(cached); setLoading(false); return }
    if (cached.length > 0) setStats(cached)

    const missing = months.filter(m => !statsCache.has(`${m.year}-${m.month}`))
    setLoading(true)

    Promise.all(missing.map(async ({ year, month }) => {
      const { start, end } = getMonthRange(year, month)
      const rows = await pgGet<{ transaction_type: string; amount: number; expense_type: string | null; is_fixed: boolean }>(
        'transactions',
        `select=transaction_type,amount,expense_type,is_fixed&transaction_date=gte.${start}&transaction_date=lte.${end}`
      )

      const s: MonthlyStats = {
        year, month,
        totalIncome:     rows.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0),
        totalExpense:    rows.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
        officeExpense:   rows.filter(t => t.transaction_type === 'expense' && t.expense_type === 'office').reduce((s, t) => s + t.amount, 0),
        personalExpense: rows.filter(t => t.transaction_type === 'expense' && t.expense_type === 'personal').reduce((s, t) => s + t.amount, 0),
        balance:
          rows.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0) -
          rows.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
        fixedExpense:    rows.filter(t => t.transaction_type === 'expense' && t.is_fixed).reduce((s, t) => s + t.amount, 0),
        variableExpense: rows.filter(t => t.transaction_type === 'expense' && !t.is_fixed).reduce((s, t) => s + t.amount, 0),
      }
      statsCache.set(`${year}-${month}`, s)
    })).then(() => {
      setStats(months.map(m => statsCache.get(`${m.year}-${m.month}`)!).filter(Boolean))
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(months)])

  return { stats, loading }
}
