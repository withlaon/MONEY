'use server'

/* ── PostgREST 직접 호출 (Supabase 클라이언트 미사용)
   한글 등 비ASCII 문자가 헤더에 들어가는 ByteString 오류를 근본적으로 차단 ── */

function base() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
}

function authHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

/* 공통 INSERT 헬퍼 — 한글 데이터는 오직 JSON body에만 포함 */
async function pgInsert<T>(
  table: string,
  select: string,
  body: Record<string, unknown>
): Promise<T[]> {
  const res = await fetch(`${base()}/${table}?select=${select}`, {
    method: 'POST',
    headers: { ...authHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}) as Record<string, string>)
    throw new Error(
      (err as Record<string, string>).message ||
      (err as Record<string, string>).hint ||
      `HTTP ${res.status}`
    )
  }
  return res.json() as Promise<T[]>
}

/* 공통 DELETE 헬퍼 */
async function pgDelete(table: string, id: string): Promise<void> {
  const res = await fetch(`${base()}/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders(), Prefer: 'return=minimal' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}) as Record<string, string>)
    throw new Error(
      (err as Record<string, string>).message || `HTTP ${res.status}`
    )
  }
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string }

/* ── 입금처 추가 ── */
export async function serverAddIncomeSource(
  name: string,
  description: string | null
): Promise<ActionResult<{ id: string; name: string; description: string | null; is_active: boolean }>> {
  try {
    const rows = await pgInsert<{ id: string; name: string; description: string | null; is_active: boolean }>(
      'income_sources',
      'id,name,description,is_active',
      { name, description }
    )
    if (!rows[0]) return { data: null, error: '입금처 저장 실패' }
    return { data: rows[0], error: null }
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
    const rows = await pgInsert<{ id: string; name: string; type: 'office' | 'personal'; description: string | null; is_active: boolean }>(
      'expense_categories',
      'id,name,type,description,is_active',
      { name, type, description }
    )
    if (!rows[0]) return { data: null, error: '카테고리 저장 실패' }
    return { data: rows[0], error: null }
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
    const select = [
      'id', 'transaction_type', 'amount', 'transaction_date',
      'description', 'memo', 'expense_type', 'is_fixed',
      'income_source_id', 'expense_category_id',
      'income_sources(id,name)',
      'expense_categories(id,name,type)',
    ].join(',')

    const rows = await pgInsert<Record<string, unknown>>(
      'transactions',
      select,
      payload as unknown as Record<string, unknown>
    )
    if (!rows[0]) return { data: null, error: '거래 저장 실패' }
    return { data: rows[0], error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '알 수 없는 오류' }
  }
}

/* ── 거래 삭제 ── */
export async function serverDeleteTransaction(id: string): Promise<ActionResult<true>> {
  try {
    await pgDelete('transactions', id)
    return { data: true, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '알 수 없는 오류' }
  }
}
