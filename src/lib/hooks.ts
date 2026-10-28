import { useLiveQuery } from 'dexie-react-hooks'
import { db, expensesOfMonth, type Category, type Expense } from './db'

const EMPTY: never[] = []

export function useCategories(): Category[] {
  return useLiveQuery(() => db.categories.orderBy('order').toArray()) ?? EMPTY
}

export function useCategoryMap(): Map<number, Category> {
  const categories = useCategories()
  return new Map(categories.map((c) => [c.id!, c]))
}

export function useMonthExpenses(month: string): Expense[] | undefined {
  return useLiveQuery(() => expensesOfMonth(month), [month])
}

export const sumAmounts = (expenses: Expense[]) => expenses.reduce((s, e) => s + e.amount, 0)

export function totalsByCategory(expenses: Expense[]) {
  const totals = new Map<number, number>()
  for (const e of expenses) totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount)
  return [...totals.entries()].map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total)
}

export const byNewest = (a: Expense, b: Expense) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
