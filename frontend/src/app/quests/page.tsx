'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Footer } from '@/components/layout/Footer'
import { Trophy, Target, Star, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

interface Quest {
  id: number
  title: string
  difficulty: string
  reward_xp: number
}

interface QuestProgress {
  id: number
  user_id: number
  quest_id: number
  completed: boolean
  score: number
}

export default function QuestsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { addToast } = useToastStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [progress, setProgress] = useState<QuestProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuests()
    fetchProgress()
  }, [])

  const fetchQuests = async () => {
    try {
      const response = await api.get('/api/v1/quests')
      setQuests(response.data || [])
    } catch (err) {
      console.error('Failed to fetch quests', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await api.get('/api/v1/quests/progress')
      setProgress(response.data || [])
    } catch (err) {
      console.error('Failed to fetch quest progress', err)
    }
  }

  const handleCompleteQuest = async (questId: number) => {
    try {
      await api.post('/api/v1/quests/progress', {
        quest_id: questId,
        score: 100,
      })
      
      const quest = quests.find(q => q.id === questId)
      addToast({
        message: `🎉 Квест "${quest?.title || ''}" выполнен! Получено ${quest?.reward_xp || 0} XP`,
        type: 'success',
        duration: 4000,
      })
      
      fetchProgress()
      // Обновляем данные пользователя для отображения нового XP
      const userResponse = await api.get('/api/v1/users/me')
      // Можно обновить store если нужно
    } catch (err: any) {
      console.error('Failed to complete quest', err)
      addToast({
        message: err.response?.data?.detail || 'Не удалось выполнить квест',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const getQuestProgress = (questId: number): QuestProgress | undefined => {
    return progress.find(p => p.quest_id === questId)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case 'легкий':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'medium':
      case 'средний':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'hard':
      case 'сложный':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case 'легкий':
        return <Star className="text-green-500" size={16} />
      case 'medium':
      case 'средний':
        return <Star className="text-yellow-500" size={16} />
      case 'hard':
      case 'сложный':
        return <Star className="text-red-500" size={16} />
      default:
        return <Star className="text-gray-500" size={16} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <main className="min-h-screen py-8 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft size={16} className="mr-2" />
            Назад на дашборд
          </Button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent flex items-center gap-3">
                <Trophy className="text-primary" size={36} />
                Квесты и достижения
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Выполняйте задания и получайте опыт для повышения уровня
              </p>
            </div>
          </div>

          {quests.length === 0 ? (
            <Card className="text-center py-12">
              <Target size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Квесты пока не доступны</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Скоро здесь появятся интересные задания!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {quests.map((quest, index) => {
                  const questProgress = getQuestProgress(quest.id)
                  const isCompleted = questProgress?.completed || false
                  
                  return (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover glow className="h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            {getDifficultyIcon(quest.difficulty)}
                            <Badge className={getDifficultyColor(quest.difficulty)}>
                              {quest.difficulty}
                            </Badge>
                          </div>
                          {isCompleted && (
                            <Badge variant="success">
                              <CheckCircle size={14} className="mr-1" />
                              Выполнено
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold mb-3">{quest.title}</h3>

                        <div className="flex-1 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Star className="text-yellow-500" size={16} />
                            <span>Награда: {quest.reward_xp} XP</span>
                          </div>
                        </div>

                        <Button
                          variant={isCompleted ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => handleCompleteQuest(quest.id)}
                          disabled={isCompleted}
                          className="w-full"
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Выполнено
                            </>
                          ) : (
                            <>
                              <Target size={16} className="mr-2" />
                              Выполнить
                            </>
                          )}
                        </Button>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </main>
  )
}

