// Supabase JS 클라이언트는 ByteString 헤더 오류로 인해 사용하지 않습니다.
// 모든 DB 통신은 src/lib/pgFetch.ts (직접 fetch) 또는 src/app/api/ (API Routes)를 사용합니다.

// 타입 정의
export interface IncomeSource {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExpenseCategory {
  id: string
  name: string
  type: 'office' | 'personal'
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  transaction_type: 'income' | 'expense'
  amount: number
  transaction_date: string
  description: string | null
  memo: string | null
  payment_method: string | null
  income_source_id: string | null
  expense_category_id: string | null
  expense_type: 'office' | 'personal' | null
  is_fixed: boolean
  created_at: string
  updated_at: string
  income_sources?: IncomeSource
  expense_categories?: ExpenseCategory
}

export interface MonthlyBudget {
  id: string
  year: number
  month: number
  income_target: number
  office_expense_budget: number
  personal_expense_budget: number
  memo: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyStats {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  officeExpense: number
  personalExpense: number
  balance: number
  fixedExpense: number
  variableExpense: number
}
