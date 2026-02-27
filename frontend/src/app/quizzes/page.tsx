'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, Trophy, CheckCircle, Clock } from 'lucide-react'

interface Quiz {
  id: number
  title: string
  difficulty: string
  xp_reward: number
  description: string | null
}

interface QuizProgress {
  quiz_id: number
  completed: boolean
  score: number
}

export default function QuizzesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [progress, setProgress] = useState<Record<number, QuizProgress>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
    fetchProgress()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/api/v1/quizzes')
      setQuizzes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch quizzes', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await api.get('/api/v1/quizzes/progress')
      const progressMap: Record<number, QuizProgress> = {}
      response.data.forEach((p: QuizProgress) => {
        progressMap[p.quiz_id] = p
      })
      setProgress(progressMap)
    } catch (err) {
      console.error('Failed to fetch progress', err)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
      case 'hard':
        return 'bg-red-500/10 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              {t('quizzes.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t('quizzes.subtitle')}
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                {t('common.loading')}
              </div>
            ) : quizzes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">{t('quizzes.noQuizzes')}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => {
                  const quizProgress = progress[quiz.id]
                  const isCompleted = quizProgress?.completed || false
                  const score = quizProgress?.score || 0

                  return (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        hover
                        onClick={() => router.push(`/quizzes/${quiz.id}`)}
                        className="cursor-pointer h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                            {quiz.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                          {isCompleted && (
                            <CheckCircle size={24} className="text-primary flex-shrink-0 ml-2" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <Badge className={getDifficultyColor(quiz.difficulty)}>
                            {t(`quizzes.${quiz.difficulty}`)}
                          </Badge>
                          <Badge className="bg-primary/10 text-primary">
                            {quiz.xp_reward} {t('common.xp')}
                          </Badge>
                        </div>

                        {isCompleted && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {t('quizzes.score')}: {score}%
                            </div>
                          </div>
                        )}

                        <Button
                          variant={isCompleted ? 'secondary' : 'primary'}
                          size="sm"
                          className="w-full"
                        >
                          {isCompleted ? t('quizzes.continueQuiz') : t('quizzes.startQuiz')}
                        </Button>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
