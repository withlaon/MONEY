'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* ── 입금처 추가 ── */
export async function serverAddIncomeSource(name: string, description: string | null) {
  const { data, error } = await supabase
    .from('income_sources')
    .insert({ name, description })
    .select('id, name, description, is_active')
    .single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('입금처 저장 실패')
  return data as { id: string; name: string; description: string | null; is_active: boolean }
}

/* ── 카테고리 추가 ── */
export async function serverAddExpenseCategory(
  name: string,
  type: 'office' | 'personal',
  description: string | null
) {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert({ name, type, description })
    .select('id, name, type, description, is_active')
    .single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('카테고리 저장 실패')
  return data as { id: string; name: string; type: 'office' | 'personal'; description: string | null; is_active: boolean }
}

/* ── 거래 추가 ── */
export async function serverAddTransaction(payload: {
  transaction_type: 'income' | 'expense'
  amount: number
  transaction_date: string
  description: string | null
  memo: string | null
  income_source_id: string | null
  expense_category_id: string | null
  expense_type: 'office' | 'personal' | null
  is_fixed: boolean
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select(`
      id, transaction_type, amount, transaction_date,
      description, memo, expense_type, is_fixed,
      income_source_id, expense_category_id,
      income_sources(id, name),
      expense_categories(id, name, type)
    `)
    .single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('거래 저장 실패')
  return data
}

/* ── 거래 삭제 ── */
export async function serverDeleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
