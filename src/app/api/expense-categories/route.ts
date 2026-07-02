import { NextRequest, NextResponse } from 'next/server'
import { pgGet, pgInsert, pgPatch, pgDelete } from '../_supabase'

type ExpCat = { id: string; name: string; type: 'office' | 'personal'; description: string | null; is_active: boolean }

export async function GET() {
  try {
    const rows = await pgGet<ExpCat>('expense_categories', 'select=*&is_active=eq.true&order=type')
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, description } = await req.json() as { name: string; type: 'office' | 'personal'; description: string | null }
    const rows = await pgInsert<ExpCat>('expense_categories', 'id,name,type,description,is_active', { name, type, description })
    if (!rows[0]) return NextResponse.json({ error: '카테고리 저장 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, type, description } = await req.json() as { id: string; name: string; type: 'office' | 'personal'; description?: string | null }
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })
    const rows = await pgPatch<ExpCat>('expense_categories', id, 'id,name,type,description,is_active', { name, type, description: description ?? null })
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
    await pgDelete('expense_categories', id)
    return NextResponse.json({ data: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}
