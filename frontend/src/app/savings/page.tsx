'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Plus, Target, TrendingUp } from 'lucide-react'
import { formatBalanceNumber, toNumber } from '@/lib/utils'

export default function SavingsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', target_amount: '' })
  const [depositModal, setDepositModal] = useState<{ isOpen: boolean; goalId: number | null }>({
    isOpen: false,
    goalId: null,
  })
  const [depositAmount, setDepositAmount] = useState('')

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await api.get('/api/v1/savings/goals')
      const goals = Array.isArray(response.data)
        ? response.data.map((goal: any) => ({
            ...goal,
            current_amount: toNumber(goal.current_amount, 0),
            target_amount: toNumber(goal.target_amount, 0),
          }))
        : []
      setGoals(goals)
    } catch (err) {
      console.error('Failed to fetch goals', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/v1/savings/goals', {
        title: newGoal.title,
        target_amount: parseFloat(newGoal.target_amount),
      })
      setIsModalOpen(false)
      setNewGoal({ title: '', target_amount: '' })
      fetchGoals()
    } catch (err) {
      console.error('Failed to create goal', err)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositModal.goalId) return

    try {
      await api.post('/api/v1/savings/deposit', {
        goal_id: depositModal.goalId,
        amount: parseFloat(depositAmount),
      })
      setDepositModal({ isOpen: false, goalId: null })
      setDepositAmount('')
      fetchGoals()
    } catch (err) {
      console.error('Failed to deposit', err)
    }
  }

  const handleApplyInterest = async (goalId: number) => {
    try {
      await api.post(`/api/v1/savings/interest/${goalId}`)
      fetchGoals()
    } catch (err) {
      console.error('Failed to apply interest', err)
    }
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
    <main className="min-h-screen py-8 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                {t('savings.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('savings.manageGoals')}
              </p>
            </div>
          </div>

          {goals.length === 0 ? (
            <Card className="text-center py-12">
              <Target size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">{t('savings.noGoals')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('savings.createFirstGoal')}
              </p>
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                <Plus size={18} className="mr-2" />
                {t('savings.createGoal')}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {goals.map((goal, index) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover glow className="h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold">{goal.title}</h3>
                          {goal.completed && (
                            <Badge variant="success">{t('savings.completed')}</Badge>
                          )}
                        </div>

                        <div className="flex-1 mb-6">
                          <div className="flex justify-center mb-4">
                            <CircularProgress
                              value={goal.current_amount}
                              max={goal.target_amount}
                              size={120}
                            >
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                  {progress.toFixed(0)}%
                                </div>
                              </div>
                            </CircularProgress>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t('savings.currentAmount')}
                              </span>
                              <span className="font-semibold">
                                {formatBalanceNumber(goal.current_amount)} ₽
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {t('savings.targetAmount')}
                              </span>
                              <span className="font-semibold">
                                {formatBalanceNumber(goal.target_amount)} ₽
                              </span>
                            </div>
                            <ProgressBar
                              value={goal.current_amount}
                              max={goal.target_amount}
                              className="mt-3"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setDepositModal({ isOpen: true, goalId: goal.id })
                            }
                            disabled={goal.completed}
                            className="flex-1"
                          >
                            {t('savings.deposit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApplyInterest(goal.id)}
                            disabled={goal.completed}
                            title="Применить проценты"
                          >
                            <TrendingUp size={16} />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Floating Action Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="lg"
              className="rounded-full w-16 h-16 shadow-glow-lg p-0"
            >
              <Plus size={24} />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('savings.createSavingsGoal')}
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              {t('savings.goalTitle')}
            </label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={t('savings.goalTitle')}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              {t('savings.targetAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={newGoal.target_amount}
              onChange={(e) =>
                setNewGoal({ ...newGoal, target_amount: e.target.value })
              }
              required
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="0.00"
            />
          </div>
          <Button type="submit" className="w-full" variant="primary">
            {t('savings.createGoal')}
          </Button>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={depositModal.isOpen}
        onClose={() => setDepositModal({ isOpen: false, goalId: null })}
        title={t('savings.depositToGoal')}
      >
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              {t('savings.depositAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="0.00"
            />
          </div>
          <Button type="submit" className="w-full" variant="primary">
            {t('savings.deposit')}
          </Button>
        </form>
      </Modal>
    </main>
  )
}
