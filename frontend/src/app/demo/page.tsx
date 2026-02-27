'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { Sparkles, CheckCircle, TrendingUp, Target, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function DemoPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [demoData, setDemoData] = useState<any>(null)

  useEffect(() => {
    // Load demo data from localStorage or generate
    const stored = localStorage.getItem('demo_data')
    if (stored) {
      setDemoData(JSON.parse(stored))
    }
  }, [])

  const createDemoAccount = async () => {
    setLoading(true)
    try {
      // Create demo user
      const timestamp = Date.now()
      const demoEmail = `demo_${timestamp}@example.com`
      const demoPassword = 'demo123456'
      const demoUsername = `DemoUser_${timestamp}`
      
      const registerResponse = await api.post('/api/v1/auth/register', {
        email: demoEmail,
        username: demoUsername,
        password: demoPassword,
      })

      const loginResponse = await api.post('/api/v1/auth/login', {
        email: demoEmail,
        password: demoPassword
      })

      const { access_token, refresh_token } = loginResponse.data

      // Сохраняем токены в authStore (автоматически кладёт в localStorage)
      setTokens(access_token, refresh_token)

      // Populate demo data
      await populateDemoData(access_token)

      // Подтягиваем профиль пользователя и сохраняем в store,
      // чтобы дашборд и другие экраны сразу показали корректные данные
      try {
        const meResponse = await api.get('/api/v1/users/me')
        setUser({
          id: meResponse.data.id,
          email: meResponse.data.email,
          username: meResponse.data.username,
          level: meResponse.data.level,
          xp: meResponse.data.xp,
          balance: meResponse.data.balance,
        })
      } catch (e) {
        console.error('Failed to fetch demo user profile', e)
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Failed to create demo account', err)
      alert('Ошибка создания демо-аккаунта. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const populateDemoData = async (token: string) => {
    try {
      // Set initial balance
      await api.post('/api/v1/users/balance', {
        amount: 50000
      })

      // Create budgets
      for (let i = 0; i < 5; i++) {
        await api.post('/api/v1/budget/plan', {
          income: 10000 + i * 1000,
          categories: [
            { name: 'Еда', amount: 3000 + i * 300 },
            { name: 'Развлечения', amount: 2000 + i * 200 },
            { name: 'Накопления', amount: 3000 + i * 300 },
            { name: 'Образование', amount: 2000 + i * 200 }
          ]
        })
      }

      // Create savings goals
      const goalResponses = []
      goalResponses.push(
        await api.post('/api/v1/savings/goals', {
          title: 'Новый велосипед',
          target_amount: 30000
        })
      )
      goalResponses.push(
        await api.post('/api/v1/savings/goals', {
          title: 'Планшет',
          target_amount: 25000
        })
      )

      const createdGoals = goalResponses.map((res) => res.data).filter(Boolean)

      // Make deposits в первую цель, если она есть
      if (createdGoals.length > 0 && createdGoals[0].id) {
        await api.post('/api/v1/savings/deposit', {
          goal_id: createdGoals[0].id,
          amount: 15000
        })
      }

      // Complete quizzes
      const quizzesResponse = await api.get('/api/v1/quizzes')
      const quizzes = quizzesResponse.data.quizzes || quizzesResponse.data || []
      
      for (const quiz of quizzes.slice(0, 3)) {
        const questionsResponse = await api.get(`/api/v1/quizzes/${quiz.id}/questions`)
        const questions = questionsResponse.data.questions || []
        
        const answers = questions.map((q: any) => ({
          question_id: q.id,
          answer: q.correct_answer
        }))

        await api.post(`/api/v1/quizzes/${quiz.id}/submit`, {
          answers
        })
      }

      // Add XP
      await api.post('/api/v1/users/xp', {
        xp: 500
      })

    } catch (err) {
      console.error('Failed to populate demo data', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-block p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-6">
              <Sparkles className="text-primary" size={48} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              Демо-режим FinTeen
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Ознакомьтесь с платформой на примере предзаполненного аккаунта
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <h3 className="text-xl font-bold">Предзаполненные данные</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Баланс: 50 000 ₽</li>
                <li>• 5 планов бюджета</li>
                <li>• 2 цели накоплений</li>
                <li>• 3 пройденных квиза</li>
                <li>• Уровень 5+</li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <h3 className="text-xl font-bold">Полная статистика</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• История транзакций</li>
                <li>• Графики доходов/расходов</li>
                <li>• Финансовый рейтинг</li>
                <li>• Достижения и бейджи</li>
                <li>• Прогресс по квизам</li>
              </ul>
            </Card>
          </div>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Что вы увидите:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Target className="text-primary mt-1" size={20} />
                <div>
                  <h4 className="font-semibold mb-1">Планирование бюджета</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Примеры сбалансированных и несбалансированных бюджетов
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trophy className="text-primary mt-1" size={20} />
                <div>
                  <h4 className="font-semibold mb-1">Достижения</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Полученные бейджи и достижения за активность
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="text-primary mt-1" size={20} />
                <div>
                  <h4 className="font-semibold mb-1">Аналитика</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Графики, статистика и финансовый профиль
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={createDemoAccount}
              disabled={loading}
              className="px-8 py-4 text-lg"
            >
              {loading ? 'Создание демо-аккаунта...' : 'Запустить демо-режим'}
            </Button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Будет создан временный аккаунт с предзаполненными данными
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
