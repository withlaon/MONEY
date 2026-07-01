'use server'

import { createClient } from '@supabase/supabase-js'

/* 서버용 Supabase 클라이언트 (localStorage 접근 없음) */
function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase 환경변수 누락')
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string }

/* ── 입금처 추가 ── */
export async function serverAddIncomeSource(
  name: string,
  description: string | null
): Promise<ActionResult<{ id: string; name: string; description: string | null; is_active: boolean }>> {
  try {
    const sb = makeClient()
    const { data: rows, error } = await sb
      .from('income_sources')
      .insert({ name, description })
      .select('id, name, description, is_active')

    if (error) return { data: null, error: error.message }
    if (!rows || rows.length === 0) return { data: null, error: '입금처 저장 실패' }
    return { data: rows[0] as { id: string; name: string; description: string | null; is_active: boolean }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '알 수 없는 오류' }
  }
}

/* ── 카테고리 추가 ── */
export async function serverAddExpenseCategory(
  name: string,
  type: 'office' | 'personal',
  description: string | null
): Promise<ActionResult<{ id: string; name: string; type: 'office' | 'personal'; description: string | null; is_active: boolean }>> {
  try {
    const sb = makeClient()
    const { data: rows, error } = await sb
      .from('expense_categories')
      .insert({ name, type, description })
      .select('id, name, type, description, is_active')

    if (error) return { data: null, error: error.message }
    if (!rows || rows.length === 0) return { data: null, error: '카테고리 저장 실패' }
    return { data: rows[0] as { id: string; name: string; type: 'office' | 'personal'; description: string | null; is_active: boolean }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '알 수 없는 오류' }
  }
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
}): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const sb = makeClient()
    const { data, error } = await sb
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

    if (error) return { data: null, error: error.message }
    if (!data) return { data: null, error: '거래 저장 실패' }
    return { data: data as Record<string, unknown>, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '알 수 없는 오류' }
  }
}

/* ── 거래 삭제 ── */
export async function serverDeleteTransaction(id: string): Promise<ActionResult<true>> {
  try {
    const sb = makeClient()
    const { error } = await sb.from('transactions').delete().eq('id', id)
    if (error) return { data: null, error: error.message }
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '알 수 없는 오류' }
  }
}
