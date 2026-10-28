import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { addMonths, monthName, monthOf, monthYear, todayISO } from '../lib/format'

interface Props {
  month: string
  onMonth: (month: string) => void
  kicker?: string
}

export function MonthHeader({ month, onMonth, kicker }: Props) {
  const current = monthOf(todayISO())
  return (
    <header className="month-header">
      <button className="month-title" onClick={() => onMonth(current)} title="Revenir au mois en cours">
        {kicker && <span className="kicker">{kicker}</span>}
        <span className="display">
          {monthName(month)} <span className="year">{monthYear(month)}</span>
        </span>
      </button>
      <div className="month-arrows">
        <button className="icon-btn" onClick={() => onMonth(addMonths(month, -1))} aria-label="Mois précédent">
          <IconChevronLeft size={20} />
        </button>
        <button className="icon-btn" onClick={() => onMonth(addMonths(month, 1))} aria-label="Mois suivant" disabled={month >= current}>
          <IconChevronRight size={20} />
        </button>
      </div>
    </header>
  )
}
