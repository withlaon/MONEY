import { NextRequest, NextResponse } from 'next/server'
import { pgGet, pgInsert, pgPatch, pgDelete } from '../_supabase'

type IncSrc = { id: string; name: string; description: string | null; is_active: boolean }

export async function GET() {
  try {
    const rows = await pgGet<IncSrc>('income_sources', 'select=*&is_active=eq.true&order=name')
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json() as { name: string; description: string | null }
    const rows = await pgInsert<IncSrc>('income_sources', 'id,name,description,is_active', { name, description })
    if (!rows[0]) return NextResponse.json({ error: '입금처 저장 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, description } = await req.json() as { id: string; name: string; description?: string | null }
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })
    const rows = await pgPatch<IncSrc>('income_sources', id, 'id,name,description,is_active', { name, description: description ?? null })
    if (!rows[0]) return NextResponse.json({ error: '수정 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })
    await pgDelete('income_sources', id)
    return NextResponse.json({ data: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}
