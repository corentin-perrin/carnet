import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import { describeError, withTimeout } from '../lib/errors'
import { db, type Recurring } from '../lib/db'
import { centsToInput, dateInMonth, monthOf, parseAmount, todayISO } from '../lib/format'
import { useCategories } from '../lib/hooks'
import { nextOccurrence, runRecurring } from '../lib/recurring'
import { CategoryPicker } from './CategoryPicker'
import { sanitizeAmount } from './ExpenseSheet'
import { Sheet } from './Sheet'
import { useToast } from './Toast'

interface Props {
  recurring?: Recurring
  onClose: () => void
}

export function RecurringSheet({ recurring, onClose }: Props) {
  const categories = useCategories()
  const toast = useToast()
  const isNew = !recurring?.id

  const [label, setLabel] = useState(recurring?.label ?? '')
  const [amount, setAmount] = useState(recurring ? centsToInput(recurring.amount) : '')
  const [categoryId, setCategoryId] = useState<number | undefined>(recurring?.categoryId)
  const [nextDate, setNextDate] = useState(recurring ? nextOccurrence(recurring) : dateInMonth(monthOf(todayISO()), new Date().getDate()))
  const [active, setActive] = useState(recurring?.active ?? true)
  const [error, setError] = useState('')

  async function save(close: () => void) {
    const cents = parseAmount(amount)
    if (!label.trim()) return setError('Donne-lui un nom.')
    if (!(cents > 0)) return setError('Indique un montant.')
    if (!categoryId) return setError('Choisis une catégorie.')
    if (!nextDate) return setError('Choisis la prochaine échéance.')

    const month = monthOf(nextDate)
    const data = {
      label: label.trim(),
      amount: cents,
      categoryId,
      day: Number(nextDate.slice(8, 10)),
      active,
      // La prochaine échéance détermine le premier mois encore à générer.
      startMonth: month,
      lastMonth: undefined,
    }
    if (isNew) await db.recurrings.add(data)
    else await db.recurrings.update(recurring.id!, data)
    await runRecurring()
    toast(isNew ? 'Dépense récurrente créée' : 'Dépense récurrente modifiée')
    close()
  }

  async function remove(close: () => void) {
    await db.recurrings.delete(recurring!.id!)
    close()
    toast('Récurrence supprimée, les dépenses passées sont conservées')
  }

  return (
    <Sheet title={isNew ? 'Nouvelle récurrence' : 'Dépense récurrente'} onClose={onClose}>
      {(close) => (
        <form noValidate
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            withTimeout(save(close)).catch((err) => setError(describeError(err)))
          }}
        >
          <label className="amount-field">
            <input value={amount} onChange={(e) => setAmount(sanitizeAmount(e.target.value))} inputMode="decimal" placeholder="0,00" aria-label="Montant en euros" />
            <span className="amount-currency">€</span>
          </label>

          <label className="field">
            <span>Nom</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Loyer" />
          </label>

          <div className="field">
            <span>Catégorie</span>
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>

          <label className="field">
            <span>Prochaine échéance</span>
            <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            <small>Puis tous les mois au même jour. Si le jour n'existe pas (31 février…), le dernier jour du mois est utilisé.</small>
          </label>

          {!isNew && (
            <label className="toggle-row">
              <span className="toggle-text">
                <span>
                  Active
                  <small>Désactive-la pour la mettre en pause</small>
                </span>
              </span>
              <input type="checkbox" className="switch" checked={active} onChange={(e) => setActive(e.target.checked)} />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {!isNew && (
              <button type="button" className="btn btn-ghost-danger" onClick={() => withTimeout(remove(close)).catch((err) => setError(describeError(err)))} aria-label="Supprimer">
                <IconTrash size={20} />
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {isNew ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  )
}
