import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  /* 비ASCII 문자 탐지 */
  function findBadChars(s: string) {
    const bad: { index: number; charCode: number }[] = []
    for (let i = 0; i < s.length; i++) {
      if (s.charCodeAt(i) > 127) bad.push({ index: i, charCode: s.charCodeAt(i) })
    }
    return bad
  }

  const urlBad  = findBadChars(url)
  const keyBad  = findBadChars(key)

  return NextResponse.json({
    url_set:    url.length > 0,
    url_ok:     urlBad.length === 0,
    url_len:    url.length,
    url_bad:    urlBad,
    url_preview: url.slice(0, 30) + (url.length > 30 ? '...' : ''),
    key_set:    key.length > 0,
    key_ok:     keyBad.length === 0,
    key_len:    key.length,
    key_bad:    keyBad,
    key_preview: key.slice(0, 10) + '...',
  })
}
