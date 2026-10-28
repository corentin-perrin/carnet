import type { CSSProperties } from 'react'
import type { Category } from '../lib/db'
import { CatIcon } from '../lib/icons'

interface Props {
  categories: Category[]
  value?: number
  onChange: (id: number) => void
}

export function CategoryPicker({ categories, value, onChange }: Props) {
  // Une catégorie archivée reste visible si c'est celle de la dépense qu'on modifie.
  const visible = categories.filter((c) => !c.archived || c.id === value)
  return (
    <div className="cat-grid" role="radiogroup" aria-label="Catégorie">
      {visible.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={c.id === value}
          className={'cat-choice' + (c.id === value ? ' selected' : '')}
          style={{ '--c': c.color } as CSSProperties}
          onClick={() => onChange(c.id!)}
        >
          <span className="cat-tile">
            <CatIcon name={c.icon} />
          </span>
          <span className="cat-choice-name">{c.name}</span>
        </button>
      ))}
    </div>
  )
}
