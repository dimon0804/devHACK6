'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import api from '@/lib/api'
import {
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react'

export default function AdminPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [errorAnalytics, setErrorAnalytics] = useState<any>(null)
  const [scenarioAnalytics, setScenarioAnalytics] = useState<any>(null)
  const [adminToken, setAdminToken] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false)

  useEffect(() => {
    // Get admin token from localStorage
    const token = localStorage.getItem('admin_token') || ''
    setAdminToken(token)
    if (token) {
      fetchDashboardData(token)
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Пожалуйста, введите пароль')
      return
    }

    setIsAuthenticating(true)
    setError('')

    try {
      // Clean the password - remove all whitespace and ensure it's a string
      const cleanPassword = String(password).trim().replace(/\s+/g, '')
      
      console.log('[ADMIN] Attempting login with password length:', cleanPassword.length)
      console.log('[ADMIN] Password value:', JSON.stringify(cleanPassword))
      
      // Test the token by making a request
      const testRes = await api.get('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${cleanPassword}` },
      })

      // If successful, save token
      localStorage.setItem('admin_token', cleanPassword)
      setAdminToken(cleanPassword)
      setPassword('')
      await fetchDashboardData(cleanPassword)
    } catch (err: any) {
      console.error('Failed to authenticate', err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Неверный пароль. Попробуйте снова.')
      } else {
        setError('Ошибка подключения. Попробуйте позже.')
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setAdminToken('')
    setStats(null)
    setErrorAnalytics(null)
    setScenarioAnalytics(null)
    setPassword('')
    setError('')
  }

  const fetchDashboardData = async (token: string) => {
    setLoading(true)
    setError('')
    try {
      // Ensure token is clean
      const cleanToken = String(token).trim().replace(/\s+/g, '')
      
      const [dashboardRes, errorsRes, scenariosRes] = await Promise.all([
        api.get('/api/v1/admin/dashboard', {
          headers: { Authorization: `Bearer ${cleanToken}` },
        }),
        api.get('/api/v1/admin/analytics/errors', {
          headers: { Authorization: `Bearer ${cleanToken}` },
        }),
        api.get('/api/v1/admin/analytics/scenarios', {
          headers: { Authorization: `Bearer ${cleanToken}` },
        }),
      ])
      setStats(dashboardRes.data)
      setErrorAnalytics(errorsRes.data)
      setScenarioAnalytics(scenariosRes.data)
    } catch (err: any) {
      console.error('Failed to fetch admin data', err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Token expired or invalid, clear it
        localStorage.removeItem('admin_token')
        setAdminToken('')
        setError('Сессия истекла. Пожалуйста, войдите снова.')
      } else {
        setError('Ошибка загрузки данных. Попробуйте обновить страницу.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 w-full max-w-md">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="text-primary" size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">Админ-панель</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Введите пароль для доступа
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mb-4">
              Пароль по умолчанию: 123456
            </p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль администратора"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAuthenticating) {
                      handleLogin()
                    }
                  }}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isAuthenticating}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={handleLogin}
                disabled={isAuthenticating || !password.trim()}
              >
                {isAuthenticating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Проверка...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Админ-панель</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Аналитика и метрики платформы
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchDashboardData(adminToken)}
                disabled={loading}
              >
                <RefreshCw size={18} className="mr-2" />
                Обновить
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut size={18} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card glow>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                  <div className="text-2xl font-bold">
                    {stats?.users?.total_users || 0}
                  </div>
                </div>
              </div>
            </Card>

            <Card glow>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Target className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed Goals</div>
                  <div className="text-2xl font-bold">
                    {stats?.goals?.completed_goals || 0}
                  </div>
                </div>
              </div>
            </Card>

            <Card glow>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Award className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed Quizzes</div>
                  <div className="text-2xl font-bold">
                    {stats?.quizzes?.completed_quizzes || 0}
                  </div>
                </div>
              </div>
            </Card>

            <Card glow>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</div>
                  <div className="text-2xl font-bold">
                    {stats?.transactions?.total_transactions || 0}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Error Analytics */}
          {errorAnalytics && (
            <Card glow className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="text-orange-500" size={24} />
                <h2 className="text-2xl font-bold">Error Analytics</h2>
              </div>
              <div className="space-y-4">
                {errorAnalytics.errors_by_category && (
                  <div>
                    <h3 className="font-semibold mb-2">Errors by Category</h3>
                    <div className="space-y-2">
                      {Object.entries(errorAnalytics.errors_by_category).map(([category, count]: [string, any]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">{category}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errorAnalytics.quiz_errors && errorAnalytics.quiz_errors.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Quiz Errors</h3>
                    <div className="space-y-2">
                      {errorAnalytics.quiz_errors.slice(0, 10).map((error: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Quiz {error.quiz_id} - Q{error.question_id}
                          </span>
                          <span className="font-bold">{error.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Scenario Analytics */}
          {scenarioAnalytics && scenarioAnalytics.scenarios && (
            <Card glow>
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Scenario Effectiveness</h2>
              </div>
              <div className="space-y-4">
                {scenarioAnalytics.scenarios.map((scenario: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize">{scenario.scenario_type}</span>
                      <span className="text-primary font-bold">
                        {scenario.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Attempts: {scenario.total_attempts}</span>
                      {scenario.avg_completion_time_seconds > 0 && (
                        <span>
                          Avg time: {scenario.avg_completion_time_seconds.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${scenario.success_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
