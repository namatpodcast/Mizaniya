'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Scale, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatKWD, formatDate } from '@/lib/format'
import { SkeletonCard, Skeleton } from '@/components/Skeleton'
import type { TransactionWithCategory } from '@/types/database'

interface MonthlyBar { month: string; income: number; expense: number }
interface CategorySlice { name: string; value: number; color: string }

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      setLoading(true)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      const { data } = await supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .eq('user_id', user.id)
        .gte('date', sixMonthsAgo.toISOString().slice(0, 10))
        .order('date', { ascending: false })
      if (data) setTransactions(data as TransactionWithCategory[])
      setLoading(false)
    }
    fetch()
  }, [user])

  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const monthlyTxs = transactions.filter((t) => t.date.startsWith(thisMonth))
  const monthIncome  = monthlyTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthlyTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = monthIncome - monthExpense

  const barData: MonthlyBar[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const m = transactions.filter((t) => t.date.startsWith(key))
    return {
      month: label,
      income:  m.filter((t) => t.type === 'income').reduce((s, t)  => s + t.amount, 0),
      expense: m.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })

  const categoryMap = new Map<string, CategorySlice>()
  monthlyTxs.filter((t) => t.type === 'expense').forEach((t) => {
    const key   = t.categories?.name  ?? 'Other'
    const color = t.categories?.color ?? '#6b7280'
    const ex = categoryMap.get(key)
    if (ex) ex.value += t.amount
    else categoryMap.set(key, { name: key, value: t.amount, color })
  })
  const pieData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)
  const last5 = transactions.slice(0, 5)

  const statCards = [
    { label: 'Balance this month', value: balance,      icon: Scale,       color: balance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Income',             value: monthIncome,  icon: TrendingUp,  color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Expenses',           value: monthExpense, icon: TrendingDown,color: 'text-red-500 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Transactions',       value: null, count: monthlyTxs.length, icon: Hash, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(({ label, value, count, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color}`}>
                  {count !== undefined ? count : formatKWD(value!)}
                </p>
              </div>
            ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Income vs Expenses — last 6 months</h2>
        {loading ? <Skeleton className="h-56" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `KD ${v.toFixed(0)}`} width={72} />
              <Tooltip formatter={(v) => typeof v === 'number' ? formatKWD(v) : String(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none' }} />
              <Bar dataKey="income"  name="Income"  fill="#0d9488" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Spending by category</h2>
          {loading ? <Skeleton className="h-48" /> : pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No expense data this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ fontSize: 12, color: '#9ca3af' }}>{v}</span>} />
                <Tooltip formatter={(v) => typeof v === 'number' ? formatKWD(v) : String(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent transactions</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : last5.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <div className="space-y-2">
              {last5.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: tx.categories?.color ?? '#6b7280' }}>
                    {(tx.merchant || tx.categories?.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.merchant || tx.categories?.name || 'Transaction'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatKWD(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
