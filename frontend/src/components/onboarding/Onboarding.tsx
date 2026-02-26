'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Target, TrendingUp, Trophy, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: any
  action?: {
    label: string
    path: string
  }
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Добро пожаловать в FinTeen!',
    description: 'Это платформа для обучения финансовой грамотности. Здесь вы научитесь планировать бюджет, копить деньги и управлять финансами.',
    icon: Wallet,
  },
  {
    id: 2,
    title: 'Планирование бюджета',
    description: 'Создавайте планы бюджета, распределяйте доходы по категориям и учитесь управлять деньгами эффективно.',
    icon: Target,
    action: {
      label: 'Попробовать планирование',
      path: '/budget',
    },
  },
  {
    id: 3,
    title: 'Цели накоплений',
    description: 'Ставьте финансовые цели и копите на них. Получайте проценты и достигайте своих мечтаний!',
    icon: TrendingUp,
    action: {
      label: 'Создать цель',
      path: '/savings',
    },
  },
  {
    id: 4,
    title: 'Квесты и достижения',
    description: 'Выполняйте задания, получайте опыт и повышайте свой уровень. Чем больше вы учитесь, тем больше наград!',
    icon: Trophy,
    action: {
      label: 'Посмотреть квесты',
      path: '/quests',
    },
  },
]

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    localStorage.setItem('onboarding_completed', 'true')
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl mx-4"
        >
          <Card glow className="relative overflow-hidden">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Шаг {currentStep + 1} из {steps.length}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(((currentStep + 1) / steps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-primary-400"
                  />
                </div>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl"
                >
                  <Icon className="text-primary" size={48} />
                </motion.div>
              </div>

              {/* Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                  {step.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              {/* Action Button */}
              {step.action && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      window.location.href = step.action!.path
                      handleComplete()
                    }}
                  >
                    {step.action.label}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex-1"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Назад
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  {currentStep === steps.length - 1 ? 'Начать' : 'Далее'}
                  {currentStep < steps.length - 1 && <ArrowRight size={18} className="ml-2" />}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

