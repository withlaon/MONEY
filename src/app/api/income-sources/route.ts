import { NextRequest, NextResponse } from 'next/server'
import { pgGet, pgInsert } from '../_supabase'

export async function GET() {
  try {
    const rows = await pgGet<{ id: string; name: string; description: string | null; is_active: boolean }>(
      'income_sources', 'select=*&is_active=eq.true&order=name'
    )
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json() as { name: string; description: string | null }
    const rows = await pgInsert<{ id: string; name: string; description: string | null; is_active: boolean }>(
      'income_sources', 'id,name,description,is_active', { name, description }
    )
    if (!rows[0]) return NextResponse.json({ error: '입금처 저장 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}
