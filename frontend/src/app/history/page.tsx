'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react'
import { formatBalanceNumber, toNumber } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#50B848', '#BDCBEC', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF']

export default function HistoryPage() {
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const pageSize = 20

  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/transactions', {
        params: { page, page_size: pageSize },
      })
      setTransactions(response.data.transactions || [])
      setTotal(response.data.total || 0)
    } catch (err) {
      console.error('Failed to fetch transactions', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true
    const amount = toNumber(t.amount, 0)
    if (filter === 'income') return amount > 0
    return amount < 0
  })

  // Prepare data for charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  })

  const dailyData = last7Days.map((date) => {
    const dayTransactions = filteredTransactions.filter((t) => {
      const tDate = new Date(t.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      })
      return tDate === date
    })
    const income = dayTransactions
      .filter((t) => toNumber(t.amount, 0) > 0)
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    const expense = dayTransactions
      .filter((t) => toNumber(t.amount, 0) < 0)
      .reduce((sum, t) => sum + Math.abs(toNumber(t.amount, 0)), 0)
    return { date, income, expense }
  })

  const categoryData = filteredTransactions.reduce((acc: any, t) => {
    const type = t.type || 'other'
    const amount = Math.abs(toNumber(t.amount, 0))
    if (!acc[type]) {
      acc[type] = 0
    }
    acc[type] += amount
    return acc
  }, {})

  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 6)

  const totalIncome = filteredTransactions
    .filter((t) => toNumber(t.amount, 0) > 0)
    .reduce((sum, t) => sum + toNumber(t.amount, 0), 0)

  const totalExpense = Math.abs(
    filteredTransactions
      .filter((t) => toNumber(t.amount, 0) < 0)
      .reduce((sum, t) => sum + toNumber(t.amount, 0), 0)
  )

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="mb-6"
            >
              {t('common.back')}
            </Button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                  {t('history.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('history.subtitle')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  {t('history.all')}
                </Button>
                <Button
                  variant={filter === 'income' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('income')}
                >
                  <TrendingUp size={16} className="mr-1" />
                  {t('history.income')}
                </Button>
                <Button
                  variant={filter === 'expense' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('expense')}
                >
                  <TrendingDown size={16} className="mr-1" />
                  {t('history.expense')}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card glow>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('history.totalIncome')}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatBalanceNumber(totalIncome)} ₽
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <TrendingUp className="text-primary" size={24} />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card glow>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('history.totalExpense')}
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {formatBalanceNumber(totalExpense)} ₽
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <TrendingDown className="text-red-500" size={24} />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card glow>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('history.balance')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatBalanceNumber(totalIncome - totalExpense)} ₽
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-xl">
                    <Calendar className="text-secondary" size={24} />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card glow>
                <h3 className="text-xl font-bold mb-4">{t('history.incomeExpenseChart')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#50B848" name={t('history.income')} />
                    <Bar dataKey="expense" fill="#FF6B6B" name={t('history.expense')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card glow>
                <h3 className="text-xl font-bold mb-4">{t('history.categoryChart')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card glow>
              <h3 className="text-xl font-bold mb-6">{t('history.recentTransactions')}</h3>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('history.noTransactions')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => {
                    const amount = toNumber(transaction.amount, 0)
                    const isIncome = amount > 0
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div
                            className={`p-2 rounded-xl ${
                              isIncome
                                ? 'bg-primary/10 text-primary'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {isIncome ? (
                              <TrendingUp size={20} />
                            ) : (
                              <TrendingDown size={20} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {transaction.description || transaction.type}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(transaction.created_at).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p
                            className={`text-lg font-bold ${
                              isIncome ? 'text-primary' : 'text-red-500'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatBalanceNumber(Math.abs(amount))} ₽
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {total > pageSize && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {t('common.previous')}
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                    {t('common.page')} {page} {t('common.of')} {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
