import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { SkeletonCard } from '../components/Skeleton'
import type { Category } from '../types/database'

const PRESET_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#f97316', '#0d9488']
const PRESET_ICONS = ['wallet', 'utensils', 'car', 'home', 'shopping-bag', 'heart', 'play', 'briefcase'] as const
type PresetIcon = (typeof PRESET_ICONS)[number]

function toLucide(name: string): string {
  return name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Component = (LucideIcons as Record<string, React.FC<{ size?: number }>>)[toLucide(name)]
  if (!Component) return <LucideIcons.Wallet size={size} />
  return <Component size={size} />
}

interface FormState {
  name: string
  color: string
  icon: PresetIcon
}

const EMPTY_FORM: FormState = { name: '', color: '#6366f1', icon: 'wallet' }

export default function Categories() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [txCounts, setTxCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [catRes, txRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('transactions').select('category_id').eq('user_id', user.id),
    ])
    if (catRes.data) setCategories(catRes.data)
    if (txRes.data) {
      const counts: Record<string, number> = {}
      txRes.data.forEach(({ category_id }) => {
        if (category_id) counts[category_id] = (counts[category_id] ?? 0) + 1
      })
      setTxCounts(counts)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const startEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, color: cat.color, icon: (cat.icon as PresetIcon) ?? 'wallet' })
    setShowAdd(false)
  }

  const cancelEdit = () => { setEditId(null); setForm(EMPTY_FORM) }

  const handleSave = async (e: FormEvent, id?: string) => {
    e.preventDefault()
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    if (!user) return
    setSaving(true)
    if (id) {
      const { error } = await supabase.from('categories').update(form).eq('id', id)
      if (error) { toast(error.message, 'error') } else { toast('Category updated'); setEditId(null) }
    } else {
      const { error } = await supabase.from('categories').insert({ ...form, user_id: user.id })
      if (error) { toast(error.message, 'error') } else { toast('Category added'); setShowAdd(false) }
    }
    setSaving(false)
    await fetchData()
  }

  const handleDelete = async (cat: Category) => {
    const count = txCounts[cat.id] ?? 0
    if (count > 0) {
      toast(`Cannot delete — ${count} transaction${count !== 1 ? 's' : ''} use this category`, 'error')
      return
    }
    if (deletingId !== cat.id) { setDeletingId(cat.id); return }
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    setDeletingId(null)
    if (error) { toast(error.message, 'error') } else { toast('Category deleted'); fetchData() }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
        <button
          onClick={() => { setShowAdd((v) => !v); setEditId(null); setForm(EMPTY_FORM) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add category
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={(e) => handleSave(e)}
          className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">New category</h2>
          <CategoryForm form={form} setForm={setForm} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
              >
                {editId === cat.id ? (
                  <form onSubmit={(e) => handleSave(e, cat.id)} className="space-y-4">
                    <CategoryForm form={form} setForm={setForm} />
                    <div className="flex gap-2">
                      <button type="button" onClick={cancelEdit} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X size={16} className="text-gray-500" />
                      </button>
                      <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                        <Check size={15} className="inline mr-1" /> Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            deletingId === cat.id
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {txCounts[cat.id] ?? 0} transaction{(txCounts[cat.id] ?? 0) !== 1 ? 's' : ''}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{cat.color}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
      </div>

      {!loading && categories.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Tags />
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">No categories yet</p>
          <p className="text-sm mt-1">Add your first category above</p>
        </div>
      )}
    </div>
  )
}

function CategoryForm({
  form,
  setForm,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Category name"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Icon</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm((f) => ({ ...f, icon }))}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                form.icon === icon
                  ? 'text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={form.icon === icon ? { backgroundColor: form.color } : {}}
            >
              <CategoryIconSmall name={icon} />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function CategoryIconSmall({ name }: { name: string }) {
  const Component = (LucideIcons as Record<string, React.FC<{ size?: number }>>)[toLucide(name)]
  if (!Component) return <LucideIcons.Wallet size={16} />
  return <Component size={16} />
}

function Tags() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3z" />
      <path d="M6 6h.008v.008H6V6z" />
    </svg>
  )
}
