'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Transaction, IncomeSource, ExpenseCategory, MonthlyStats } from '@/lib/supabase'
import { getMonthRange } from '@/lib/utils'
import {
  serverAddIncomeSource,
  serverAddExpenseCategory,
  serverAddTransaction,
  serverDeleteTransaction,
} from '@/app/actions'

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
    const { data, error: err } = await supabase
      .from('transactions')
      .select(`
        id, transaction_type, amount, transaction_date,
        description, memo, expense_type, is_fixed,
        income_source_id, expense_category_id,
        income_sources(id, name),
        expense_categories(id, name, type)
      `)
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: false })

    if (err) { setError(err.message) }
    else {
      const result = (data || []) as unknown as Transaction[]
      cache.set(key, result)
      setTransactions(result)
    }
    setLoading(false)
  }, [year, month, key])

  useEffect(() => {
    fetchTransactions()
    return () => { abortRef.current?.abort() }
  }, [fetchTransactions])

  /* 거래 추가 — Server Action (한글 지원) */
  const addTransaction = async (
    t: Omit<Transaction, 'id'|'created_at'|'updated_at'|'income_sources'|'expense_categories'>
  ) => {
    const result = await serverAddTransaction(t)
    if (result.error) throw new Error(result.error)
    const updated = [result.data as unknown as Transaction, ...transactions]
    cache.set(key, updated)
    setTransactions(updated)
    return result.data
  }

  /* 거래 삭제 — Server Action */
  const deleteTransaction = async (id: string) => {
    const result = await serverDeleteTransaction(id)
    if (result.error) throw new Error(result.error)
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
    supabase.from('income_sources').select('*').eq('is_active', true).order('name')
      .then(({ data }) => {
        srcCache = (data || []) as IncomeSource[]
        setSources([...srcCache])
        setLoading(false)
      })
  }, [])

  /* 입금처 추가 — Server Action (한글 지원) */
  const addSource = async (name: string, description?: string) => {
    const result = await serverAddIncomeSource(name, description ?? null)
    if (result.error) throw new Error(result.error)
    const newItem = result.data as IncomeSource
    srcCache = [...(srcCache ?? []), newItem]
    setSources([...srcCache])
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
    supabase.from('expense_categories').select('*').eq('is_active', true).order('type')
      .then(({ data }) => {
        catCache = (data || []) as ExpenseCategory[]
        setCategories([...catCache])
        setLoading(false)
      })
  }, [])

  /* 카테고리 추가 — Server Action (한글 지원) */
  const addCategory = async (name: string, type: 'office'|'personal', description?: string) => {
    const result = await serverAddExpenseCategory(name, type, description ?? null)
    if (result.error) throw new Error(result.error)
    const newItem = result.data as ExpenseCategory
    catCache = [...(catCache ?? []), newItem]
    setCategories([...catCache])
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
      const { data } = await supabase
        .from('transactions')
        .select('transaction_type, amount, expense_type, is_fixed')
        .gte('transaction_date', start)
        .lte('transaction_date', end)

      const rows = data || []
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
