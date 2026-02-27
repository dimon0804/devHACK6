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
import { ArrowLeft, Trophy, Lock, CheckCircle, Sparkles } from 'lucide-react'

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

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl">
                <Trophy className="text-primary" size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                  Достижения
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Отслеживайте свой прогресс и получайте награды
                </p>
              </div>
            </div>
            
            {achievements.length > 0 && (
              <div className="mb-8 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="text-primary" size={16} />
                  <span className="text-gray-700 dark:text-gray-300">
                    Получено: <strong className="text-primary">{userAchievements.length}</strong> из <strong>{achievements.length}</strong> достижений
                  </span>
                </div>
              </div>
            )}

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
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card
                        className={`relative overflow-hidden transition-all duration-300 ${
                          unlocked
                            ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20'
                            : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 opacity-75 grayscale-[0.3]'
                        }`}
                      >
                        {unlocked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 z-10"
                          >
                            <div className="p-2 bg-primary/20 rounded-full backdrop-blur-sm">
                              <CheckCircle className="text-primary" size={20} />
                            </div>
                          </motion.div>
                        )}
                        {!unlocked && (
                          <div className="absolute top-4 right-4 z-10">
                            <div className="p-2 bg-gray-700/50 rounded-full backdrop-blur-sm">
                              <Lock className="text-gray-500" size={20} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`text-5xl transition-transform duration-300 ${
                            unlocked ? 'scale-100' : 'scale-90 opacity-60'
                          }`}>
                            {achievement.icon || '🏆'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-xl font-bold mb-2 ${
                              unlocked 
                                ? 'text-gray-900 dark:text-gray-100' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {achievement.title}
                            </h3>
                            <p className={`text-sm mb-4 leading-relaxed ${
                              unlocked
                                ? 'text-gray-600 dark:text-gray-300'
                                : 'text-gray-500 dark:text-gray-500'
                            }`}>
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2">
                              {unlocked ? (
                                <Badge variant="success" className="text-xs px-3 py-1.5">
                                  <CheckCircle size={14} className="mr-1.5" />
                                  Получено
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-xs px-3 py-1.5 bg-gray-700/50 text-gray-400 border-gray-600/50">
                                  <Lock size={14} className="mr-1.5" />
                                  Заблокировано
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {unlocked && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary-400"
                          />
                        )}
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
