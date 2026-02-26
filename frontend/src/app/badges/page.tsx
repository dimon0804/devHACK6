'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, Award, CheckCircle } from 'lucide-react'

interface Badge {
  id: number
  name: string
  title: string
  description: string | null
  icon: string | null
}

export default function BadgesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [userBadges, setUserBadges] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const response = await api.get('/api/v1/badges')
      setBadges(response.data.badges || [])
      setUserBadges(response.data.user_badges || [])
    } catch (err) {
      console.error('Failed to fetch badges', err)
    } finally {
      setLoading(false)
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
              {t('common.backToDashboard')}
            </Button>

            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              {t('badges.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t('badges.subtitle')}
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                {t('common.loading')}
              </div>
            ) : badges.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">{t('badges.noBadges')}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge) => {
                  const isEarned = userBadges.includes(badge.id)

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className={`h-full ${
                          isEarned ? '' : 'opacity-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {isEarned ? (
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Award size={32} className="text-primary" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <Award size={32} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold">{badge.title}</h3>
                              {isEarned && (
                                <CheckCircle size={20} className="text-primary" />
                              )}
                            </div>
                            {badge.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {badge.description}
                              </p>
                            )}
                            <div className="mt-4">
                              {isEarned ? (
                                <BadgeComponent className="bg-primary/10 text-primary">
                                  {t('badges.earned')}
                                </BadgeComponent>
                              ) : (
                                <BadgeComponent className="bg-gray-200 dark:bg-gray-700 text-gray-500">
                                  {t('badges.notEarned')}
                                </BadgeComponent>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {badges.length > 0 && userBadges.length === 0 && (
              <Card className="mt-8 p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('badges.earnBadges')}
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
