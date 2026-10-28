import { db, type Recurring } from './db'
import { addMonths, dateInMonth, monthOf, todayISO } from './format'

const firstPendingMonth = (r: Recurring) => (r.lastMonth ? addMonths(r.lastMonth, 1) : r.startMonth)

/** Prochaine date à laquelle la dépense sera créée. */
export const nextOccurrence = (r: Recurring) => dateInMonth(firstPendingMonth(r), r.day)

/**
 * Crée les dépenses récurrentes arrivées à échéance depuis la dernière ouverture de l'appli.
 * Rattrape plusieurs mois si l'appli n'a pas été ouverte depuis longtemps.
 */
export async function runRecurring() {
  const today = todayISO()
  const currentMonth = monthOf(today)

  await db.transaction('rw', db.recurrings, db.expenses, async () => {
    const recurrings = await db.recurrings.filter((r) => r.active).toArray()
    for (const r of recurrings) {
      let month = firstPendingMonth(r)
      let last = r.lastMonth
      while (month <= currentMonth) {
        const date = dateInMonth(month, r.day)
        if (date > today) break
        await db.expenses.add({
          amount: r.amount,
          date,
          categoryId: r.categoryId,
          label: r.label,
          recurringId: r.id,
          createdAt: Date.now(),
        })
        last = month
        month = addMonths(month, 1)
      }
      if (last !== r.lastMonth) await db.recurrings.update(r.id!, { lastMonth: last })
    }
  })
}
