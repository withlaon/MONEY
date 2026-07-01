/* 서버 전용 PostgREST 헬퍼
   모든 한글 데이터는 JSON body에만 담기므로 ByteString 에러 없음 */

/* 환경변수에서 ASCII 범위(0x20–0x7E) 외 문자를 제거
   → Vercel에서 키 복사 시 비ASCII 문자가 섞여도 안전 */
function ascii(s: string | undefined): string {
  return (s ?? '').trim().replace(/[^\x20-\x7E]/g, '')
}

export const SUPA_URL = ascii(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPA_KEY = ascii(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export function authHeaders(extra?: Record<string, string>) {
  if (!SUPA_URL || !SUPA_KEY) {
    throw new Error('Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다.')
  }
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
