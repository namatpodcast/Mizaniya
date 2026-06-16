'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#f59e0b', icon: 'utensils' },
  { name: 'Transport',     color: '#3b82f6', icon: 'car' },
  { name: 'Housing',       color: '#8b5cf6', icon: 'home' },
  { name: 'Shopping',      color: '#ec4899', icon: 'shopping-bag' },
  { name: 'Health',        color: '#10b981', icon: 'heart' },
  { name: 'Entertainment', color: '#f97316', icon: 'play' },
  { name: 'Salary',        color: '#0d9488', icon: 'briefcase' },
  { name: 'Other',         color: '#6b7280', icon: 'wallet' },
]

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function seedDefaultCategories(userId: string) {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
  if (existing && existing.length > 0) return
  await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }))
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (event === 'SIGNED_IN' && session?.user) {
          await seedDefaultCategories(session.user.id)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
