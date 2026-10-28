import { db, expensesOfMonth } from './db'
import { frDate } from './format'

const BACKUP_APP = 'carnet'
const BACKUP_VERSION = 1

const csvCell = (value: string) => (/[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

/** CSV au format Excel français : séparateur « ; », virgule décimale, BOM UTF-8 pour les accents. */
export async function buildCSV(month?: string): Promise<Blob> {
  const [expenses, categories] = await Promise.all([
    month ? expensesOfMonth(month) : db.expenses.toArray(),
    db.categories.toArray(),
  ])
  const names = new Map(categories.map((c) => [c.id!, c.name]))
  expenses.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)

  const lines = [
    ['Date', 'Libellé', 'Catégorie', 'Montant (€)', 'Note', 'Récurrente'].join(';'),
    ...expenses.map((e) =>
      [
        frDate(e.date),
        csvCell(e.label),
        csvCell(names.get(e.categoryId) ?? ''),
        (e.amount / 100).toFixed(2).replace('.', ','),
        csvCell(e.note ?? ''),
        e.recurringId ? 'oui' : 'non',
      ].join(';'),
    ),
  ]
  return new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

export async function buildBackup(): Promise<Blob> {
  const [categories, expenses, recurrings] = await Promise.all([
    db.categories.toArray(),
    db.expenses.toArray(),
    db.recurrings.toArray(),
  ])
  const data = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories,
    expenses,
    recurrings,
  }
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

/** Remplace toutes les données par celles de la sauvegarde. Renvoie le nombre de dépenses restaurées. */
export async function restoreBackup(file: File): Promise<number> {
  let data: any
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde valide.")
  }
  if (data?.app !== BACKUP_APP || !Array.isArray(data.categories) || !Array.isArray(data.expenses)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Carnet.")
  }
  await db.transaction('rw', db.categories, db.expenses, db.recurrings, async () => {
    await Promise.all([db.categories.clear(), db.expenses.clear(), db.recurrings.clear()])
    await db.categories.bulkAdd(data.categories)
    await db.expenses.bulkAdd(data.expenses)
    await db.recurrings.bulkAdd(Array.isArray(data.recurrings) ? data.recurrings : [])
  })
  return data.expenses.length
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const canShareFiles = () =>
  typeof navigator.canShare === 'function' &&
  navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] })

/** Ouvre le menu de partage Android (Drive, mail…). Retombe sur un téléchargement si le type n'est pas partageable. */
export async function shareFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') throw err
    }
    return
  }
  downloadFile(blob, filename)
}
