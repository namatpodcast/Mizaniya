import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TransactionDrawer from '../components/TransactionDrawer'
import { SkeletonRow } from '../components/Skeleton'
import { formatKWD, formatDate } from '../lib/format'
import type { Category, TransactionWithCategory } from '../types/database'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
}

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTx, setEditTx] = useState<TransactionWithCategory | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterPayment, setFilterPayment] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [txRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    ])
    if (txRes.data) setTransactions(txRes.data as TransactionWithCategory[])
    if (catRes.data) setCategories(catRes.data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = transactions.filter((tx) => {
    if (filterFrom && tx.date < filterFrom) return false
    if (filterTo && tx.date > filterTo) return false
    if (filterCategory && tx.category_id !== filterCategory) return false
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (filterPayment && tx.payment_method !== filterPayment) return false
    const q = search.toLowerCase()
    if (q && !tx.merchant?.toLowerCase().includes(q) && !tx.note?.toLowerCase().includes(q)) return false
    return true
  })

  const openAdd = () => { setEditTx(null); setDrawerOpen(true) }
  const openEdit = (tx: TransactionWithCategory) => { setEditTx(tx); setDrawerOpen(true) }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
            showFilters
              ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Filter size={15} /> Filters
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchant or note…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Payment</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              {Object.entries(PAYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 w-fit">
              {(['all', 'income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                    filterType === t
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[120px_1fr_140px_120px_1fr_120px] gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <span>Date</span>
          <span>Merchant</span>
          <span>Category</span>
          <span>Payment</span>
          <span>Note</span>
          <span className="text-right">Amount</span>
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <ArrowsIcon />
            <p className="text-lg font-medium mt-4 text-gray-600 dark:text-gray-400">No transactions yet</p>
            <p className="text-sm mt-1">Add your first transaction with the + button below</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <button
              key={tx.id}
              onClick={() => openEdit(tx)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-[120px_1fr_140px_120px_1fr_120px] gap-2 md:gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.date)}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {tx.merchant || '—'}
              </span>
              {tx.categories ? (
                <span
                  className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-medium text-white w-fit"
                  style={{ backgroundColor: tx.categories.color }}
                >
                  {tx.categories.name}
                </span>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {tx.payment_method ? PAYMENT_LABELS[tx.payment_method] : '—'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{tx.note || '—'}</span>
              <span
                className={`text-sm font-semibold md:text-right ${
                  tx.type === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}{formatKWD(tx.amount)}
              </span>
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-colors"
      >
        <Plus size={24} />
      </button>

      <TransactionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchData}
        editTx={editTx}
        categories={categories}
      />
    </div>
  )
}

function ArrowsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  )
}
