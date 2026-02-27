'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Landmark, Shield, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { formatBalanceNumber } from '@/lib/utils'

const plans = {
  conservative: { key: 'planConservative' as const, rate: 6.5, riskKey: 'riskLow' as const },
  balanced: { key: 'planBalanced' as const, rate: 9.5, riskKey: 'riskMedium' as const },
  aggressive: { key: 'planAggressive' as const, rate: 13, riskKey: 'riskHigh' as const },
} as const

type PlanKey = keyof typeof plans

export default function DepositSimulatorPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [amount, setAmount] = useState(50000)
  const [months, setMonths] = useState(12)
  const [plan, setPlan] = useState<PlanKey>('balanced')

  const result = useMemo(() => {
    const monthlyRate = plans[plan].rate / 100 / 12
    const finalAmount = amount * Math.pow(1 + monthlyRate, months)
    const profit = finalAmount - amount
    return { finalAmount, profit, monthlyRate }
  }, [amount, months, plan])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            {t('common.back')}
          </Button>

          <Card glow className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Landmark className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t('deposit.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400">{t('deposit.subtitle')}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold mb-4">{t('deposit.paramsTitle')}</h3>

              <label className="block text-sm mb-2">
                {t('deposit.amountLabel', { amount: formatBalanceNumber(amount) })}
              </label>
              <input
                type="range"
                min={1000}
                max={500000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mb-4"
              />

              <label className="block text-sm mb-2">
                {t('deposit.termLabel', { months })}
              </label>
              <input
                type="range"
                min={1}
                max={36}
                step={1}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full mb-6"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(plans) as PlanKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setPlan(key)}
                    className={`rounded-xl px-3 py-2 text-left border transition break-words ${
                      plan === key ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-xs sm:text-sm leading-snug">
                      {t(`deposit.${plans[key].key}`)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">
                      {plans[key].rate}%
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">{t('deposit.resultTitle')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('deposit.profile')}</span>
                  <span className="font-semibold">{t(`deposit.${plans[plan].key}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('deposit.risk')}</span>
                  <span className="font-semibold">{t(`deposit.${plans[plan].riskKey}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('deposit.rate')}</span>
                  <span className="font-semibold">{plans[plan].rate}%</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('deposit.finalAmount')}</span>
                  <span className="font-bold text-primary">{formatBalanceNumber(result.finalAmount)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('deposit.profit')}</span>
                  <span className="font-bold text-green-600">+{formatBalanceNumber(result.profit)} ₽</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                  {t('deposit.disclaimer')}
                </p>
                <div className="mt-3 flex gap-2">
                  <Shield size={16} className="text-primary mt-0.5" />
                  <TrendingUp size={16} className="text-green-500 mt-0.5" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
