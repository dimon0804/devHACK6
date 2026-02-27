'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { formatBalanceNumber, toNumber } from '@/lib/utils'

type Tx = {
  type: string
  amount: number | string
  created_at: string
}

type Goal = {
  completed: boolean
  current_amount: number | string
  target_amount: number | string
}

export default function ParentModePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [childName, setChildName] = useState('')
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [quizProgress, setQuizProgress] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [userRes, txRes, goalsRes] = await Promise.all([
          api.get('/api/v1/users/me'),
          api.get('/api/v1/transactions', { params: { page: 1, page_size: 100 } }),
          api.get('/api/v1/savings/goals'),
        ])

        setChildName(userRes.data?.username || '')
        setTransactions(txRes.data?.transactions || [])
        setGoals(goalsRes.data || [])

        try {
          const quizRes = await api.get('/api/v1/quizzes/progress')
          setQuizProgress(quizRes.data || [])
        } catch {
          setQuizProgress([])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const stats = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Math.max(0, toNumber(tx.amount, 0)), 0)

    const expenses = transactions
      .filter((tx) => tx.type !== 'income')
      .reduce((sum, tx) => sum + Math.abs(toNumber(tx.amount, 0)), 0)

    const completedGoals = goals.filter((g) => g.completed).length
    const totalGoals = goals.length
    const goalsProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    const quizDone = quizProgress.filter((q) => q.completed).length
 
    const disciplineRaw = income > 0 ? (1 - expenses / income) * 100 : 0
    const riskRaw = income > 0 ? (expenses / income) * 100 : 0
    const disciplineScore = Math.min(100, Math.max(0, Math.round(disciplineRaw)))
    const riskScore = Math.min(100, Math.max(0, Math.round(riskRaw)))

    return { income, expenses, completedGoals, totalGoals, goalsProgress, quizDone, disciplineScore, riskScore }
  }, [transactions, goals, quizProgress])

  const recommendations = useMemo(() => {
    const tips: string[] = []
    if (stats.riskScore > 75) tips.push(t('parentMode.recHighRisk'))
    if (stats.goalsProgress < 40) tips.push(t('parentMode.recLowGoals'))
    if (stats.quizDone < 3) tips.push(t('parentMode.recLowQuizzes'))
    if (tips.length === 0) tips.push(t('parentMode.recGood'))
    return tips
  }, [stats])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            {t('common.back')}
          </Button>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                <Shield className="text-blue-500" size={28} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{t('parentMode.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('parentMode.subtitle', { name: childName || t('common.username', { defaultValue: 'User' }) })}
                </p>
              </div>
            </div>

            {loading ? (
              <Card className="py-10 text-center text-gray-500">Загрузка данных...</Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <div className="text-sm text-gray-500">{t('parentMode.income')}</div>
                    <div className="text-2xl font-bold text-green-600">{formatBalanceNumber(stats.income)} ₽</div>
                  </Card>
                  <Card>
                    <div className="text-sm text-gray-500">{t('parentMode.expense')}</div>
                    <div className="text-2xl font-bold text-red-500">{formatBalanceNumber(stats.expenses)} ₽</div>
                  </Card>
                  <Card>
                    <div className="text-sm text-gray-500">{t('parentMode.goals')}</div>
                    <div className="text-2xl font-bold">
                      {stats.completedGoals}/{stats.totalGoals}
                    </div>
                  </Card>
                  <Card>
                    <div className="text-sm text-gray-500">{t('parentMode.quizzes')}</div>
                    <div className="text-2xl font-bold">{stats.quizDone}</div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp size={18} className="text-primary" />
                      {t('parentMode.indicatorsTitle')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{t('parentMode.discipline')}</span>
                        <span className="font-semibold">{stats.disciplineScore}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: `${stats.disciplineScore}%` }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('parentMode.risk')}</span>
                        <span className="font-semibold">{stats.riskScore}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-2 rounded-full bg-orange-500" style={{ width: `${stats.riskScore}%` }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('parentMode.goalsProgress')}</span>
                        <span className="font-semibold">{stats.goalsProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${stats.goalsProgress}%` }} />
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-orange-500" />
                      {t('parentMode.recommendationsTitle')}
                    </h3>
                    <ul className="space-y-3">
                      {recommendations.map((tip, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle size={16} className="text-primary mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
