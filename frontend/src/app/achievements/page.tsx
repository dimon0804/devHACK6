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
import { ArrowLeft, Trophy, Lock, CheckCircle } from 'lucide-react'

interface Achievement {
  id: number
  title: string
  description: string
  icon: string | null
  condition: any
}

export default function AchievementsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/achievements')
      setAchievements(response.data.achievements || [])
      setUserAchievements(response.data.user_achievements || [])
    } catch (err) {
      console.error('Failed to fetch achievements', err)
    } finally {
      setLoading(false)
    }
  }

  const isUnlocked = (achievementId: number) => {
    return userAchievements.includes(achievementId)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Достижения
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Отслеживайте свой прогресс и получайте награды за достижения
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                {t('common.loading')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const unlocked = isUnlocked(achievement.id)
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: achievement.id * 0.1 }}
                    >
                      <Card
                        className={`relative overflow-hidden ${
                          unlocked
                            ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30'
                            : 'opacity-60'
                        }`}
                      >
                        {unlocked && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle className="text-primary" size={24} />
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">
                            {achievement.icon || '🏆'}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">
                              {achievement.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {achievement.description}
                            </p>
                            {unlocked ? (
                              <Badge variant="success" className="text-xs">
                                Получено
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Lock size={12} className="mr-1" />
                                Заблокировано
                              </Badge>
                            )}
                          </div>
                        </div>
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
