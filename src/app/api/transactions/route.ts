import { NextRequest, NextResponse } from 'next/server'
import { pgGet, pgInsert, pgDelete } from '../_supabase'

const TX_SELECT = [
  'id', 'transaction_type', 'amount', 'transaction_date',
  'description', 'memo', 'expense_type', 'is_fixed', 'payment_method',
  'income_source_id', 'expense_category_id',
  'income_sources(id,name)',
  'expense_categories(id,name,type)',
].join(',')

/* 거래 목록 조회 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const year  = searchParams.get('year')
    const month = searchParams.get('month')

    if (year && month) {
      const y = parseInt(year), m = parseInt(month)
      const start = `${y}-${String(m).padStart(2,'0')}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const end   = `${y}-${String(m).padStart(2,'0')}-${lastDay}`
      const q = `select=${TX_SELECT}&transaction_date=gte.${start}&transaction_date=lte.${end}&order=transaction_date.desc`
      const rows = await pgGet<Record<string, unknown>>('transactions', q)
      return NextResponse.json({ data: rows })
    }

    /* 월간 통계용 (type,amount,expense_type,is_fixed만) */
    const s = searchParams.get('start')
    const e = searchParams.get('end')
    if (s && e) {
      const q = `select=transaction_type,amount,expense_type,is_fixed&transaction_date=gte.${s}&transaction_date=lte.${e}`
      const rows = await pgGet<Record<string, unknown>>('transactions', q)
      return NextResponse.json({ data: rows })
    }

    return NextResponse.json({ error: 'year/month 파라미터 필요' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

/* 거래 추가 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, unknown>
    const rows = await pgInsert<Record<string, unknown>>(
      'transactions', TX_SELECT, payload
    )
    if (!rows[0]) return NextResponse.json({ error: '거래 저장 실패' }, { status: 400 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

/* 거래 삭제 */
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
