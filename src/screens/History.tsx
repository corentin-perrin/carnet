import { useState, type CSSProperties } from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import type { Expense } from '../lib/db'
import { dayLabel, money } from '../lib/format'
import { byNewest, sumAmounts, useCategories, useMonthExpenses } from '../lib/hooks'
import { ExpenseRow } from '../components/ExpenseRow'
import { MonthHeader } from '../components/MonthHeader'

interface Props {
  month: string
  onMonth: (month: string) => void
  onEdit: (expense: Expense) => void
}

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function History({ month, onMonth, onEdit }: Props) {
  const expenses = useMonthExpenses(month) ?? []
  const categories = useCategories()
  const categoryMap = new Map(categories.map((c) => [c.id!, c]))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<number | null>(null)

  const q = normalize(query.trim())
  const filtered = expenses
    .filter((e) => filter === null || e.categoryId === filter)
    .filter((e) => !q || normalize(`${e.label} ${e.note ?? ''}`).includes(q))
    .sort(byNewest)

  const days: { date: string; items: Expense[] }[] = []
  for (const e of filtered) {
    const last = days[days.length - 1]
    if (last?.date === e.date) last.items.push(e)
    else days.push({ date: e.date, items: [e] })
  }

  const usedCategories = categories.filter((c) => expenses.some((e) => e.categoryId === c.id))

  return (
    <>
      <MonthHeader month={month} onMonth={onMonth} kicker="Historique" />

      <label className="search">
        <IconSearch size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" type="search" />
        {query && (
          <button className="icon-btn" onClick={() => setQuery('')} aria-label="Effacer">
            <IconX size={16} />
          </button>
        )}
      </label>

      {usedCategories.length > 1 && (
        <div className="chips">
          <button className={'chip' + (filter === null ? ' selected' : '')} onClick={() => setFilter(null)}>
            Toutes
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.id}
              className={'chip' + (filter === c.id ? ' selected' : '')}
              style={{ '--c': c.color } as CSSProperties}
              onClick={() => setFilter(filter === c.id ? null : c.id!)}
            >
              <span className="dot" />
              {c.name}
            </button>
          ))}
        </div>
      )}

      {(q || filter !== null) && filtered.length > 0 && (
        <p className="muted filter-total">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} · {money(sumAmounts(filtered))}
        </p>
      )}

      {days.length === 0 ? (
        <p className="muted center empty-inline">{expenses.length ? 'Aucun résultat.' : 'Aucune dépense ce mois-là.'}</p>
      ) : (
        days.map((day) => (
          <section key={day.date} className="day">
            <div className="day-head">
              <h2>{dayLabel(day.date)}</h2>
              <span>{money(sumAmounts(day.items))}</span>
            </div>
            <div className="card list">
              {day.items.map((e) => (
                <ExpenseRow key={e.id} expense={e} category={categoryMap.get(e.categoryId)} onClick={() => onEdit(e)} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}
