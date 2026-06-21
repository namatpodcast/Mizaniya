'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, X, Loader2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface StatusResult {
  status: string
  invoice_id: number | null
  amount: number | null
  currency: string | null
  customer: string | null
  reference: string | null
}

function SuccessInner() {
  const params = useSearchParams()
  const paymentId = params.get('paymentId')

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<StatusResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentId) { setError('No payment reference found.'); setLoading(false); return }
    const verify = async () => {
      const { data, error } = await supabase.functions.invoke('payment-status', {
        body: { paymentId },
      })
      setLoading(false)
      if (error || data?.error) {
        let msg = data?.error ?? error?.message ?? 'Could not verify payment.'
        const ctx = (error as { context?: Response } | null)?.context
        if (ctx && typeof ctx.json === 'function') {
          try { const b = await ctx.json(); msg = b?.error ?? msg } catch { /* keep */ }
        }
        setError(msg)
        return
      }
      setResult(data as StatusResult)
    }
    verify()
  }, [paymentId])

  const isPaid = result?.status === 'Paid'

  return (
    <div className="w-[460px] mx-auto py-16">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center">
        {loading ? (
          <>
            <Loader2 size={32} className="text-indigo-500 animate-spin mx-auto mb-5" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirming your payment…</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Verifying with the payment gateway.</p>
          </>
        ) : error ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
              <X size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Couldn&rsquo;t verify payment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 break-words">{error}</p>
            <Link href="/plans" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Back to plans
            </Link>
          </>
        ) : isPaid ? (
          <>
            <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payment approved</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your subscription is now active. Thank you!</p>

            <div className="mt-6 text-left bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <Row label="Status" value={result!.status} valueClass="text-teal-600 dark:text-teal-400 font-semibold" />
              {result!.invoice_id && <Row label="Invoice" value={`#${result!.invoice_id}`} />}
              {result!.currency && <Row label="Amount" value={result!.currency} />}
              {result!.customer && <Row label="Customer" value={result!.customer} />}
            </div>

            <Link href="/dashboard" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5">
              <Clock size={28} className="text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payment {result?.status?.toLowerCase() ?? 'incomplete'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This payment wasn&rsquo;t completed. You can try again.
            </p>
            <Link href="/plans" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
              Back to plans
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-gray-900 dark:text-gray-100' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <div className="p-6">
      <Suspense fallback={<div className="w-[460px] mx-auto py-20 text-center text-gray-400">Loading…</div>}>
        <SuccessInner />
      </Suspense>
    </div>
  )
}
