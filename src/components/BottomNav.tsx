import { IconChartDonut3, IconHome, IconList, IconPlus, IconSettings } from '@tabler/icons-react'

export type Tab = 'home' | 'stats' | 'history' | 'settings'

const TABS = [
  { id: 'home', label: 'Accueil', Icon: IconHome },
  { id: 'stats', label: 'Stats', Icon: IconChartDonut3 },
  { id: 'history', label: 'Historique', Icon: IconList },
  { id: 'settings', label: 'Réglages', Icon: IconSettings },
] as const

interface Props {
  tab: Tab
  onTab: (tab: Tab) => void
  onAdd: () => void
}

export function BottomNav({ tab, onTab, onAdd }: Props) {
  const button = ({ id, label, Icon }: (typeof TABS)[number]) => (
    <button key={id} className={'nav-item' + (tab === id ? ' active' : '')} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}>
      <Icon size={22} stroke={1.75} />
      <span>{label}</span>
    </button>
  )

  return (
    <nav className="bottom-nav">
      {TABS.slice(0, 2).map(button)}
      <button className="fab" onClick={onAdd} aria-label="Ajouter une dépense">
        <IconPlus size={26} stroke={2.25} />
      </button>
      {TABS.slice(2).map(button)}
    </nav>
  )
}
