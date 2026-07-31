import { NextRequest, NextResponse } from 'next/server'
import { pgGet, pgInsert, pgDelete, pgPatch } from '../_supabase'

/* installment_months 없이도 동작하는 기본 SELECT */
const TX_SELECT_BASE = [
  'id', 'transaction_type', 'amount', 'transaction_date',
  'description', 'memo', 'expense_type', 'is_fixed', 'payment_method',
  'income_source_id', 'expense_category_id',
  'income_sources(id,name)',
  'expense_categories(id,name,type)',
].join(',')

/* installment_months 컬럼이 존재할 때 사용 */
const TX_SELECT_FULL = TX_SELECT_BASE.replace(
  'income_source_id',
  'installment_months,income_source_id'
)

/* 스키마 에러 판별 */
const isSchemaError = (e: unknown) =>
  String(e).toLowerCase().includes('installment_months') ||
  String(e).toLowerCase().includes('schema cache')

/* payload 에서 installment_months 제거 */
const stripInstallment = (payload: Record<string, unknown>) => {
  const { installment_months: _, ...rest } = payload
  return rest
}

/* 거래 목록 조회 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const year  = searchParams.get('year')
  const month = searchParams.get('month')

  if (year && month) {
    const y = parseInt(year), m = parseInt(month)
    const start   = `${y}-${String(m).padStart(2,'0')}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const end     = `${y}-${String(m).padStart(2,'0')}-${lastDay}`

    /* full select 먼저 시도 → 실패 시 base select */
    try {
      const q = `select=${TX_SELECT_FULL}&transaction_date=gte.${start}&transaction_date=lte.${end}&order=transaction_date.desc`
      const rows = await pgGet<Record<string, unknown>>('transactions', q)
      return NextResponse.json({ data: rows })
    } catch (e) {
      if (isSchemaError(e)) {
        const q = `select=${TX_SELECT_BASE}&transaction_date=gte.${start}&transaction_date=lte.${end}&order=transaction_date.desc`
        const rows = await pgGet<Record<string, unknown>>('transactions', q)
        return NextResponse.json({ data: rows })
      }
      return NextResponse.json({ error: e instanceof Error ? e.message : '조회 실패' }, { status: 500 })
    }
  }

  /* 날짜 범위 조회 (통계 및 카드 결제 예상액 용) */
  const s = searchParams.get('start')
  const e = searchParams.get('end')
  if (s && e) {
    const detail = searchParams.get('detail') === '1'
    const detailSel = 'transaction_type,amount,expense_type,is_fixed,payment_method,transaction_date,installment_months'
    const baseSel   = 'transaction_type,amount,expense_type,is_fixed'

    if (detail) {
      try {
        const q = `select=${detailSel}&transaction_date=gte.${s}&transaction_date=lte.${e}`
        const rows = await pgGet<Record<string, unknown>>('transactions', q)
        return NextResponse.json({ data: rows })
      } catch (e2) {
        if (isSchemaError(e2)) {
          /* 컬럼 없으면 installment_months 없이 조회 */
          const fallbackSel = 'transaction_type,amount,expense_type,is_fixed,payment_method,transaction_date'
          const q = `select=${fallbackSel}&transaction_date=gte.${s}&transaction_date=lte.${e}`
          const rows = await pgGet<Record<string, unknown>>('transactions', q)
          return NextResponse.json({ data: rows })
        }
        return NextResponse.json({ error: e2 instanceof Error ? e2.message : '조회 실패' }, { status: 500 })
      }
    }

    try {
      const q = `select=${baseSel}&transaction_date=gte.${s}&transaction_date=lte.${e}`
      const rows = await pgGet<Record<string, unknown>>('transactions', q)
      return NextResponse.json({ data: rows })
    } catch (e3) {
      return NextResponse.json({ error: e3 instanceof Error ? e3.message : '조회 실패' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'year/month 파라미터 필요' }, { status: 400 })
}

/* 거래 추가 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, unknown>

    /* full insert 시도 */
    try {
      const rows = await pgInsert<Record<string, unknown>>('transactions', TX_SELECT_FULL, payload)
      if (!rows[0]) return NextResponse.json({ error: '거래 저장 실패' }, { status: 400 })
      return NextResponse.json({ data: rows[0] })
    } catch (e) {
      if (isSchemaError(e)) {
        /* installment_months 컬럼 없는 경우 제거 후 재시도 */
        const rows = await pgInsert<Record<string, unknown>>('transactions', TX_SELECT_BASE, stripInstallment(payload))
        if (!rows[0]) return NextResponse.json({ error: '거래 저장 실패' }, { status: 400 })
        return NextResponse.json({ data: rows[0] })
      }
      throw e
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, { status: 500 })
  }
}

/* 거래 수정 */
export async function PATCH(req: NextRequest) {
  try {
    const payload = await req.json() as { id: string } & Record<string, unknown>
    const { id, ...rest } = payload
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    try {
      const rows = await pgPatch<Record<string, unknown>>('transactions', id, TX_SELECT_FULL, rest)
      if (!rows[0]) return NextResponse.json({ error: '거래 수정 실패' }, { status: 400 })
      return NextResponse.json({ data: rows[0] })
    } catch (e) {
      if (isSchemaError(e)) {
        const rows = await pgPatch<Record<string, unknown>>('transactions', id, TX_SELECT_BASE, stripInstallment(rest))
        if (!rows[0]) return NextResponse.json({ error: '거래 수정 실패' }, { status: 400 })
        return NextResponse.json({ data: rows[0] })
      }
      throw e
    }
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
