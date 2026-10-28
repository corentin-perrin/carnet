import type { CSSProperties } from 'react'
import { IconRepeat } from '@tabler/icons-react'
import type { Category, Expense } from '../lib/db'
import { money, shortDate } from '../lib/format'
import { CatIcon } from '../lib/icons'

interface Props {
  expense: Expense
  category?: Category
  showDate?: boolean
  onClick: () => void
}

export function ExpenseRow({ expense, category, showDate, onClick }: Props) {
  const sub = [category?.name ?? 'Sans catégorie', showDate ? shortDate(expense.date) : expense.note].filter(Boolean).join(' · ')
  return (
    <button className="expense-row" onClick={onClick}>
      <span className="cat-tile" style={{ '--c': category?.color ?? '#8F7E6E' } as CSSProperties}>
        <CatIcon name={category?.icon ?? 'dots'} />
      </span>
      <span className="expense-main">
        <span className="expense-label">
          {expense.label}
          {expense.recurringId && <IconRepeat size={14} className="recurring-mark" aria-label="Récurrente" />}
        </span>
        <span className="expense-sub">{sub}</span>
      </span>
      <span className="expense-amount">−{money(expense.amount)}</span>
    </button>
  )
}
