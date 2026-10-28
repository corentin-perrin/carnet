import type { CSSProperties } from 'react'
import { IconArrowDownRight, IconArrowUpRight, IconPlus } from '@tabler/icons-react'
import type { Expense } from '../lib/db'
import { addMonths, daysInMonth, money, monthName, monthOf, todayISO } from '../lib/format'
import { byNewest, sumAmounts, totalsByCategory, useCategoryMap, useMonthExpenses } from '../lib/hooks'
import { CatIcon } from '../lib/icons'
import { ExpenseRow } from '../components/ExpenseRow'
import { MonthHeader } from '../components/MonthHeader'

interface Props {
  month: string
  onMonth: (month: string) => void
  onEdit: (expense?: Expense) => void
  onSeeAll: () => void
}

export function Home({ month, onMonth, onEdit, onSeeAll }: Props) {
  const expenses = useMonthExpenses(month)
  const prevMonth = addMonths(month, -1)
  const previous = useMonthExpenses(prevMonth) ?? []
  const categories = useCategoryMap()

  if (!expenses) return null

  const today = todayISO()
  const isCurrent = month === monthOf(today)
  const total = sumAmounts(expenses)

  // Pour le mois en cours, on compare à la même période du mois précédent (du 1er au même jour).
  const cutoffDay = isCurrent ? today.slice(8, 10) : '31'
  const prevTotal = sumAmounts(previous.filter((e) => e.date.slice(8, 10) <= cutoffDay))
  const delta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null

  const elapsedDays = isCurrent ? Number(today.slice(8, 10)) : daysInMonth(month)
  const perDay = total / elapsedDays

  const byCategory = totalsByCategory(expenses).slice(0, 4)
  const maxCat = byCategory[0]?.total ?? 1
  const recent = [...expenses].sort(byNewest).slice(0, 6)

  return (
    <>
      <MonthHeader month={month} onMonth={onMonth} kicker="Carnet" />

      <section className="hero">
        <span className="hero-kicker">Dépensé en {monthName(month).toLowerCase()}</span>
        <span className="hero-amount">{money(total)}</span>
        <div className="hero-meta">
          {delta !== null && (
            <span className={'pill ' + (delta <= 0 ? 'pill-good' : 'pill-warn')}>
              {delta <= 0 ? <IconArrowDownRight size={14} /> : <IconArrowUpRight size={14} />}
              {Math.abs(delta)} % vs {monthName(prevMonth).toLowerCase()}
              {isCurrent && ' à date'}
            </span>
          )}
          <span>
            {expenses.length} dépense{expenses.length > 1 ? 's' : ''} · {money(Math.round(perDay))}/jour
          </span>
        </div>
      </section>

      {expenses.length === 0 ? (
        <section className="empty">
          <h2>{isCurrent ? 'Ton carnet est vierge ce mois-ci' : 'Aucune dépense ce mois-là'}</h2>
          <p>Ajoute une dépense en deux secondes avec le bouton +.</p>
          <button className="btn btn-primary" onClick={() => onEdit()}>
            <IconPlus size={18} /> Ajouter une dépense
          </button>
        </section>
      ) : (
        <>
          <section className="section">
            <h2 className="section-title">Par catégorie</h2>
            <div className="cat-cards">
              {byCategory.map(({ categoryId, total }) => {
                const c = categories.get(categoryId)
                return (
                  <div key={categoryId} className="cat-card" style={{ '--c': c?.color ?? '#8F7E6E' } as CSSProperties}>
                    <span className="cat-tile">
                      <CatIcon name={c?.icon ?? 'dots'} />
                    </span>
                    <span className="cat-card-name">{c?.name ?? 'Sans catégorie'}</span>
                    <span className="cat-card-amount">{money(total)}</span>
                    <span className="meter">
                      <span style={{ width: `${(total / maxCat) * 100}%` }} />
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Récentes</h2>
              <button className="link-btn" onClick={onSeeAll}>
                Tout voir
              </button>
            </div>
            <div className="card list">
              {recent.map((e) => (
                <ExpenseRow key={e.id} expense={e} category={categories.get(e.categoryId)} showDate onClick={() => onEdit(e)} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
