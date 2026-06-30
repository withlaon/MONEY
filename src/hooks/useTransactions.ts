'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Transaction, IncomeSource, ExpenseCategory, MonthlyStats } from '@/lib/supabase'
import { getMonthRange } from '@/lib/utils'

export function useTransactions(year: number, month: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { start, end } = getMonthRange(year, month)
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        income_sources(id, name),
        expense_categories(id, name, type)
      `)
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'income_sources' | 'expense_categories'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select(`*, income_sources(id, name), expense_categories(id, name, type)`)
      .single()

    if (error) throw error
    setTransactions(prev => [data, ...prev])
    return data
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`*, income_sources(id, name), expense_categories(id, name, type)`)
      .single()

    if (error) throw error
    setTransactions(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const stats: MonthlyStats = {
    year,
    month,
    totalIncome: transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    officeExpense: transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'office').reduce((sum, t) => sum + t.amount, 0),
    personalExpense: transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'personal').reduce((sum, t) => sum + t.amount, 0),
    balance: transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0) -
             transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    fixedExpense: transactions.filter(t => t.transaction_type === 'expense' && t.is_fixed).reduce((sum, t) => sum + t.amount, 0),
    variableExpense: transactions.filter(t => t.transaction_type === 'expense' && !t.is_fixed).reduce((sum, t) => sum + t.amount, 0),
  }

  return { transactions, loading, error, stats, refetch: fetchTransactions, addTransaction, updateTransaction, deleteTransaction }
}

export function useIncomeSources() {
  const [sources, setSources] = useState<IncomeSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('income_sources')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setSources(data || [])
        setLoading(false)
      })
  }, [])

  const addSource = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('income_sources')
      .insert([{ name, description }])
      .select()
      .single()
    if (error) throw error
    setSources(prev => [...prev, data])
    return data
  }

  return { sources, loading, addSource }
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .then(({ data }) => {
        setCategories(data || [])
        setLoading(false)
      })
  }, [])

  const addCategory = async (name: string, type: 'office' | 'personal', description?: string) => {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name, type, description }])
      .select()
      .single()
    if (error) throw error
    setCategories(prev => [...prev, data])
    return data
  }

  return { categories, loading, addCategory }
}

export function useMonthlyStats(months: { year: number; month: number }[]) {
  const [stats, setStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (months.length === 0) return

    const fetchStats = async () => {
      setLoading(true)
      const allStats: MonthlyStats[] = []

      for (const { year, month } of months) {
        const { start, end } = getMonthRange(year, month)
        const { data } = await supabase
          .from('transactions')
          .select('transaction_type, amount, expense_type, is_fixed')
          .gte('transaction_date', start)
          .lte('transaction_date', end)

        const transactions = data || []
        allStats.push({
          year,
          month,
          totalIncome: transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0),
          totalExpense: transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
          officeExpense: transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'office').reduce((s, t) => s + t.amount, 0),
          personalExpense: transactions.filter(t => t.transaction_type === 'expense' && t.expense_type === 'personal').reduce((s, t) => s + t.amount, 0),
          balance: transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0) -
                   transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0),
          fixedExpense: transactions.filter(t => t.transaction_type === 'expense' && t.is_fixed).reduce((s, t) => s + t.amount, 0),
          variableExpense: transactions.filter(t => t.transaction_type === 'expense' && !t.is_fixed).reduce((s, t) => s + t.amount, 0),
        })
      }

      setStats(allStats)
      setLoading(false)
    }

    fetchStats()
  }, [JSON.stringify(months)])

  return { stats, loading }
}
