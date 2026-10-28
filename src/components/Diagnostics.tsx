import { useState, type CSSProperties } from 'react'
import { IconCopy, IconStethoscope } from '@tabler/icons-react'
import { db } from '../lib/db'
import { describeError, withTimeout } from '../lib/errors'
import { useToast } from './Toast'

const mb = (bytes?: number) => (bytes === undefined ? '?' : `${(bytes / 1024 / 1024).toFixed(1)} Mo`)

async function runChecks(): Promise<[string, string][]> {
  const lines: [string, string][] = [
    ['Version', __APP_VERSION__],
    ['Ouverte depuis', matchMedia('(display-mode: standalone)').matches ? "l'icône installée" : 'un onglet du navigateur'],
  ]

  try {
    const { usage, quota } = await navigator.storage.estimate()
    lines.push(['Espace utilisé', `${mb(usage)} sur ${mb(quota)} autorisés`])
    lines.push(['Stockage protégé', (await navigator.storage.persisted()) ? 'oui' : 'non'])
  } catch (err) {
    lines.push(['Espace', describeError(err)])
  }

  try {
    const [expenses, categories, recurrings] = await withTimeout(Promise.all([db.expenses.count(), db.categories.count(), db.recurrings.count()]))
    lines.push(['Contenu', `${expenses} dépenses, ${categories} catégories, ${recurrings} récurrences`])
  } catch (err) {
    lines.push(['Lecture', describeError(err)])
  }

  try {
    await withTimeout(
      db.transaction('rw', db.recurrings, async () => {
        const id = await db.recurrings.add({ label: 'test', amount: 1, categoryId: 0, day: 1, startMonth: '2000-01', active: false })
        await db.recurrings.delete(id)
      }),
    )
    lines.push(['Écriture', 'OK'])
  } catch (err) {
    lines.push(['Écriture', describeError(err)])
  }

  return lines
}

export function Diagnostics() {
  const toast = useToast()
  const [lines, setLines] = useState<[string, string][] | null>(null)
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    setLines(await runChecks())
    setRunning(false)
  }

  async function copy() {
    if (!lines) return
    try {
      await navigator.clipboard.writeText(lines.map(([k, v]) => `${k} : ${v}`).join('\n'))
      toast('Diagnostic copié')
    } catch {
      toast('Copie impossible, fais une capture d’écran')
    }
  }

  return (
    <section className="section">
      <h2 className="section-title">Diagnostic</h2>
      <div className="card list">
        <button className="setting-row" onClick={run} disabled={running}>
          <span className="cat-tile" style={{ '--c': '#5B6770' } as CSSProperties}>
            <IconStethoscope size={20} stroke={1.75} />
          </span>
          <span className="expense-main">
            <span className="expense-label">{running ? 'Test en cours…' : 'Tester le stockage'}</span>
            <span className="expense-sub">Vérifie que le téléphone peut lire et enregistrer</span>
          </span>
        </button>
        {lines && (
          <div className="diagnostics">
            <dl>
              {lines.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <button className="link-btn" onClick={copy}>
              <IconCopy size={16} /> Copier le diagnostic
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
