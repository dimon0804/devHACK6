'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { formatBalanceNumber, toNumber } from '@/lib/utils'

export default function ReportsPage() {
  const router = useRouter()
  const [username, setUsername] = useState('Пользователь')
  const [transactions, setTransactions] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [userRes, txRes, goalsRes] = await Promise.all([
          api.get('/api/v1/users/me'),
          // progress-service ограничивает page_size до 100
          api.get('/api/v1/transactions', { params: { page: 1, page_size: 100 } }),
          api.get('/api/v1/savings/goals'),
        ])
        setUsername(userRes.data?.username || 'Пользователь')
        setTransactions(txRes.data?.transactions || [])
        setGoals(goalsRes.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const report = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Math.max(0, toNumber(tx.amount, 0)), 0)
    const expenses = transactions
      .filter((tx) => tx.type !== 'income')
      .reduce((sum, tx) => sum + Math.abs(toNumber(tx.amount, 0)), 0)
    const completedGoals = goals.filter((g) => g.completed).length
    return {
      income,
      expenses,
      txCount: transactions.length,
      savingsRate: income > 0 ? Math.max(0, Math.round(((income - expenses) / income) * 100)) : 0,
      completedGoals,
      totalGoals: goals.length,
    }
  }, [transactions, goals])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={18} className="mr-2" />
              Назад
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.print()}>
              <Download size={16} className="mr-2" />
              Экспорт в PDF
            </Button>
          </div>

          <Card className="print:shadow-none print:border-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10">
                <FileText className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Финансовый отчет FinTeen</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Пользователь: {username} | Дата: {new Date().toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500">Собираем данные...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card><div className="text-sm text-gray-500">Всего доходов</div><div className="text-2xl font-bold text-green-600">{formatBalanceNumber(report.income)} ₽</div></Card>
                <Card><div className="text-sm text-gray-500">Всего расходов</div><div className="text-2xl font-bold text-red-500">{formatBalanceNumber(report.expenses)} ₽</div></Card>
                <Card><div className="text-sm text-gray-500">Норма сбережений</div><div className="text-2xl font-bold">{report.savingsRate}%</div></Card>
                <Card><div className="text-sm text-gray-500">Достигнутые цели</div><div className="text-2xl font-bold">{report.completedGoals}/{report.totalGoals}</div></Card>
                <Card className="md:col-span-2">
                  <h3 className="font-semibold mb-2">Краткий вывод</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {report.savingsRate >= 20
                      ? 'Финансовое поведение устойчивое: ребенок сохраняет хороший баланс между расходами и накоплениями.'
                      : 'Рекомендуется усилить привычку накоплений и сократить импульсивные траты в ежедневных сценариях.'}
                  </p>
                </Card>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
