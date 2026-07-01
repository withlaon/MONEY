/* 브라우저/서버 공용 PostgREST 직접 fetch 헬퍼
   @supabase/supabase-js 클라이언트를 완전히 대체
   → 헤더에는 ASCII 값만, 한글은 URL 쿼리 파라미터나 JSON body에만 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function baseHeaders(): Record<string, string> {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
  }
}

/* SELECT */
export async function pgGet<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, {
    headers: baseHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T[]>
}

/* INSERT → return representation */
export async function pgPost<T>(
  table: string,
  select: string,
  body: Record<string, unknown>
): Promise<T[]> {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=${select}`, {
    method: 'POST',
    headers: { ...baseHeaders(), 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(err.message ?? err.hint ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T[]>
}

/* DELETE */
export async function pgDel(table: string, id: string): Promise<void> {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...baseHeaders(), Prefer: 'return=minimal' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
}
