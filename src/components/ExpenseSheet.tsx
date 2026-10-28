import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { IconNote, IconRepeat, IconTrash } from '@tabler/icons-react'
import { db, type Expense } from '../lib/db'
import { centsToInput, monthOf, parseAmount, shortDate, todayISO } from '../lib/format'
import { useCategories } from '../lib/hooks'
import { CategoryPicker } from './CategoryPicker'
import { Sheet } from './Sheet'
import { useToast } from './Toast'

interface Props {
  expense?: Expense
  onClose: () => void
}

/** Libellés déjà saisis → catégorie utilisée la dernière fois, pour pré-remplir. */
async function knownLabels() {
  const recent = await db.expenses.orderBy('date').reverse().limit(500).toArray()
  const map = new Map<string, number>()
  for (const e of recent) {
    const key = e.label.trim().toLowerCase()
    if (!map.has(key)) map.set(key, e.categoryId)
  }
  return { map, labels: [...new Set(recent.map((e) => e.label.trim()))].slice(0, 80) }
}

export const sanitizeAmount = (value: string) => value.replace(/[^\d,.]/g, '').replace(/[.,](?=.*[.,])/g, '')

export function ExpenseSheet({ expense, onClose }: Props) {
  const categories = useCategories()
  const known = useLiveQuery(knownLabels)
  const toast = useToast()

  const [amount, setAmount] = useState(expense ? centsToInput(expense.amount) : '')
  const [label, setLabel] = useState(expense?.label ?? '')
  const [categoryId, setCategoryId] = useState<number | undefined>(expense?.categoryId)
  const [categoryTouched, setCategoryTouched] = useState(!!expense)
  const [date, setDate] = useState(expense?.date ?? todayISO())
  const [note, setNote] = useState(expense?.note ?? '')
  const [showNote, setShowNote] = useState(!!expense?.note)
  const [repeat, setRepeat] = useState(false)
  const [error, setError] = useState('')

  const isNew = !expense?.id

  function onLabel(value: string) {
    setLabel(value)
    const match = known?.map.get(value.trim().toLowerCase())
    if (match && !categoryTouched) setCategoryId(match)
  }

  async function save(close: () => void) {
    const cents = parseAmount(amount)
    if (!(cents > 0)) return setError('Indique un montant.')
    if (!categoryId) return setError('Choisis une catégorie.')

    const data = {
      amount: cents,
      label: label.trim() || categories.find((c) => c.id === categoryId)?.name || 'Dépense',
      categoryId,
      date: date || todayISO(),
      note: note.trim() || undefined,
    }

    if (isNew && repeat && data.date > todayISO()) {
      // Échéance future : on programme seulement la récurrence, la dépense sera créée le jour venu.
      await db.recurrings.add({
        label: data.label,
        amount: cents,
        categoryId,
        day: Number(data.date.slice(8, 10)),
        startMonth: monthOf(data.date),
        active: true,
      })
      toast(`Programmée pour le ${shortDate(data.date)}, puis chaque mois`)
    } else if (isNew) {
      let recurringId: number | undefined
      if (repeat) {
        recurringId = await db.recurrings.add({
          label: data.label,
          amount: cents,
          categoryId,
          day: Number(data.date.slice(8, 10)),
          startMonth: monthOf(data.date),
          lastMonth: monthOf(data.date),
          active: true,
        })
      }
      await db.expenses.add({ ...data, recurringId, createdAt: Date.now() })
      toast(repeat ? 'Dépense ajoutée, elle reviendra chaque mois' : 'Dépense ajoutée')
    } else {
      await db.expenses.update(expense.id!, data)
      toast('Dépense modifiée')
    }
    close()
  }

  async function remove(close: () => void) {
    const copy = { ...expense! }
    await db.expenses.delete(copy.id!)
    close()
    toast('Dépense supprimée', { label: 'Annuler', run: () => db.expenses.add(copy) })
  }

  return (
    <Sheet title={isNew ? 'Nouvelle dépense' : 'Modifier la dépense'} onClose={onClose}>
      {(close) => (
        <form noValidate
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            save(close)
          }}
        >
          <label className="amount-field">
            <span className="sr-only">Montant</span>
            <input
              value={amount}
              onChange={(e) => {
                setAmount(sanitizeAmount(e.target.value))
                setError('')
              }}
              inputMode="decimal"
              placeholder="0,00"
              autoFocus={isNew}
              aria-label="Montant en euros"
            />
            <span className="amount-currency">€</span>
          </label>

          <label className="field">
            <span>Libellé</span>
            <input value={label} onChange={(e) => onLabel(e.target.value)} placeholder="Boulangerie" list="known-labels" enterKeyHint="done" />
            <datalist id="known-labels">
              {known?.labels.map((l) => <option key={l} value={l} />)}
            </datalist>
          </label>

          <div className="field">
            <span>Catégorie</span>
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id)
                setCategoryTouched(true)
                setError('')
              }}
            />
          </div>

          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          {showNote ? (
            <label className="field">
              <span>Note</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Avec Léa, pour son anniversaire" />
            </label>
          ) : (
            <button type="button" className="link-btn" onClick={() => setShowNote(true)}>
              <IconNote size={18} /> Ajouter une note
            </button>
          )}

          {isNew ? (
            <label className="toggle-row">
              <span className="toggle-text">
                <IconRepeat size={18} />
                <span>
                  Répéter chaque mois
                  <small>Loyer, abonnements… ajoutée automatiquement à la même date</small>
                </span>
              </span>
              <input type="checkbox" className="switch" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
            </label>
          ) : (
            expense.recurringId && (
              <p className="hint">
                <IconRepeat size={16} /> Créée par une dépense récurrente. Modifie-la dans Réglages pour changer les prochains mois.
              </p>
            )
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {!isNew && (
              <button type="button" className="btn btn-ghost-danger" onClick={() => remove(close)} aria-label="Supprimer">
                <IconTrash size={20} />
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {isNew ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  )
}
