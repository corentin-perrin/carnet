const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const eurRound = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/** Les montants sont stockés en centimes pour éviter les erreurs d'arrondi. */
export const money = (cents: number) => eur.format(cents / 100)
export const moneyRound = (cents: number) => eurRound.format(cents / 100)

export function parseAmount(input: string): number {
  const n = parseFloat(input.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')

const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const monthOf = (iso: string) => iso.slice(0, 7)

const parseMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export function addMonths(month: string, n: number): string {
  const d = parseMonth(month)
  d.setMonth(d.getMonth() + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function daysInMonth(month: string): number {
  const d = parseMonth(month)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/** Date du jour `day` dans `month`, ramenée au dernier jour si le mois est plus court (ex. le 31 en février). */
export const dateInMonth = (month: string, day: number) => `${month}-${pad(Math.min(day, daysInMonth(month)))}`

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const monthName = (month: string) => capitalize(parseMonth(month).toLocaleDateString('fr-FR', { month: 'long' }))
export const monthShort = (month: string) => parseMonth(month).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
export const monthYear = (month: string) => parseMonth(month).getFullYear()

export function dayLabel(iso: string): string {
  const today = todayISO()
  if (iso === today) return "Aujourd'hui"
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (iso === toISO(y)) return 'Hier'
  const [yy, mm, dd] = iso.split('-').map(Number)
  return capitalize(new Date(yy, mm - 1, dd).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
}

export function shortDate(iso: string): string {
  const [yy, mm, dd] = iso.split('-').map(Number)
  return new Date(yy, mm - 1, dd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const frDate = (iso: string) => iso.split('-').reverse().join('/')
