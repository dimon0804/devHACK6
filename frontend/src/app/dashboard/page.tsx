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
import { Moon, Sun, Globe, TrendingUp, Target, History, Trophy, BarChart3, Flame, Brain, Shield, Calendar, RefreshCw } from 'lucide-react'
import { formatBalanceNumber, toNumber } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import { Onboarding } from '@/components/onboarding/Onboarding'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

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
  const [transactions, setTransactions] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [questProgress, setQuestProgress] = useState<any[]>([])
  const [financialRating, setFinancialRating] = useState<any>({
    discipline: 0,
    stability: 0,
    riskTendency: 0,
    financialIQ: 0,
    profile: 'Новичок',
    profileDescription: 'Ты только начинаешь свой финансовый путь',
  })
  const [stats30Days, setStats30Days] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

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
    if (!onboardingCompleted) {
      setTimeout(() => {
        setShowOnboarding(true)
      }, 1000)
    }
  }, [isAuthenticated, router, logout])

  useEffect(() => {
    if (userData) {
      fetchFinancialData()
    }
  }, [userData])

  const fetchFinancialData = async () => {
    setLoadingStats(true)
    try {
      // Загружаем транзакции за последние 30 дней
      // API ограничивает page_size до 100, поэтому делаем несколько запросов если нужно
      let allTransactions: any[] = []
      let currentPage = 1
      const pageSize = 100
      let hasMore = true
      
      while (hasMore && currentPage <= 5) { // Максимум 5 страниц (500 транзакций)
        try {
          const response = await api.get('/api/v1/transactions', {
            params: { page: currentPage, page_size: pageSize }
          })
          const pageTransactions = response.data.transactions || []
          allTransactions = [...allTransactions, ...pageTransactions]
          
          // Если получили меньше чем pageSize, значит это последняя страница
          if (pageTransactions.length < pageSize) {
            hasMore = false
          } else {
            currentPage++
          }
        } catch (err) {
          console.error(`Error fetching transactions page ${currentPage}:`, err)
          hasMore = false
        }
      }
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentTransactions = allTransactions.filter((tx: any) => 
        new Date(tx.created_at) >= thirtyDaysAgo
      )
      setTransactions(recentTransactions)

      // Загружаем цели
      let loadedGoals: any[] = []
      try {
        const goalsResponse = await api.get('/api/v1/savings/goals')
        loadedGoals = goalsResponse.data || []
        setGoals(loadedGoals)
      } catch (err) {
        console.error('Failed to fetch goals', err)
      }

      // Загружаем прогресс квестов
      let loadedQuestProgress: any[] = []
      try {
        const questsResponse = await api.get('/api/v1/quests/progress')
        loadedQuestProgress = questsResponse.data || []
        setQuestProgress(loadedQuestProgress)
      } catch (err) {
        console.error('Failed to fetch quest progress', err)
      }

      // Рассчитываем финансовый рейтинг с использованием загруженных данных
      console.log('=== Financial Rating Calculation ===')
      console.log('Transactions:', recentTransactions.length, recentTransactions)
      console.log('Goals:', loadedGoals.length, loadedGoals)
      console.log('Quest Progress:', loadedQuestProgress.length, loadedQuestProgress)
      
      const rating = calculateFinancialRating(recentTransactions, loadedGoals, loadedQuestProgress)
      console.log('Calculated rating:', rating)
      console.log('====================================')
      setFinancialRating(rating || {
        discipline: 0,
        stability: 0,
        riskTendency: 0,
        financialIQ: 0,
        profile: 'Новичок',
        profileDescription: 'Ты только начинаешь свой финансовый путь',
      })

      // Рассчитываем статистику за 30 дней
      const stats = calculate30DayStats(recentTransactions, allTransactions, loadedGoals)
      setStats30Days(stats || {
        balanceHistory: [],
        savingsGrowth: 0,
        currentSavings: 0,
        income30Days: 0,
        incomePrevious: 0,
        expense30Days: 0,
        expensePrevious: 0,
        incomeChange: 0,
        expenseChange: 0,
        streak: 0,
      })
    } catch (err) {
      console.error('Failed to fetch financial data', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const calculateFinancialRating = (transactions: any[], goals: any[], questProgress: any[]) => {
    // 1. Дисциплина (процент накоплений от дохода)
    const incomeTransactions = transactions.filter(t => t.type === 'income')
    const totalIncome = incomeTransactions
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    console.log('Discipline calculation:')
    console.log('  Income transactions:', incomeTransactions.length, incomeTransactions)
    console.log('  Total income:', totalIncome)
    
    const totalSavings = goals.reduce((sum, goal) => 
      sum + toNumber(goal.current_amount, 0), 0
    )
    
    const savingsDepositTransactions = transactions.filter(t => t.type === 'savings_deposit')
    const savingsDeposits = savingsDepositTransactions
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    console.log('  Total savings from goals:', totalSavings)
    console.log('  Savings deposits:', savingsDeposits, savingsDepositTransactions)
    
    const discipline = totalIncome > 0 
      ? Math.min(100, ((totalSavings + savingsDeposits) / totalIncome) * 100)
      : 0
    
    console.log('  Discipline result:', discipline, '%')

    // 2. Стабильность (регулярность транзакций)
    const transactionDates = transactions.map(t => {
      const date = new Date(t.created_at)
      return date.toDateString()
    })
    const uniqueDays = new Set(transactionDates).size
    const stability = Math.min(100, (uniqueDays / 30) * 100)
    
    console.log('Stability calculation:')
    console.log('  Unique days:', uniqueDays, 'out of 30')
    console.log('  Stability result:', stability, '%')

    // 3. Склонность к риску (на основе категорий)
    const entertainmentCategories = ['развлечения', 'entertainment', 'игры', 'хобби', 'отдых']
    const expenseTransactions = transactions.filter(t => t.type === 'expense')
    const totalExpenses = expenseTransactions
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const entertainmentExpenses = expenseTransactions
      .filter(t => {
        const desc = (t.description || '').toLowerCase()
        const matches = entertainmentCategories.some(cat => desc.includes(cat))
        if (matches) console.log('  Entertainment expense found:', desc, t.amount)
        return matches
      })
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const riskTendency = totalExpenses > 0 
      ? (entertainmentExpenses / totalExpenses) * 100
      : 0
    
    console.log('Risk calculation:')
    console.log('  Total expenses:', totalExpenses, expenseTransactions)
    console.log('  Entertainment expenses:', entertainmentExpenses)
    console.log('  Risk result:', riskTendency, '%')

    // 4. Финансовый IQ (на основе квестов)
    const completedQuests = questProgress.filter(q => q.completed).length
    const totalQuests = questProgress.length
    const financialIQ = totalQuests > 0 
      ? (completedQuests / totalQuests) * 100
      : 0
    
    console.log('Financial IQ calculation:')
    console.log('  Quest progress:', questProgress)
    console.log('  Completed:', completedQuests, 'Total:', totalQuests)
    console.log('  Financial IQ result:', financialIQ, '%')

    // Определяем профиль
    let profile = 'Новичок'
    let profileDescription = 'Ты только начинаешь свой финансовый путь'
    
    if (discipline >= 20 && stability >= 50 && financialIQ >= 50) {
      profile = 'Стратег'
      profileDescription = 'Ты отлично планируешь и контролируешь свои финансы'
    } else if (riskTendency > 40 && discipline < 15) {
      profile = 'Импульсивный'
      profileDescription = 'Ты склонен к спонтанным тратам, попробуй больше планировать'
    } else if (discipline >= 15 && financialIQ >= 40) {
      profile = 'Инвестор'
      profileDescription = 'Ты понимаешь важность накоплений и инвестиций'
    } else if (stability >= 60) {
      profile = 'Стабильный'
      profileDescription = 'Ты регулярно управляешь финансами'
    }

    return {
      discipline: Math.round(discipline),
      stability: Math.round(stability),
      riskTendency: Math.round(riskTendency),
      financialIQ: Math.round(financialIQ),
      profile,
      profileDescription,
    }
  }

  const calculate30DayStats = (recentTransactions: any[], allTransactions: any[], goals: any[]) => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date(now)
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Транзакции за последние 30 дней
    const last30Days = recentTransactions.filter(t => 
      new Date(t.created_at) >= thirtyDaysAgo
    )

    // Транзакции за предыдущие 30 дней (31-60 дней назад)
    const previous30Days = allTransactions.filter(t => {
      const date = new Date(t.created_at)
      return date >= sixtyDaysAgo && date < thirtyDaysAgo
    })

    // График динамики баланса (по дням)
    // Сначала находим начальный баланс (30 дней назад)
    const sortedTransactions = [...last30Days].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    // Начальный баланс = текущий баланс - все изменения за 30 дней
    let initialBalance = userData?.balance || 0
    sortedTransactions.forEach(t => {
      if (t.type === 'income') {
        initialBalance -= Math.abs(toNumber(t.amount, 0))
      } else if (t.type === 'expense' || t.type === 'savings_deposit') {
        initialBalance += Math.abs(toNumber(t.amount, 0))
      }
    })

    const balanceHistory: any[] = []
    let runningBalance = initialBalance
    
    // Идем от 30 дней назад до сегодня
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      date.setHours(0, 0, 0, 0)
      
      const dayTransactions = sortedTransactions.filter(t => {
        const txDate = new Date(t.created_at)
        txDate.setHours(0, 0, 0, 0)
        return txDate.getTime() === date.getTime()
      })

      dayTransactions.forEach(t => {
        if (t.type === 'income') {
          runningBalance += Math.abs(toNumber(t.amount, 0))
        } else if (t.type === 'expense' || t.type === 'savings_deposit') {
          runningBalance -= Math.abs(toNumber(t.amount, 0))
        }
      })

      balanceHistory.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        balance: Math.max(0, runningBalance), // Не показываем отрицательный баланс
      })
    }

    // Рост накоплений
    const currentSavings = goals.reduce((sum, goal) => 
      sum + toNumber(goal.current_amount, 0), 0
    )
    
    const savingsDeposits30Days = last30Days
      .filter(t => t.type === 'savings_deposit')
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const savingsDepositsPrevious = previous30Days
      .filter(t => t.type === 'savings_deposit')
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const savingsGrowth = savingsDepositsPrevious > 0
      ? ((savingsDeposits30Days - savingsDepositsPrevious) / savingsDepositsPrevious) * 100
      : savingsDeposits30Days > 0 ? 100 : 0

    // Сравнение с прошлым периодом
    const income30Days = last30Days
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const incomePrevious = previous30Days
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const expense30Days = last30Days
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    
    const expensePrevious = previous30Days
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)

    // Streak (дни активности подряд)
    const activityDates = new Set(
      last30Days.map(t => {
        const date = new Date(t.created_at)
        return date.toDateString()
      })
    )
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      if (activityDates.has(checkDate.toDateString())) {
        streak++
      } else {
        break
      }
    }

    return {
      balanceHistory,
      savingsGrowth: Math.round(savingsGrowth),
      currentSavings,
      income30Days,
      incomePrevious,
      expense30Days,
      expensePrevious,
      incomeChange: incomePrevious > 0 
        ? ((income30Days - incomePrevious) / incomePrevious) * 100 
        : income30Days > 0 ? 100 : 0,
      expenseChange: expensePrevious > 0
        ? ((expense30Days - expensePrevious) / expensePrevious) * 100
        : expense30Days > 0 ? 100 : 0,
      streak,
    }
  }

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

          {/* Финансовый рейтинг */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card glow className="bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-primary" size={24} />
                  <h2 className="text-2xl font-bold">Финансовый профиль</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchFinancialData()}
                  title="Обновить данные"
                >
                  <RefreshCw size={18} />
                </Button>
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <>
                {/* Профиль пользователя */}
                <div className="mb-6 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">Твой профиль: {financialRating.profile}</h3>
                    <Badge variant="success" className="text-sm">
                      {financialRating.profile}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {financialRating.profileDescription}
                  </p>
                </div>

                {/* Метрики */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-green-500" size={18} />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Дисциплина
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {financialRating.discipline}%
                    </div>
                    <ProgressBar 
                      value={financialRating.discipline} 
                      max={100} 
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Накопления от дохода
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-blue-500" size={18} />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Стабильность
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {financialRating.stability}%
                    </div>
                    <ProgressBar 
                      value={financialRating.stability} 
                      max={100} 
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Регулярность активности
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-orange-500" size={18} />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Риск
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {financialRating.riskTendency}%
                    </div>
                    <ProgressBar 
                      value={financialRating.riskTendency} 
                      max={100} 
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Склонность к риску
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="text-purple-500" size={18} />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Финансовый IQ
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {financialRating.financialIQ}%
                    </div>
                    <ProgressBar 
                      value={financialRating.financialIQ} 
                      max={100} 
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      По квестам
                    </p>
                  </div>
                </div>
                </>
              )}
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            <Card hover onClick={() => router.push('/quizzes')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-yellow-500/10 rounded-xl">
                      <Trophy className="text-yellow-600 dark:text-yellow-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{t('quizzes.title')}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t('quizzes.subtitle')}
                  </p>
                  <Button variant="secondary" size="sm" className="group-hover:scale-105 transition-transform">
                    {t('quizzes.startQuiz')}
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

          {/* Education Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card hover onClick={() => router.push('/guided')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Target className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{t('guided.title')}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t('guided.subtitle')}
                  </p>
                  <Button variant="secondary" size="sm" className="group-hover:scale-105 transition-transform">
                    {t('guided.startGuidedMode')}
                  </Button>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => router.push('/badges')} className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <Trophy className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{t('badges.title')}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {t('badges.subtitle')}
                  </p>
                  <Button variant="secondary" size="sm" className="group-hover:scale-105 transition-transform">
                    {t('badges.viewBadges')}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* Статистика за 30 дней */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card glow>
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Статистика за 30 дней</h2>
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : stats30Days ? (
                <>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* График динамики баланса */}
                  <div className="lg:col-span-2 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Динамика баланса</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stats30Days.balanceHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => [`${formatBalanceNumber(value)} ₽`, 'Баланс']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#50B848" 
                          strokeWidth={2}
                          dot={{ fill: '#50B848', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Рост накоплений */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                      <h3 className="text-lg font-semibold">Рост накоплений</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {stats30Days.savingsGrowth > 0 ? '+' : ''}{stats30Days.savingsGrowth}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Текущие накопления: {formatBalanceNumber(stats30Days.currentSavings)} ₽
                    </p>
                  </Card>

                  {/* Streak */}
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="text-orange-600 dark:text-orange-400" size={20} />
                      <h3 className="text-lg font-semibold">Дни активности</h3>
                    </div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {stats30Days.streak} {stats30Days.streak === 1 ? 'день' : stats30Days.streak < 5 ? 'дня' : 'дней'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Подряд активен
                    </p>
                  </Card>
                </div>

                {/* Сравнение с прошлым периодом */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card className="bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Доходы
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">
                        {formatBalanceNumber(stats30Days.income30Days)} ₽
                      </span>
                      <span className={`text-sm font-semibold ${
                        stats30Days.incomeChange >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stats30Days.incomeChange >= 0 ? '+' : ''}{stats30Days.incomeChange.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      За предыдущий период: {formatBalanceNumber(stats30Days.incomePrevious)} ₽
                    </p>
                  </Card>

                  <Card className="bg-red-50 dark:bg-red-900/20">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Расходы
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">
                        {formatBalanceNumber(stats30Days.expense30Days)} ₽
                      </span>
                      <span className={`text-sm font-semibold ${
                        stats30Days.expenseChange <= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stats30Days.expenseChange >= 0 ? '+' : ''}{stats30Days.expenseChange.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      За предыдущий период: {formatBalanceNumber(stats30Days.expensePrevious)} ₽
                    </p>
                  </Card>
                </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Недостаточно данных
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Для отображения статистики за 30 дней необходимо создать транзакции.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Попробуйте получить доход или создать цель накоплений
                  </p>
                </div>
              )}
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

              // Обновляем финансовые данные после получения дохода
              await fetchFinancialData()

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
