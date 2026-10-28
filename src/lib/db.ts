import Dexie, { type Table } from 'dexie'

export interface Category {
  id?: number
  name: string
  icon: string
  color: string
  order: number
  archived?: boolean
}

export interface Expense {
  id?: number
  /** En centimes */
  amount: number
  /** YYYY-MM-DD */
  date: string
  categoryId: number
  label: string
  note?: string
  recurringId?: number
  createdAt: number
}

export interface Recurring {
  id?: number
  label: string
  amount: number
  categoryId: number
  /** Jour du mois (1-31) */
  day: number
  /** Premier mois concerné, YYYY-MM */
  startMonth: string
  /** Dernier mois pour lequel la dépense a été créée, YYYY-MM */
  lastMonth?: string
  active: boolean
}

export const PALETTE = [
  '#D9653B', '#E07A6A', '#E7A33E', '#6E8B3D', '#2F6B5A',
  '#1F6F8B', '#7A74B8', '#8E4A6B', '#B08A5B', '#5B6770',
]

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Courses', icon: 'cart', color: '#6E8B3D', order: 0 },
  { name: 'Restaurants', icon: 'kitchen', color: '#E7A33E', order: 1 },
  { name: 'Transport', icon: 'bus', color: '#1F6F8B', order: 2 },
  { name: 'Logement', icon: 'home', color: '#D9653B', order: 3 },
  { name: 'Loisirs', icon: 'gamepad', color: '#8E4A6B', order: 4 },
  { name: 'Santé', icon: 'stethoscope', color: '#2F6B5A', order: 5 },
  { name: 'Shopping', icon: 'shirt', color: '#E07A6A', order: 6 },
  { name: 'Abonnements', icon: 'repeat', color: '#7A74B8', order: 7 },
  { name: 'Autre', icon: 'dots', color: '#B08A5B', order: 8 },
]

class CarnetDB extends Dexie {
  categories!: Table<Category, number>
  expenses!: Table<Expense, number>
  recurrings!: Table<Recurring, number>

  constructor() {
    super('carnet')
    this.version(1).stores({
      categories: '++id, order',
      expenses: '++id, date, categoryId, recurringId',
      recurrings: '++id',
    })
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(DEFAULT_CATEGORIES)
    })
  }
}

export const db = new CarnetDB()

export const expensesOfMonth = (month: string) => db.expenses.where('date').startsWith(month).toArray()
