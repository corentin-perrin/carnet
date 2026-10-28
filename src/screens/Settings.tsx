import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  IconChevronRight, IconDatabaseExport, IconDeviceMobileDown, IconFileSpreadsheet, IconPlus, IconRestore, IconShare,
  IconShieldCheck, IconShieldExclamation,
} from '@tabler/icons-react'
import { db, type Category, type Recurring } from '../lib/db'
import { buildBackup, buildCSV, canShareFiles, downloadFile, restoreBackup, shareFile } from '../lib/export'
import { money, monthName, monthYear, shortDate, todayISO } from '../lib/format'
import { useCategories, useCategoryMap } from '../lib/hooks'
import { CatIcon } from '../lib/icons'
import { nextOccurrence } from '../lib/recurring'
import { Diagnostics } from '../components/Diagnostics'
import { useToast } from '../components/Toast'

export interface InstallPrompt extends Event {
  prompt: () => Promise<void>
}

interface Props {
  month: string
  installPrompt: InstallPrompt | null
  onInstalled: () => void
  onEditCategory: (category?: Category) => void
  onEditRecurring: (recurring?: Recurring) => void
}

export function Settings({ month, installPrompt, onInstalled, onEditCategory, onEditRecurring }: Props) {
  const toast = useToast()
  const categories = useCategories()
  const categoryMap = useCategoryMap()
  const recurrings = useLiveQuery(() => db.recurrings.toArray()) ?? []
  const count = useLiveQuery(() => db.expenses.count())
  const fileInput = useRef<HTMLInputElement>(null)
  const [shareable] = useState(canShareFiles)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
  }, [])

  async function askPersist() {
    const granted = (await navigator.storage?.persist?.()) ?? false
    setPersisted(granted)
    if (!granted) toast("Chrome refuse pour l'instant. Installe l'appli puis réessaie.")
  }

  const stamp = todayISO()
  const exports = [
    {
      key: 'month',
      Icon: IconFileSpreadsheet,
      title: `CSV · ${monthName(month)} ${monthYear(month)}`,
      sub: 'Les dépenses du mois affiché',
      build: () => buildCSV(month),
      filename: `carnet-${month}.csv`,
    },
    {
      key: 'all',
      Icon: IconFileSpreadsheet,
      title: 'CSV · tout l’historique',
      sub: `${count ?? '…'} dépenses, s'ouvre dans Excel ou Sheets`,
      build: () => buildCSV(),
      filename: `carnet-complet-${stamp}.csv`,
    },
    {
      key: 'backup',
      Icon: IconDatabaseExport,
      title: 'Sauvegarde complète',
      sub: 'Fichier JSON avec catégories et récurrences',
      build: buildBackup,
      filename: `carnet-sauvegarde-${stamp}.json`,
    },
  ]

  async function onRestore(file: File | undefined) {
    if (!file) return
    if (!confirm('Restaurer cette sauvegarde ? Toutes les données actuelles seront remplacées.')) return
    try {
      const n = await restoreBackup(file)
      toast(`Sauvegarde restaurée · ${n} dépenses`)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <>
      <header className="page-header">
        <span className="kicker">Carnet</span>
        <h1 className="display">Réglages</h1>
      </header>

      {installPrompt && (
        <button
          className="install-banner"
          onClick={async () => {
            await installPrompt.prompt()
            onInstalled()
          }}
        >
          <IconDeviceMobileDown size={22} />
          <span>
            <strong>Installer l'appli</strong>
            <small>Ajoute Carnet à ton écran d'accueil</small>
          </span>
          <IconChevronRight size={18} />
        </button>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Dépenses récurrentes</h2>
          <button className="link-btn" onClick={() => onEditRecurring()}>
            <IconPlus size={16} /> Ajouter
          </button>
        </div>
        <div className="card list">
          {recurrings.length === 0 && <p className="muted list-empty">Loyer, abonnements, forfait… ajoutés automatiquement chaque mois.</p>}
          {recurrings.map((r) => {
            const c = categoryMap.get(r.categoryId)
            return (
              <button key={r.id} className={'setting-row' + (r.active ? '' : ' inactive')} onClick={() => onEditRecurring(r)}>
                <span className="cat-tile" style={{ '--c': c?.color ?? '#8F7E6E' } as CSSProperties}>
                  <CatIcon name={c?.icon ?? 'dots'} />
                </span>
                <span className="expense-main">
                  <span className="expense-label">{r.label}</span>
                  <span className="expense-sub">{r.active ? `Prochaine : ${shortDate(nextOccurrence(r))}` : 'En pause'}</span>
                </span>
                <span className="expense-amount">{money(r.amount)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Catégories</h2>
          <button className="link-btn" onClick={() => onEditCategory()}>
            <IconPlus size={16} /> Ajouter
          </button>
        </div>
        <div className="card list">
          {categories.map((c) => (
            <button key={c.id} className={'setting-row' + (c.archived ? ' inactive' : '')} onClick={() => onEditCategory(c)}>
              <span className="cat-tile" style={{ '--c': c.color } as CSSProperties}>
                <CatIcon name={c.icon} />
              </span>
              <span className="expense-main">
                <span className="expense-label">{c.name}</span>
                {c.archived && <span className="expense-sub">Archivée</span>}
              </span>
              <IconChevronRight size={18} className="muted" />
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Exports et sauvegarde</h2>
        <div className="card list">
          {exports.map(({ key, Icon, title, sub, build, filename }) => (
            <div key={key} className="setting-row">
              <button className="export-main" onClick={async () => downloadFile(await build(), filename)}>
                <span className="cat-tile" style={{ '--c': '#1F6F8B' } as CSSProperties}>
                  <Icon size={20} stroke={1.75} />
                </span>
                <span className="expense-main">
                  <span className="expense-label">{title}</span>
                  <span className="expense-sub">{sub}</span>
                </span>
              </button>
              {shareable && (
                <button
                  className="icon-btn"
                  aria-label={`Partager ${title}`}
                  onClick={async () => {
                    try {
                      await shareFile(await build(), filename)
                    } catch {
                      toast("Le partage n'a pas fonctionné, réessaie.")
                    }
                  }}
                >
                  <IconShare size={20} />
                </button>
              )}
            </div>
          ))}
          <button className="setting-row" onClick={() => fileInput.current?.click()}>
            <span className="cat-tile" style={{ '--c': '#D9653B' } as CSSProperties}>
              <IconRestore size={20} stroke={1.75} />
            </span>
            <span className="expense-main">
              <span className="expense-label">Restaurer une sauvegarde</span>
              <span className="expense-sub">Remplace toutes les données actuelles</span>
            </span>
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => onRestore(e.target.files?.[0])} />
        </div>
        {persisted === true && (
          <p className="storage-status ok">
            <IconShieldCheck size={18} /> Stockage protégé : Chrome ne l'effacera pas pour faire de la place.
          </p>
        )}
        {persisted === false && (
          <button className="storage-status warn" onClick={askPersist}>
            <IconShieldExclamation size={18} />
            <span>
              Stockage non protégé : Chrome peut l'effacer s'il manque de place. Installe l'appli, puis touche ici pour le protéger.
            </span>
          </button>
        )}
        <p className="hint">Tes données restent uniquement sur ce téléphone. Fais une sauvegarde de temps en temps (Drive, mail…).</p>
      </section>

      <Diagnostics />

      <p className="footer-note">Carnet · v{__APP_VERSION__}</p>
    </>
  )
}
