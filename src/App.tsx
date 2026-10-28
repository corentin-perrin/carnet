import { useEffect, useState } from 'react'
import type { Category, Expense, Recurring } from './lib/db'
import { monthOf, todayISO } from './lib/format'
import { runRecurring } from './lib/recurring'
import { BottomNav, type Tab } from './components/BottomNav'
import { CategorySheet } from './components/CategorySheet'
import { ExpenseSheet } from './components/ExpenseSheet'
import { RecurringSheet } from './components/RecurringSheet'
import { History } from './screens/History'
import { Home } from './screens/Home'
import { Settings, type InstallPrompt } from './screens/Settings'
import { Stats } from './screens/Stats'

type SheetState =
  | { kind: 'expense'; expense?: Expense }
  | { kind: 'category'; category?: Category }
  | { kind: 'recurring'; recurring?: Recurring }
  | null

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [month, setMonth] = useState(() => monthOf(todayISO()))
  const [sheet, setSheet] = useState<SheetState>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null)

  useEffect(() => {
    runRecurring()
    // L'appli peut rester ouverte en arrière-plan plusieurs jours : on revérifie à chaque retour.
    const onVisible = () => {
      if (document.visibilityState === 'visible') runRecurring()
    }
    const onInstallable = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as InstallPrompt)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('beforeinstallprompt', onInstallable)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('beforeinstallprompt', onInstallable)
    }
  }, [])

  function goTo(next: Tab) {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  const closeSheet = () => setSheet(null)
  const editExpense = (expense?: Expense) => setSheet({ kind: 'expense', expense })

  return (
    <>
      <main className="screen" key={tab}>
        {tab === 'home' && <Home month={month} onMonth={setMonth} onEdit={editExpense} onSeeAll={() => goTo('history')} />}
        {tab === 'stats' && <Stats month={month} onMonth={setMonth} />}
        {tab === 'history' && <History month={month} onMonth={setMonth} onEdit={editExpense} />}
        {tab === 'settings' && (
          <Settings
            month={month}
            installPrompt={installPrompt}
            onInstalled={() => setInstallPrompt(null)}
            onEditCategory={(category) => setSheet({ kind: 'category', category })}
            onEditRecurring={(recurring) => setSheet({ kind: 'recurring', recurring })}
          />
        )}
      </main>

      <BottomNav tab={tab} onTab={goTo} onAdd={() => editExpense()} />

      {sheet?.kind === 'expense' && <ExpenseSheet expense={sheet.expense} onClose={closeSheet} />}
      {sheet?.kind === 'category' && <CategorySheet category={sheet.category} onClose={closeSheet} />}
      {sheet?.kind === 'recurring' && <RecurringSheet recurring={sheet.recurring} onClose={closeSheet} />}
    </>
  )
}
