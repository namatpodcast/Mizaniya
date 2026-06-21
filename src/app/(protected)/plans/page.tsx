'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Crown, Zap } from 'lucide-react'

type PlanId = 'free' | 'pro' | 'premium'

interface Plan {
  id: PlanId
  name: string
  price: number
  tagline: string
  icon: typeof Zap
  accent: string
  features: string[]
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: 'For getting started',
    icon: Zap,
    accent: 'text-gray-500',
    features: [
      'Up to 50 transactions / month',
      '3 custom categories',
      'Basic dashboard',
      'Manual entry only',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2.5,
    tagline: 'For everyday budgeting',
    icon: Sparkles,
    accent: 'text-indigo-500',
    highlighted: true,
    features: [
      'Unlimited transactions',
      'Unlimited categories',
      'Advanced charts & reports',
      'AI duration estimates',
      'File & receipt attachments',
      'Recurring transactions',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 6.0,
    tagline: 'For power users & families',
    icon: Crown,
    accent: 'text-amber-500',
    features: [
      'Everything in Pro',
      'Shared family budgets',
      'Bank sync (beta)',
      'Export to Excel & PDF',
      'Priority support',
      'Early access to new features',
    ],
  },
]

// Demo: the user's current plan. In a real app this would come from the DB.
const CURRENT_PLAN: PlanId = 'free'

export default function Plans() {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const priceFor = (monthly: number) =>
    billing === 'yearly' ? monthly * 10 : monthly // 2 months free yearly

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Upgrade your plan</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Choose the plan that fits how you budget. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 mt-5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              billing === 'monthly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              billing === 'yearly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Yearly
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
              2 months free
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrent = plan.id === CURRENT_PLAN
          const price = priceFor(plan.price)

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 shadow-lg md:scale-[1.03]'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-600 text-white">
                  Most popular
                </span>
              )}

              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                plan.highlighted ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-800'
              }`}>
                <Icon size={22} className={plan.accent} />
              </div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{plan.tagline}</p>

              <div className="mt-4 mb-5">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {price === 0 ? 'Free' : `KD ${price.toFixed(price % 1 === 0 ? 0 : 1)}`}
                </span>
                {price !== 0 && (
                  <span className="text-sm text-gray-400 dark:text-gray-500"> / {billing === 'yearly' ? 'year' : 'month'}</span>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={16} className={`shrink-0 mt-0.5 ${plan.highlighted ? 'text-indigo-500' : 'text-teal-500'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                onClick={() => router.push(`/checkout?plan=${plan.id}`)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-default'
                    : plan.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {isCurrent ? 'Current plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
        Prices in Kuwaiti Dinar. This is a demo pricing page — no payment is processed.
      </p>
    </div>
  )
}
