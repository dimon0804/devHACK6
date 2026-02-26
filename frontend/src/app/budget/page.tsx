'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Footer } from '@/components/layout/Footer'
import { useToastStore } from '@/store/toastStore'
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Category {
  id: number
  name: string
  type: 'income' | 'expense' | 'savings'
  user_id: number | null
}

export default function BudgetPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { addToast } = useToastStore()
  const [income, setIncome] = useState('')
  const [categories, setCategories] = useState([
    { name: '', amount: '', categoryId: null as number | null },
  ])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/v1/categories', {
        params: { category_type: 'expense' }
      })
      setAvailableCategories(response.data)
    } catch (err) {
      console.error('Failed to fetch categories', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const addCategory = () => {
    setCategories([...categories, { name: '', amount: '', categoryId: null }])
  }

  const updateCategory = (index: number, field: string, value: string | number | null) => {
    const updated = [...categories]
    updated[index] = { ...updated[index], [field]: value }
    setCategories(updated)
  }

  const handleCategorySelect = (index: number, categoryId: number) => {
    const category = availableCategories.find(c => c.id === categoryId)
    if (category) {
      updateCategory(index, 'name', category.name)
      updateCategory(index, 'categoryId', categoryId)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      const response = await api.post('/api/v1/categories', {
        name: newCategoryName.trim(),
        type: 'expense'
      })
      setAvailableCategories([...availableCategories, response.data])
      // Автоматически выбираем новую категорию в первом пустом поле
      const emptyIndex = categories.findIndex(c => !c.name)
      if (emptyIndex !== -1) {
        handleCategorySelect(emptyIndex, response.data.id)
      }
      setNewCategoryName('')
      setShowNewCategoryModal(false)
      addToast({
        message: `Категория "${newCategoryName.trim()}" успешно создана!`,
        type: 'success',
        duration: 3000,
      })
    } catch (err: any) {
      console.error('Failed to create category', err)
      const status = err.response?.status
      const detail = err.response?.data?.detail || ''
      
      if (status === 409 || status === 400 || detail.includes('already exists') || detail.includes('уже существует')) {
        // Используем сообщение с бэкенда, если оно есть, иначе формируем своё
        const message = detail.includes('уже существует') || detail.includes('already exists')
          ? detail
          : `Категория "${newCategoryName.trim()}" уже существует. Выберите её из списка или введите другое название.`
        addToast({
          message,
          type: 'warning',
          duration: 5000,
        })
      } else {
        addToast({
          message: detail || 'Не удалось создать категорию. Попробуйте ещё раз.',
          type: 'error',
          duration: 4000,
        })
      }
    }
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
    <main className="min-h-screen py-8 pb-32">
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
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          list={`category-list-${index}`}
                          placeholder={t('budget.categoryName')}
                          value={category.name}
                          onChange={(e) => {
                            updateCategory(index, 'name', e.target.value)
                            updateCategory(index, 'categoryId', null)
                          }}
                          onFocus={(e) => {
                            // Показываем список при фокусе
                            e.target.click()
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-w-0"
                        />
                        <datalist id={`category-list-${index}`}>
                          {availableCategories.map((cat) => (
                            <option key={cat.id} value={cat.name} />
                          ))}
                        </datalist>
                        {category.name && !availableCategories.find(c => c.name === category.name) && (
                          <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                            Нажмите Enter или выберите из списка
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={t('budget.amount')}
                        value={category.amount}
                        onChange={(e) =>
                          updateCategory(index, 'amount', e.target.value)
                        }
                        className="w-28 sm:w-32 px-3 sm:px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowNewCategoryModal(true)}
                    className="w-full mt-2"
                  >
                    <Plus size={16} className="mr-1" />
                    Создать новую категорию
                  </Button>
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
      
      {/* Modal для создания новой категории */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Создать новую категорию</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Название категории"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory()
                }
              }}
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleCreateCategory}
                className="flex-1"
              >
                Создать
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewCategoryModal(false)
                  setNewCategoryName('')
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
      <Footer />
    </main>
  )
}
