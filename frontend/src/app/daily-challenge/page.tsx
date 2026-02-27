'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, Target, CheckCircle, Flame, Gift } from 'lucide-react'

interface DailyChallenge {
  id: number
  title: string
  description: string
  challenge_date: string
  xp_reward: number
  condition: string
  condition_value: string | null
}

interface UserProgress {
  id: number
  user_id: number
  challenge_id: number
  completed: boolean
  completed_at: string | null
  challenge: DailyChallenge
}

export default function DailyChallengePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayChallenge()
  }, [])

  const fetchTodayChallenge = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/daily-challenges/today')
      setChallenge(response.data.challenge)
      setUserProgress(response.data.user_progress)
    } catch (err) {
      console.error('Failed to fetch daily challenge', err)
    } finally {
      setLoading(false)
    }
  }

  const getActionButton = () => {
    if (!challenge) return null

    if (userProgress?.completed) {
      return (
        <Button variant="success" disabled className="w-full">
          <CheckCircle size={18} className="mr-2" />
          Задание выполнено!
        </Button>
      )
    }

    switch (challenge.condition) {
      case 'save_percentage':
        return (
          <Button
            variant="primary"
            onClick={() => router.push('/savings')}
            className="w-full"
          >
            Пополнить цель
          </Button>
        )
      case 'create_category':
        return (
          <Button
            variant="primary"
            onClick={() => router.push('/budget')}
            className="w-full"
          >
            Создать категорию
          </Button>
        )
      case 'deposit_to_goal':
        return (
          <Button
            variant="primary"
            onClick={() => router.push('/savings')}
            className="w-full"
          >
            Пополнить цель
          </Button>
        )
      case 'create_budget':
        return (
          <Button
            variant="primary"
            onClick={() => router.push('/budget')}
            className="w-full"
          >
            Спланировать бюджет
          </Button>
        )
      case 'complete_quiz':
        return (
          <Button
            variant="primary"
            onClick={() => router.push('/quizzes')}
            className="w-full"
          >
            Пройти квиз
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="mb-6"
            >
              <ArrowLeft size={18} className="mr-2" />
              {t('common.back')}
            </Button>

            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              Ежедневное задание
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Выполняйте ежедневные задания и получайте XP
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                {t('common.loading')}
              </div>
            ) : challenge ? (
              <Card glow className="bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Target className="text-primary" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{challenge.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(challenge.challenge_date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  {challenge.description}
                </p>

                <div className="flex items-center gap-2 mb-6 p-4 bg-secondary/10 rounded-xl">
                  <Gift className="text-secondary" size={20} />
                  <span className="font-semibold">Награда:</span>
                  <span className="text-primary font-bold text-xl">
                    +{challenge.xp_reward} XP
                  </span>
                </div>

                {userProgress?.completed && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle size={20} />
                      <span className="font-semibold">
                        Задание выполнено! Вы получили {challenge.xp_reward} XP
                      </span>
                    </div>
                    {userProgress.completed_at && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Выполнено:{' '}
                        {new Date(userProgress.completed_at).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                )}

                {getActionButton()}
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">
                  На сегодня заданий нет. Загляните завтра!
                </p>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
