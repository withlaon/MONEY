import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getMonthName(month: number): string {
  return `${month}월`
}

export function getYearMonth(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function getCurrentYearMonth(): { year: number; month: number } {
  return getYearMonth(new Date())
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function getPreviousMonths(year: number, month: number, count: number): { year: number; month: number }[] {
  const result = []
  let currentYear = year
  let currentMonth = month
  for (let i = 0; i < count; i++) {
    result.unshift({ year: currentYear, month: currentMonth })
    currentMonth--
    if (currentMonth === 0) {
      currentMonth = 12
      currentYear--
    }
  }
  return result
}
