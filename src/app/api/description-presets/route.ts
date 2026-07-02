import { NextRequest, NextResponse } from 'next/server'
import { pgGet, pgInsert } from '../_supabase'

export async function GET() {
  try {
    const rows = await pgGet<{ id: string; name: string }>(
      'description_presets',
      'select=id,name&order=created_at.asc'
    )
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json() as { name: string }
    const rows = await pgInsert<{ id: string; name: string }>(
      'description_presets', 'id,name', { name }
    )
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '오류' }, { status: 500 })
  }
}
