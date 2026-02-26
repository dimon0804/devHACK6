'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, CheckCircle, Lock, ArrowRight } from 'lucide-react'

interface Step {
  id: number
  title: string
  description: string
  action: string
  completed: boolean
  locked: boolean
}

export default function GuidedModePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSteps()
  }, [])

  const fetchSteps = async () => {
    try {
      const response = await api.get('/api/v1/guided/steps')
      setSteps(response.data.steps || [])
    } catch (err) {
      console.error('Failed to fetch steps', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStepClick = (step: Step) => {
    if (step.locked) return

    switch (step.action) {
      case 'create_budget':
        router.push('/budget')
        break
      case 'create_goal':
        router.push('/savings')
        break
      case 'complete_quiz':
        router.push('/quizzes/1')
        break
      default:
        break
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
              {t('common.backToDashboard')}
            </Button>

            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              {t('guided.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t('guided.subtitle')}
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                {t('common.loading')}
              </div>
            ) : steps.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">{t('guided.noSteps')}</p>
                <Button variant="primary" onClick={() => router.push('/dashboard')}>
                  {t('common.backToDashboard')}
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      hover={!step.locked}
                      onClick={() => handleStepClick(step)}
                      className={`cursor-pointer ${
                        step.locked ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {step.completed ? (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle size={24} className="text-primary" />
                            </div>
                          ) : step.locked ? (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Lock size={24} className="text-gray-500" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">{step.id}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {step.description}
                          </p>
                          {!step.locked && (
                            <Button
                              variant={step.completed ? 'secondary' : 'primary'}
                              size="sm"
                            >
                              {step.completed
                                ? t('guided.markComplete')
                                : t('guided.goToStep')}
                              <ArrowRight size={16} className="ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
