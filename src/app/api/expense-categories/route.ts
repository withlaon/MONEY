import { NextRequest, NextResponse } from 'next/server'
import { pgInsert } from '../_supabase'

export async function POST(req: NextRequest) {
  try {
    const { name, type, description } = await req.json() as {
      name: string; type: 'office' | 'personal'; description: string | null
    }
    const rows = await pgInsert<{
      id: string; name: string; type: 'office' | 'personal'; description: string | null; is_active: boolean
    }>(
      'expense_categories', 'id,name,type,description,is_active', { name, type, description }
    )
    if (!rows[0]) return NextResponse.json({ error: '카테고리 저장 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}
