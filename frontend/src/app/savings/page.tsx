'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'

export default function SavingsPage() {
  const router = useRouter()
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
      // Ensure numeric types
      const goals = Array.isArray(response.data) 
        ? response.data.map((goal: any) => ({
            ...goal,
            current_amount: Number(goal.current_amount || 0),
            target_amount: Number(goal.target_amount || 0),
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
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Savings Goals</h1>
          <Button onClick={() => setIsModalOpen(true)}>Create Goal</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100
            return (
              <Card key={goal.id}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{goal.title}</h3>
                  {goal.completed && <Badge variant="success">Completed</Badge>}
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      {Number(goal.current_amount || 0).toFixed(2)} / {Number(goal.target_amount || 0).toFixed(2)}
                    </span>
                    <span>{Number(progress || 0).toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={goal.current_amount} max={goal.target_amount} />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setDepositModal({ isOpen: true, goalId: goal.id })
                    }
                    disabled={goal.completed}
                    className="flex-1"
                  >
                    Deposit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleApplyInterest(goal.id)}
                    disabled={goal.completed}
                  >
                    Apply Interest
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {goals.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No savings goals yet
            </p>
            <Button onClick={() => setIsModalOpen(true)}>Create Your First Goal</Button>
          </Card>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Savings Goal"
        >
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={newGoal.target_amount}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, target_amount: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <Button type="submit" className="w-full">
              Create Goal
            </Button>
          </form>
        </Modal>

        <Modal
          isOpen={depositModal.isOpen}
          onClose={() => setDepositModal({ isOpen: false, goalId: null })}
          title="Deposit to Goal"
        >
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <Button type="submit" className="w-full">
              Deposit
            </Button>
          </form>
        </Modal>
      </div>
    </main>
  )
}
