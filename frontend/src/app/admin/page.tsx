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
} from 'lucide-react'

export default function AdminPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [errorAnalytics, setErrorAnalytics] = useState<any>(null)
  const [scenarioAnalytics, setScenarioAnalytics] = useState<any>(null)
  const [adminToken, setAdminToken] = useState<string>('')

  useEffect(() => {
    // Get admin token from localStorage or prompt
    const token = localStorage.getItem('admin_token') || ''
    setAdminToken(token)
    if (token) {
      fetchDashboardData(token)
    }
  }, [])

  const fetchDashboardData = async (token: string) => {
    setLoading(true)
    try {
      const [dashboardRes, errorsRes, scenariosRes] = await Promise.all([
        api.get('/api/v1/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/v1/admin/analytics/errors', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/v1/admin/analytics/scenarios', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setStats(dashboardRes.data)
      setErrorAnalytics(errorsRes.data)
      setScenarioAnalytics(scenariosRes.data)
    } catch (err: any) {
      console.error('Failed to fetch admin data', err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        const newToken = prompt('Введите admin token:')
        if (newToken) {
          localStorage.setItem('admin_token', newToken)
          setAdminToken(newToken)
          fetchDashboardData(newToken)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">Admin Access</h2>
          <input
            type="password"
            placeholder="Enter admin token"
            className="w-full px-4 py-2 border rounded-lg mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const token = (e.target as HTMLInputElement).value
                if (token) {
                  localStorage.setItem('admin_token', token)
                  setAdminToken(token)
                  fetchDashboardData(token)
                }
              }
            }}
          />
        </Card>
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive analytics and metrics
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchDashboardData(adminToken)}
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </Button>
          </div>

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
