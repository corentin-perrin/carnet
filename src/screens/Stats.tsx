import type { CSSProperties } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { addMonths, money, monthName, monthOf, shortDate } from '../lib/format'
import { sumAmounts, totalsByCategory, useCategoryMap, useMonthExpenses } from '../lib/hooks'
import { CatIcon } from '../lib/icons'
import { Donut, MonthBars } from '../components/Charts'
import { MonthHeader } from '../components/MonthHeader'

const MONTHS_SHOWN = 6

interface Props {
  month: string
  onMonth: (month: string) => void
}

export function Stats({ month, onMonth }: Props) {
  const expenses = useMonthExpenses(month) ?? []
  const categories = useCategoryMap()

  const firstMonth = addMonths(month, -(MONTHS_SHOWN - 1))
  const history = useLiveQuery(async () => {
    const rows = await db.expenses.where('date').between(`${firstMonth}-01`, `${month}-31`, true, true).toArray()
    const totals = new Map<string, number>()
    for (const e of rows) totals.set(monthOf(e.date), (totals.get(monthOf(e.date)) ?? 0) + e.amount)
    return Array.from({ length: MONTHS_SHOWN }, (_, i) => {
      const m = addMonths(firstMonth, i)
      return { month: m, total: totals.get(m) ?? 0 }
    })
  }, [month, firstMonth])

  const total = sumAmounts(expenses)
  const byCategory = totalsByCategory(expenses)
  const biggest = expenses.reduce<(typeof expenses)[number] | undefined>((max, e) => (!max || e.amount > max.amount ? e : max), undefined)

  return (
    <>
      <MonthHeader month={month} onMonth={onMonth} kicker="Statistiques" />

      <section className="card stats-donut">
        <Donut
          total={total}
          label={monthName(month).toLowerCase()}
          slices={byCategory.map((c) => ({ key: c.categoryId, value: c.total, color: categories.get(c.categoryId)?.color ?? '#8F7E6E' }))}
        />
        {byCategory.length === 0 ? (
          <p className="muted center">Pas encore de dépense ce mois-ci.</p>
        ) : (
          <ul className="legend">
            {byCategory.map(({ categoryId, total: catTotal }) => {
              const c = categories.get(categoryId)
              const pct = Math.round((catTotal / total) * 100)
              return (
                <li key={categoryId} style={{ '--c': c?.color ?? '#8F7E6E' } as CSSProperties}>
                  <span className="cat-tile small">
                    <CatIcon name={c?.icon ?? 'dots'} size={16} />
                  </span>
                  <span className="legend-name">{c?.name ?? 'Sans catégorie'}</span>
                  <span className="legend-pct">{pct} %</span>
                  <span className="legend-amount">{money(catTotal)}</span>
                  <span className="meter">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {biggest && (
        <section className="metrics">
          <div className="metric">
            <span className="metric-label">Plus grosse dépense</span>
            <span className="metric-value">{money(biggest.amount)}</span>
            <span className="metric-sub">
              {biggest.label} · {shortDate(biggest.date)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Panier moyen</span>
            <span className="metric-value">{money(Math.round(total / expenses.length))}</span>
            <span className="metric-sub">sur {expenses.length} dépenses</span>
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">{MONTHS_SHOWN} derniers mois</h2>
        <div className="card">{history && <MonthBars bars={history} selected={month} onSelect={onMonth} />}</div>
      </section>
    </>
  )
}
