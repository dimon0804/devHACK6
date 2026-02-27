'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(true)
  const [childName, setChildName] = useState('Ребенок')
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

        setChildName(userRes.data?.username || 'Ребенок')
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

    const disciplineScore = income > 0 ? Math.min(100, Math.round((1 - expenses / income) * 100)) : 0
    const riskScore = income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : 0

    return { income, expenses, completedGoals, totalGoals, goalsProgress, quizDone, disciplineScore, riskScore }
  }, [transactions, goals, quizProgress])

  const recommendations = useMemo(() => {
    const tips: string[] = []
    if (stats.riskScore > 75) tips.push('Высокая доля трат. Рекомендуем лимиты по категориям и правило 20% на накопления.')
    if (stats.goalsProgress < 40) tips.push('Мало завершенных целей. Попробуйте ставить небольшие и короткие цели.')
    if (stats.quizDone < 3) tips.push('Пройдено мало квизов. Добавьте 1-2 квиза в неделю для роста финансового IQ.')
    if (tips.length === 0) tips.push('Отличная динамика. Можно переходить к более сложным сценариям бюджета и вклада.')
    return tips
  }, [stats])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Назад
          </Button>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                <Shield className="text-blue-500" size={28} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Родительский режим</h1>
                <p className="text-gray-600 dark:text-gray-400">Контроль прогресса: {childName}</p>
              </div>
            </div>

            {loading ? (
              <Card className="py-10 text-center text-gray-500">Загрузка данных...</Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card><div className="text-sm text-gray-500">Доход</div><div className="text-2xl font-bold text-green-600">{formatBalanceNumber(stats.income)} ₽</div></Card>
                  <Card><div className="text-sm text-gray-500">Расход</div><div className="text-2xl font-bold text-red-500">{formatBalanceNumber(stats.expenses)} ₽</div></Card>
                  <Card><div className="text-sm text-gray-500">Цели</div><div className="text-2xl font-bold">{stats.completedGoals}/{stats.totalGoals}</div></Card>
                  <Card><div className="text-sm text-gray-500">Квизы</div><div className="text-2xl font-bold">{stats.quizDone}</div></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp size={18} className="text-primary" />
                      Индикаторы поведения
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span>Дисциплина</span><span className="font-semibold">{stats.disciplineScore}%</span></div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-2 rounded-full bg-green-500" style={{ width: `${stats.disciplineScore}%` }} /></div>
                      <div className="flex justify-between text-sm"><span>Риск</span><span className="font-semibold">{stats.riskScore}%</span></div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-2 rounded-full bg-orange-500" style={{ width: `${stats.riskScore}%` }} /></div>
                      <div className="flex justify-between text-sm"><span>Прогресс целей</span><span className="font-semibold">{stats.goalsProgress}%</span></div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-2 rounded-full bg-primary" style={{ width: `${stats.goalsProgress}%` }} /></div>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-orange-500" />
                      Рекомендации родителю
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
