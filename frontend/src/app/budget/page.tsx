'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Footer } from '@/components/layout/Footer'
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function BudgetPage() {
  const router = useRouter()
  const { t } = useTranslation()
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
        feedback: err.response?.data?.detail || t('budget.feedback'),
      })
    } finally {
      setLoading(false)
    }
  }

  const totalAllocated = categories.reduce((sum, cat) => {
    return sum + (parseFloat(cat.amount) || 0)
  }, 0)
  const remaining = parseFloat(income) - totalAllocated
  const isBalanced = Math.abs(remaining) < 0.01

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {t('common.backToDashboard')}
          </Button>

          <Card glow className="mb-6">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              {t('budget.title')}
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {t('budget.income')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('budget.categories')}
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addCategory}
                  >
                    <Plus size={16} className="mr-1" />
                    {t('budget.addCategory')}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3"
                    >
                      <input
                        type="text"
                        placeholder={t('budget.categoryName')}
                        value={category.name}
                        onChange={(e) =>
                          updateCategory(index, 'name', e.target.value)
                        }
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder={t('budget.amount')}
                        value={category.amount}
                        onChange={(e) =>
                          updateCategory(index, 'amount', e.target.value)
                        }
                        className="w-32 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {categories.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategory(index)}
                          className="px-3"
                        >
                          <X size={18} />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {income && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('budget.allocated')}
                      </span>
                      <span className="font-semibold">{totalAllocated.toFixed(2)} {t('common.rubles')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('budget.remaining')}
                      </span>
                      <span className={`font-bold ${isBalanced ? 'text-primary' : remaining < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {remaining.toFixed(2)} {t('common.rubles')}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !income}
                size="lg"
              >
                {loading ? t('common.processing') : t('budget.planBudget')}
              </Button>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mt-6 p-6 rounded-2xl ${
                  result.success
                    ? 'bg-primary/10 border-2 border-primary/20'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {result.success ? (
                    <CheckCircle className="text-primary" size={24} />
                  ) : (
                    <AlertCircle className="text-orange-500" size={24} />
                  )}
                  <Badge variant={result.success ? 'success' : 'warning'}>
                    {result.success ? t('common.success') : t('common.needsImprovement')}
                  </Badge>
                  {result.xp_reward && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.xpReward')}: {result.xp_reward}
                    </span>
                  )}
                </div>
                <p className="text-sm">{result.feedback}</p>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
      <Footer />
    </main>
  )
}
