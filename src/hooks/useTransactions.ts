'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Transaction, IncomeSource, ExpenseCategory, MonthlyStats } from '@/lib/supabase'
import { getMonthRange } from '@/lib/utils'

// 간단한 인메모리 캐시 (같은 달 재방문 시 즉시 표시)
const cache = new Map<string, Transaction[]>()

export function useTransactions(year: number, month: number) {
  const key = `${year}-${month}`
  const [transactions, setTransactions] = useState<Transaction[]>(() => cache.get(key) || [])
  const [loading, setLoading] = useState(!cache.has(key))
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchTransactions = useCallback(async () => {
    // 캐시 히트 → 백그라운드 갱신 (화면은 즉시 보임)
    const cached = cache.get(key)
    if (cached) {
      setTransactions(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    // 이전 요청 취소
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const { start, end } = getMonthRange(year, month)
    const { data, error } = await supabase
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

    if (error) {
      setError(error.message)
    } else {
      const result = data || []
      cache.set(key, result as unknown as Transaction[])
      setTransactions(result as unknown as Transaction[])
    }
    setLoading(false)
  }, [year, month, key])

  useEffect(() => {
    fetchTransactions()
    return () => { abortRef.current?.abort() }
  }, [fetchTransactions])

  const addTransaction = async (t: Omit<Transaction, 'id'|'created_at'|'updated_at'|'income_sources'|'expense_categories'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([t])
      .select(`id, transaction_type, amount, transaction_date, description, memo, expense_type, is_fixed, income_source_id, expense_category_id, income_sources(id,name), expense_categories(id,name,type)`)
      .single()
    if (error) throw error
    const updated = [data as unknown as Transaction, ...transactions]
    cache.set(key, updated)
    setTransactions(updated)
    return data
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
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
    balance: transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0) -
             transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
    fixedExpense:    transactions.filter(t => t.transaction_type === 'expense' && t.is_fixed).reduce((s, t) => s + t.amount, 0),
    variableExpense: transactions.filter(t => t.transaction_type === 'expense' && !t.is_fixed).reduce((s, t) => s + t.amount, 0),
  }

  return { transactions, loading, error, stats, refetch: fetchTransactions, addTransaction, deleteTransaction }
}

/* ── 입금처 (앱 전체 캐시) ── */
let srcCache: IncomeSource[] | null = null

export function useIncomeSources() {
  const [sources, setSources] = useState<IncomeSource[]>(srcCache || [])
  const [loading, setLoading] = useState(!srcCache)

  useEffect(() => {
    if (srcCache) { setSources(srcCache); setLoading(false); return }
    supabase.from('income_sources').select('*').eq('is_active', true).order('name')
      .then(({ data }) => {
        srcCache = data || []
        setSources(srcCache)
        setLoading(false)
      })
  }, [])

  const addSource = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('income_sources')
      .insert([{ name, description: description ?? null }])
      .select('id, name, description, is_active')
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('입금처 데이터를 받지 못했습니다.')
    const newItem = data as IncomeSource
    srcCache = [...(srcCache ?? []), newItem]
    setSources([...srcCache])
    return newItem
  }

  return { sources, loading, addSource }
}

/* ── 카테고리 (앱 전체 캐시) ── */
let catCache: ExpenseCategory[] | null = null

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>(catCache || [])
  const [loading, setLoading] = useState(!catCache)

  useEffect(() => {
    if (catCache) { setCategories(catCache); setLoading(false); return }
    supabase.from('expense_categories').select('*').eq('is_active', true).order('type')
      .then(({ data }) => {
        catCache = data || []
        setCategories(catCache)
        setLoading(false)
      })
  }, [])

  const addCategory = async (name: string, type: 'office'|'personal', description?: string) => {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name, type, description: description ?? null }])
      .select('id, name, type, description, is_active')
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('카테고리 데이터를 받지 못했습니다.')
    const newItem = data as ExpenseCategory
    catCache = [...(catCache ?? []), newItem]
    setCategories([...catCache])
    return newItem
  }

  return { categories, loading, addCategory }
}

/* ── 월별 통계 (분석 페이지용) ── */
const statsCache = new Map<string, MonthlyStats>()

export function useMonthlyStats(months: { year: number; month: number }[]) {
  const [stats, setStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!months.length) return
    const missing = months.filter(m => !statsCache.has(`${m.year}-${m.month}`))

    // 캐시 있는 항목 즉시 표시
    const cached = months.map(m => statsCache.get(`${m.year}-${m.month}`)).filter(Boolean) as MonthlyStats[]
    if (cached.length === months.length) { setStats(cached); setLoading(false); return }
    if (cached.length > 0) setStats(cached)

    const fetchAll = async () => {
      setLoading(true)
      const results: MonthlyStats[] = [...months.map(m => statsCache.get(`${m.year}-${m.month}`) || null).filter(Boolean) as MonthlyStats[]]

      await Promise.all(missing.map(async ({ year, month }) => {
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
          balance: rows.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0) -
                   rows.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
          fixedExpense:    rows.filter(t => t.transaction_type === 'expense' && t.is_fixed).reduce((s, t) => s + t.amount, 0),
          variableExpense: rows.filter(t => t.transaction_type === 'expense' && !t.is_fixed).reduce((s, t) => s + t.amount, 0),
        }
        statsCache.set(`${year}-${month}`, s)
      }))

      setStats(months.map(m => statsCache.get(`${m.year}-${m.month}`)!).filter(Boolean))
      setLoading(false)
    }

    fetchAll()
  }, [JSON.stringify(months)])

  return { stats, loading }
}
