import { NextRequest, NextResponse } from 'next/server'
import { pgInsert, pgDelete } from '../_supabase'

const SELECT = [
  'id', 'transaction_type', 'amount', 'transaction_date',
  'description', 'memo', 'expense_type', 'is_fixed',
  'payment_method', 'income_source_id', 'expense_category_id',
  'income_sources(id,name)',
  'expense_categories(id,name,type)',
].join(',')

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, unknown>
    const rows = await pgInsert<Record<string, unknown>>(
      'transactions', SELECT, payload
    )
    if (!rows[0]) return NextResponse.json({ error: '거래 저장 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })
    await pgDelete('transactions', id)
    return NextResponse.json({ data: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}
