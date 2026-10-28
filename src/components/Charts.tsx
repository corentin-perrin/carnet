import { moneyRound, monthShort } from '../lib/format'

interface Slice {
  key: number
  value: number
  color: string
}

/** Anneau découpé par catégorie, avec un petit espace entre les parts. */
export function Donut({ slices, total, label }: { slices: Slice[]; total: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const gap = slices.length > 1 ? 2.5 : 0
  let offset = 0

  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`Répartition : ${label}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * c
            const el = (
              <circle
                key={s.key}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${Math.max(len - gap, 0.5)} ${c}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            )
            offset += len
            return el
          })}
      </svg>
      <div className="donut-center">
        <span className="donut-value">{moneyRound(total)}</span>
        <span className="donut-label">{label}</span>
      </div>
    </div>
  )
}

// Doivent correspondre à .bar-track et .bar-label dans styles.css
const BAR_TRACK_HEIGHT = 110
const BAR_LABEL_SPACE = 26

interface Bar {
  month: string
  total: number
}

export function MonthBars({ bars, selected, onSelect }: { bars: Bar[]; selected: string; onSelect: (month: string) => void }) {
  const max = Math.max(...bars.map((b) => b.total), 1)
  const withData = bars.filter((b) => b.total > 0)
  const average = withData.length ? withData.reduce((s, b) => s + b.total, 0) / withData.length : 0

  return (
    <>
      <div className="bars">
        {average > 0 && <div className="bars-average" style={{ bottom: BAR_LABEL_SPACE + (average / max) * BAR_TRACK_HEIGHT }} />}
        {bars.map((b) => (
          <button key={b.month} className={'bar' + (b.month === selected ? ' selected' : '')} onClick={() => onSelect(b.month)}>
            <span className="bar-value">{b.total > 0 ? moneyRound(b.total) : '–'}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ height: `${(b.total / max) * 100}%` }} />
            </span>
            <span className="bar-label">{monthShort(b.month)}</span>
          </button>
        ))}
      </div>
      {average > 0 && (
        <p className="bars-legend">
          <span className="bars-legend-line" /> Moyenne des mois renseignés · {moneyRound(average)}
        </p>
      )}
    </>
  )
}
