import { useState, type CSSProperties } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { IconCheck, IconTrash } from '@tabler/icons-react'
import { describeError } from '../lib/errors'
import { db, PALETTE, type Category } from '../lib/db'
import { CATEGORY_ICONS, CatIcon } from '../lib/icons'
import { Sheet } from './Sheet'
import { useToast } from './Toast'

interface Props {
  category?: Category
  onClose: () => void
}

export function CategorySheet({ category, onClose }: Props) {
  const toast = useToast()
  const isNew = !category?.id
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? PALETTE[0])
  const [icon, setIcon] = useState(category?.icon ?? 'dots')
  const [archived, setArchived] = useState(!!category?.archived)
  const [error, setError] = useState('')

  const usage = useLiveQuery(() => (category?.id ? db.expenses.where('categoryId').equals(category.id).count() : 0), [category?.id])

  async function save(close: () => void) {
    if (!name.trim()) return setError('Donne-lui un nom.')
    const data = { name: name.trim(), color, icon, archived }
    if (isNew) {
      const last = await db.categories.orderBy('order').last()
      await db.categories.add({ ...data, order: (last?.order ?? -1) + 1 })
    } else {
      await db.categories.update(category.id!, data)
    }
    toast(isNew ? 'Catégorie créée' : 'Catégorie modifiée')
    close()
  }

  async function remove(close: () => void) {
    const recurrings = await db.recurrings.filter((r) => r.categoryId === category!.id).count()
    if (usage || recurrings) {
      setError('Cette catégorie est utilisée. Archive-la plutôt pour la masquer.')
      return
    }
    await db.categories.delete(category!.id!)
    close()
    toast('Catégorie supprimée')
  }

  return (
    <Sheet title={isNew ? 'Nouvelle catégorie' : 'Catégorie'} onClose={onClose}>
      {(close) => (
        <form noValidate
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            save(close).catch((err) => setError(describeError(err)))
          }}
        >
          <div className="cat-preview" style={{ '--c': color } as CSSProperties}>
            <span className="cat-tile big">
              <CatIcon name={icon} size={28} />
            </span>
          </div>

          <label className="field">
            <span>Nom</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Animaux" />
          </label>

          <div className="field">
            <span>Couleur</span>
            <div className="swatches">
              {PALETTE.map((c) => (
                <button key={c} type="button" className="swatch" style={{ background: c }} onClick={() => setColor(c)} aria-label={`Couleur ${c}`} aria-pressed={c === color}>
                  {c === color && <IconCheck size={16} stroke={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Icône</span>
            <div className="icon-grid" style={{ '--c': color } as CSSProperties}>
              {Object.keys(CATEGORY_ICONS).map((key) => (
                <button key={key} type="button" className={'icon-choice' + (key === icon ? ' selected' : '')} onClick={() => setIcon(key)} aria-label={key} aria-pressed={key === icon}>
                  <CatIcon name={key} />
                </button>
              ))}
            </div>
          </div>

          {!isNew && (
            <label className="toggle-row">
              <span className="toggle-text">
                <span>
                  Archivée
                  <small>Masquée lors de la saisie, l'historique est conservé</small>
                </span>
              </span>
              <input type="checkbox" className="switch" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {!isNew && (
              <button type="button" className="btn btn-ghost-danger" onClick={() => remove(close).catch((err) => setError(describeError(err)))} aria-label="Supprimer">
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
