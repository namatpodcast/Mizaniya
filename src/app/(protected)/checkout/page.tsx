'use client'

import { Suspense, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Lock, Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const PLAN_PRICING: Record<string, { name: string; price: number }> = {
  pro:     { name: 'Pro',     price: 2.5 },
  premium: { name: 'Premium', price: 6.0 },
}

function CheckoutInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useAuth()

  const planId = params.get('plan') ?? 'pro'
  const plan = PLAN_PRICING[planId] ?? PLAN_PRICING.pro

  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handlePay = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.functions.invoke('pay-plan', {
      body: { plan: planId, amount: plan.price, email, password },
    })
    setLoading(false)

    if (error) {
      // supabase wraps non-2xx responses; read the real message from the body.
      let msg = error.message ?? 'Payment failed. Please try again.'
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        try { const body = await ctx.json(); msg = body?.error ?? msg } catch { /* keep msg */ }
      }
      setError(msg)
      return
    }
    if (data?.error) {
      setError(data.error)
      return
    }
    if (data?.payment_url) {
      window.location.href = data.payment_url
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="w-[460px] mx-auto py-20">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payment successful</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You&rsquo;re now on the <span className="font-semibold text-gray-700 dark:text-gray-300">{plan.name}</span> plan.
          </p>
          <Link href="/dashboard" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[460px] mx-auto py-12">
      <Link href="/plans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5">
        <ArrowLeft size={15} /> Back to plans
      </Link>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Order summary */}
        <div className="px-7 py-6 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">You&rsquo;re subscribing to</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mizaniya {plan.name}</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              KD {plan.price.toFixed(plan.price % 1 === 0 ? 0 : 1)}
              <span className="text-sm font-normal text-gray-400"> / mo</span>
            </span>
          </div>
        </div>

        {/* Payment form */}
        <form onSubmit={handlePay} className="px-7 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-3 py-2.5 rounded-lg break-words">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            {loading ? 'Processing…' : `Pay KD ${plan.price.toFixed(plan.price % 1 === 0 ? 0 : 1)}`}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-1">
            <Lock size={11} /> Secured payment · test mode
          </p>
        </form>
      </div>
    </div>
  )
}

export default function Checkout() {
  return (
    <div className="p-6">
      <Suspense fallback={<div className="w-[460px] mx-auto py-20 text-center text-gray-400">Loading…</div>}>
        <CheckoutInner />
      </Suspense>
    </div>
  )
}
