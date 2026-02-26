'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Footer } from '@/components/layout/Footer'
import { useTheme } from 'next-themes'
import { Moon, Sun, Globe, TrendingUp, Target, History, Trophy } from 'lucide-react'
import { formatBalanceNumber, toNumber } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import { Onboarding } from '@/components/onboarding/Onboarding'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { addToast } = useToastStore()
  const [userData, setUserData] = useState<{
    id: number
    email: string
    username: string
    level: number
    xp: number
    balance: number
  } | null>(
    user
      ? {
          ...user,
          balance: toNumber(user.balance, 0),
          level: toNumber(user.level, 1),
          xp: toNumber(user.xp, 0),
        }
      : null
  )
  const [loading, setLoading] = useState(true)
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeLoading, setIncomeLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await api.get('/api/v1/users/me')
        const data = response.data
        setUserData({
          ...data,
          balance: toNumber(data.balance, 0),
          level: toNumber(data.level, 1),
          xp: toNumber(data.xp, 0),
        })
      } catch {
        logout()
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
    
    // Check if onboarding should be shown
    const onboardingCompleted = localStorage.getItem('onboarding_completed')
    if (!onboardingCompleted && userData) {
      setShowOnboarding(true)
    }
  }, [isAuthenticated, router, logout, userData])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru'
    i18n.changeLanguage(newLang)
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

  if (!userData) return null

  const xp = toNumber(userData.xp, 0)
  const xpInLevel = xp % 100
  const xpToNextLevel = 100 - xpInLevel
  const levelProgress = (xpInLevel / 100) * 100

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    <main className="min-h-screen pb-12">
      {/* Navigation */}
      <nav className="glass border-b border-[var(--card-border)] sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                {t('common.fintechEducation')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('common.tagline')}
              </p>
            </motion.div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                title={i18n.language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              >
                <Globe size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                {t('common.logout')}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card glow className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      {t('dashboard.hello')}, {userData.username}! 👋
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('dashboard.welcomeBack')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <CircularProgress value={xpInLevel} max={100} size={100}>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userData.level}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.level')}</div>
                      </div>
                    </CircularProgress>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.xp')}</div>
                      <div className="text-2xl font-bold">{xp}</div>
                      <ProgressBar value={xpInLevel} max={100} className="mt-2 w-32" />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('common.xpToNextLevel', { count: xpToNextLevel })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Balance Card - Hero */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card glow className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t('dashboard.yourBalance')}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIncomeModalOpen(true)}
                  >
                    <span className="mr-1">₽</span>
                    Получить доход
                  </Button>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <AnimatedCounter
                    value={userData.balance}
                    duration={1.5}
                    className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent"
                  />
                  <span className="text-3xl md:text-4xl font-bold text-gray-700 dark:text-gray-300">{t('common.rubles')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp size={16} className="text-primary" />
                  <span>{t('dashboard.financialRating')}: Отличный</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card hover onClick={() => router.push('/budget')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Target className="text-primary" size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{t('dashboard.budgetPlanning')}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t('budget.startPlanning')}
                  </p>
                  <Button variant="primary" size="sm" className="group-hover:scale-105 transition-transform">
                    {t('common.startPlanning')}
                  </Button>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => router.push('/savings')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-secondary/20 rounded-xl">
                      <TrendingUp className="text-secondary-600 dark:text-secondary-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{t('dashboard.savingsGoals')}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t('savings.manageGoals')}
                  </p>
                  <Button variant="secondary" size="sm" className="group-hover:scale-105 transition-transform">
                    {t('common.manageGoals')}
                  </Button>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => router.push('/history')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <History className="text-primary" size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{t('dashboard.viewHistory')}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t('history.subtitle')}
                  </p>
                  <Button variant="primary" size="sm" className="group-hover:scale-105 transition-transform">
                    {t('history.title')}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quests Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card hover onClick={() => router.push('/quests')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-xl">
                    <Trophy className="text-yellow-500 dark:text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Квесты и достижения</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Выполняйте задания и получайте опыт
                    </p>
                  </div>
                </div>
                <Button variant="primary" size="sm" className="group-hover:scale-105 transition-transform">
                  Открыть квесты
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.balance')}</div>
              <div className="text-3xl font-bold">
                <AnimatedCounter value={userData.balance} prefix={t('common.rubles')} />
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.level')}</div>
              <div className="text-3xl font-bold text-primary">{userData.level}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.xp')}</div>
              <div className="text-3xl font-bold">{xp}</div>
              <ProgressBar value={xpInLevel} max={100} className="mt-3" />
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Модальное окно для получения дохода */}
      <Modal
        isOpen={incomeModalOpen}
        onClose={() => {
          setIncomeModalOpen(false)
          setIncomeAmount('')
        }}
        title="Получить доход"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const amount = parseFloat(incomeAmount)
            
            if (isNaN(amount) || amount <= 0) {
              addToast({
                message: 'Введите корректную сумму (больше 0)',
                type: 'error',
                duration: 3000,
              })
              return
            }

            setIncomeLoading(true)
            try {
              const response = await api.post('/api/v1/budget/income', { amount })
              
              // Обновляем данные пользователя
              const userResponse = await api.get('/api/v1/users/me')
              const data = userResponse.data
              setUserData({
                ...data,
                balance: toNumber(data.balance, 0),
                level: toNumber(data.level, 1),
                xp: toNumber(data.xp, 0),
              })

              addToast({
                message: `💰 Получен доход: ${formatBalanceNumber(amount)} ₽`,
                type: 'success',
                duration: 4000,
              })

              setIncomeModalOpen(false)
              setIncomeAmount('')
            } catch (err: any) {
              console.error('Failed to receive income', err)
              const errorMessage = err.response?.data?.detail || 'Не удалось получить доход. Попробуйте еще раз.'
              addToast({
                message: errorMessage,
                type: 'error',
                duration: 4000,
              })
            } finally {
              setIncomeLoading(false)
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Сумма дохода (₽)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-lg">
                ₽
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={incomeLoading}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Введите сумму дохода, которую хотите добавить на баланс
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={incomeLoading || !incomeAmount || parseFloat(incomeAmount) <= 0}
            >
              {incomeLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Обработка...
                </>
              ) : (
                <>
                  <span className="mr-1">₽</span>
                  Получить доход
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIncomeModalOpen(false)
                setIncomeAmount('')
              }}
              disabled={incomeLoading}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </main>
    </>
  )
}
