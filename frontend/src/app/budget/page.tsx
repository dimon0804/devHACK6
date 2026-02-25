'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function BudgetPage() {
  const router = useRouter()
  const [income, setIncome] = useState('')
  const [categories, setCategories] = useState([
    { name: '', amount: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const addCategory = () => {
    setCategories([...categories, { name: '', amount: '' }])
  }

  const updateCategory = (index: number, field: string, value: string) => {
    const updated = [...categories]
    updated[index] = { ...updated[index], [field]: value }
    setCategories(updated)
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await api.post('/api/v1/budget/plan', {
        income: parseFloat(income),
        categories: categories
          .filter((c) => c.name && c.amount)
          .map((c) => ({
            name: c.name,
            amount: parseFloat(c.amount),
          })),
      })
      setResult(response.data)
    } catch (err: any) {
      setResult({
        success: false,
        feedback: err.response?.data?.detail || 'Failed to plan budget',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <Card>
          <h1 className="text-3xl font-bold mb-6 text-primary">Budget Planning</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Income</label>
              <input
                type="number"
                step="0.01"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Categories</label>
                <Button type="button" variant="secondary" onClick={addCategory}>
                  Add Category
                </Button>
              </div>
              {categories.map((category, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={category.name}
                    onChange={(e) =>
                      updateCategory(index, 'name', e.target.value)
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={category.amount}
                    onChange={(e) =>
                      updateCategory(index, 'amount', e.target.value)
                    }
                    className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  {categories.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeCategory(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Plan Budget'}
            </Button>
          </form>

          {result && (
            <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={result.success ? 'success' : 'warning'}>
                  {result.success ? 'Success' : 'Needs Improvement'}
                </Badge>
                <span className="text-sm">
                  XP Reward: {result.xp_reward || 0}
                </span>
              </div>
              <p className="text-sm">{result.feedback}</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
