/* 서버 전용 PostgREST 헬퍼
   모든 한글 데이터는 JSON body에만 담기므로 ByteString 에러 없음 */

export const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function authHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

/* SELECT */
export async function pgGet<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${query}`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T[]>
}

/* INSERT → return representation */
export async function pgInsert<T>(
  table: string,
  select: string,
  body: Record<string, unknown>
): Promise<T[]> {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?select=${select}`, {
    method: 'POST',
    headers: authHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? json?.hint ?? `HTTP ${res.status}`)
  return json as T[]
}

/* DELETE */
export async function pgDelete(table: string, id: string): Promise<void> {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: authHeaders({ Prefer: 'return=minimal' }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as Record<string, string>
    throw new Error(json?.message ?? `HTTP ${res.status}`)
  }
}
