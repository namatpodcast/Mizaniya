import { useEffect, useState, type FormEvent } from 'react'
import { X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import type { Category, TransactionWithCategory } from '../types/database'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editTx?: TransactionWithCategory | null
  categories: Category[]
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]

export default function TransactionDrawer({ open, onClose, onSaved, editTx, categories }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'other' | ''>('')
  const [note, setNote] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editTx) {
      setAmount(String(editTx.amount))
      setType(editTx.type)
      setDate(editTx.date)
      setCategoryId(editTx.category_id ?? '')
      setMerchant(editTx.merchant ?? '')
      setPaymentMethod(editTx.payment_method ?? '')
      setNote(editTx.note ?? '')
      setIsRecurring(editTx.is_recurring)
    } else {
      setAmount('')
      setType('expense')
      setDate(new Date().toISOString().slice(0, 10))
      setCategoryId('')
      setMerchant('')
      setPaymentMethod('')
      setNote('')
      setIsRecurring(false)
    }
    setErrors({})
    setConfirmDelete(false)
  }, [editTx, open])

  const validate = () => {
    const e: Record<string, string> = {}
    const n = parseFloat(amount)
    if (!amount || isNaN(n) || n <= 0) e.amount = 'Amount must be greater than 0'
    if (!date) e.date = 'Date is required'
    return e
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!user) return

    setSaving(true)
    const payload = {
      amount: parseFloat(parseFloat(amount).toFixed(3)),
      type,
      date,
      category_id: categoryId || null,
      merchant: merchant || null,
      payment_method: (paymentMethod || null) as 'cash' | 'card' | 'bank_transfer' | 'other' | null,
      note: note || null,
      is_recurring: isRecurring,
    }

    if (editTx) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editTx.id)
      if (error) { toast(error.message, 'error') } else { toast('Transaction updated'); onSaved(); onClose() }
    } else {
      const { error } = await supabase.from('transactions').insert({ ...payload, user_id: user.id })
      if (error) { toast(error.message, 'error') } else { toast('Transaction added'); onSaved(); onClose() }
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!editTx) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const { error } = await supabase.from('transactions').delete().eq('id', editTx.id)
    setDeleting(false)
    if (error) { toast(error.message, 'error') } else { toast('Transaction deleted'); onSaved(); onClose() }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editTx ? 'Edit transaction' : 'Add transaction'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    type === t
                      ? t === 'income'
                        ? 'bg-teal-600 text-white'
                        : 'bg-red-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (KD)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.000"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Lulu Hypermarket"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Not specified</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional note…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded accent-primary-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Recurring transaction</span>
          </label>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          {editTx && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
              }`}
            >
              <Trash2 size={15} />
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? 'Saving…' : editTx ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </>
  )
}
