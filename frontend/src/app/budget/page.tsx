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
import { Plus, X, CheckCircle, AlertCircle, History, Clock, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Lightbulb, Copy, BarChart3 } from 'lucide-react'

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
  const [showHistory, setShowHistory] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())
  const [budgetPlans, setBudgetPlans] = useState<any[]>([])
  const [financialAnalysis, setFinancialAnalysis] = useState<any>(null)

  useEffect(() => {
    fetchCategories()
    // Загружаем историю планирований при загрузке страницы
    fetchTransactionHistory()
  }, [])

  const fetchTransactionHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await api.get('/api/v1/transactions', {
        params: { page: 1, page_size: 100 }
      })
      // Фильтруем только транзакции, связанные с планированием бюджета
      const budgetTransactions = (response.data.transactions || []).filter(
        (tx: any) => tx.description && tx.description.includes('📋 План бюджета')
      )
      setTransactions(budgetTransactions)
      
      // Группируем транзакции по планированиям (по времени создания)
      const groupedPlans = groupTransactionsByPlan(budgetTransactions)
      setBudgetPlans(groupedPlans)
    } catch (err) {
      console.error('Failed to fetch transaction history', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const groupTransactionsByPlan = (transactions: any[]) => {
    // Группируем транзакции, созданные в течение 5 секунд друг от друга
    const plans: any[] = []
    const processed = new Set<number>()
    
    transactions.forEach((tx) => {
      if (processed.has(tx.id)) return
      
      const txTime = new Date(tx.created_at).getTime()
      const related = transactions.filter((other) => {
        if (processed.has(other.id)) return false
        const otherTime = new Date(other.created_at).getTime()
        return Math.abs(txTime - otherTime) < 5000 // 5 секунд
      })
      
      related.forEach(t => processed.add(t.id))
      
      const incomeTx = related.find(t => t.type === 'income' && t.description.includes('Доход'))
      const expenseTxs = related.filter(t => t.type === 'expense' && t.description.includes(' - '))
      
      if (incomeTx) {
        const income = parseFloat(incomeTx.amount)
        const totalExpenses = expenseTxs.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        const balance = income - totalExpenses
        const categories = expenseTxs.map(t => {
          const match = t.description.match(/📋 План бюджета: (.+?) - (.+?) ₽/)
          return {
            name: match ? match[1] : 'Неизвестная категория',
            amount: parseFloat(t.amount)
          }
        })
        
        plans.push({
          id: incomeTx.id,
          date: new Date(incomeTx.created_at),
          income,
          categories,
          totalExpenses,
          balance,
          feedback: getPlanFeedback(income, totalExpenses, categories.length)
        })
      }
    })
    
    return plans.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getPlanFeedback = (income: number, expenses: number, categoriesCount: number) => {
    const difference = Math.abs(income - expenses)
    const percentage = (difference / income) * 100
    
    if (percentage > 10) {
      return {
        type: 'warning',
        message: `Разница между доходом и расходами составляет ${percentage.toFixed(1)}%. Старайтесь планировать так, чтобы расходы равнялись доходу.`
      }
    } else if (categoriesCount < 3) {
      return {
        type: 'info',
        message: 'Хорошее начало! Добавьте больше категорий для более детального планирования.'
      }
    } else {
      return {
        type: 'success',
        message: 'Отличное планирование! Доходы и расходы хорошо сбалансированы.'
      }
    }
  }

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  useEffect(() => {
    if (showHistory && transactions.length === 0) {
      fetchTransactionHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory])

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

  const useLastBudget = () => {
    if (budgetPlans.length === 0) {
      addToast({
        message: 'Нет прошлых планирований для использования',
        type: 'info',
        duration: 3000,
      })
      return
    }

    const lastPlan = budgetPlans[0] // Последнее планирование (самое свежее)
    setIncome(lastPlan.income.toString())
    setCategories(
      lastPlan.categories.map((cat: any) => ({
        name: cat.name,
        amount: cat.amount.toString(),
        categoryId: null,
      }))
    )
    
    addToast({
      message: 'Прошлый бюджет загружен! Вы можете скорректировать его перед сохранением.',
      type: 'success',
      duration: 4000,
    })
  }

  const analyzeBudget = (income: number, categories: any[]) => {
    const totalExpenses = categories.reduce((sum, cat) => sum + parseFloat(cat.amount || 0), 0)
    const savings = income - totalExpenses
    const savingsPercentage = income > 0 ? (savings / income) * 100 : 0
    
    const analysis: any = {
      recommendations: [],
      warnings: [],
      positives: [],
    }

    // Правила анализа
    const thresholds = {
      savings: {
        excellent: 20, // 20%+ - отлично
        good: 10,      // 10-20% - хорошо
        low: 5,        // 5-10% - низко
      },
      entertainment: {
        high: 30,      // >30% - слишком много
        moderate: 20,  // 20-30% - умеренно
      },
      essentials: {
        min: 50,       // минимум 50% на необходимое
      },
    }

    // Анализ накоплений
    if (savingsPercentage >= thresholds.savings.excellent) {
      analysis.positives.push({
        type: 'savings',
        message: `Отлично! Ты откладываешь ${savingsPercentage.toFixed(1)}% — это финансово грамотно! 💰`,
        icon: '💰',
      })
    } else if (savingsPercentage >= thresholds.savings.good) {
      analysis.positives.push({
        type: 'savings',
        message: `Хорошо! Ты откладываешь ${savingsPercentage.toFixed(1)}% — это правильный подход! 👍`,
        icon: '👍',
      })
    } else if (savingsPercentage >= thresholds.savings.low) {
      analysis.warnings.push({
        type: 'savings',
        message: `Ты откладываешь ${savingsPercentage.toFixed(1)}% — попробуй увеличить до 10-20% для лучшей финансовой стабильности`,
        icon: '💡',
      })
    } else if (savingsPercentage < 0) {
      analysis.warnings.push({
        type: 'savings',
        message: `Внимание! Твои расходы превышают доход на ${Math.abs(savingsPercentage).toFixed(1)}%. Пересмотри планирование.`,
        icon: '⚠️',
      })
    } else {
      analysis.warnings.push({
        type: 'savings',
        message: `Рекомендуется откладывать хотя бы 10% от дохода. Сейчас ты откладываешь ${savingsPercentage.toFixed(1)}%`,
        icon: '💡',
      })
    }

    // Анализ категорий
    const categoryPercentages = categories.map((cat) => {
      const amount = parseFloat(cat.amount || 0)
      const percentage = income > 0 ? (amount / income) * 100 : 0
      return {
        name: cat.name,
        amount,
        percentage,
      }
    })

    // Проверка на развлечения
    const entertainmentCategories = ['развлечения', 'entertainment', 'игры', 'хобби', 'отдых']
    const entertainmentTotal = categoryPercentages
      .filter(cat => entertainmentCategories.some(ent => cat.name.toLowerCase().includes(ent)))
      .reduce((sum, cat) => sum + cat.percentage, 0)

    if (entertainmentTotal > thresholds.entertainment.high) {
      analysis.warnings.push({
        type: 'entertainment',
        message: `Ты тратишь ${entertainmentTotal.toFixed(1)}% на развлечения — это выше рекомендуемого уровня (20-30%)`,
        icon: '🎮',
      })
    } else if (entertainmentTotal > thresholds.entertainment.moderate) {
      analysis.recommendations.push({
        type: 'entertainment',
        message: `Ты тратишь ${entertainmentTotal.toFixed(1)}% на развлечения — это умеренный уровень`,
        icon: '✅',
      })
    }

    // Проверка на необходимое (еда, транспорт, коммунальные)
    const essentialCategories = ['еда', 'food', 'транспорт', 'transport', 'коммунальные', 'utilities', 'здоровье', 'health', 'образование', 'education']
    const essentialsTotal = categoryPercentages
      .filter(cat => essentialCategories.some(ess => cat.name.toLowerCase().includes(ess)))
      .reduce((sum, cat) => sum + cat.percentage, 0)

    if (essentialsTotal < thresholds.essentials.min) {
      analysis.warnings.push({
        type: 'essentials',
        message: `На необходимое (еда, транспорт, здоровье) уходит ${essentialsTotal.toFixed(1)}% — рекомендуется минимум 50%`,
        icon: '🏠',
      })
    } else {
      analysis.positives.push({
        type: 'essentials',
        message: `Отлично! На необходимое уходит ${essentialsTotal.toFixed(1)}% — это правильное распределение`,
        icon: '✅',
      })
    }

    // Проверка баланса
    const balance = income - totalExpenses
    const balancePercentage = income > 0 ? Math.abs((balance / income) * 100) : 0
    
    if (balancePercentage > 10) {
      analysis.warnings.push({
        type: 'balance',
        message: `Разница между доходом и расходами составляет ${balancePercentage.toFixed(1)}%. Старайся планировать так, чтобы расходы равнялись доходу`,
        icon: '⚖️',
      })
    }

    return analysis
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setFinancialAnalysis(null)

    try {
      const incomeValue = parseFloat(income)
      const categoriesData = categories
        .filter((c) => c.name && c.amount)
        .map((c) => ({
          name: c.name,
          amount: parseFloat(c.amount),
        }))

      const response = await api.post('/api/v1/budget/plan', {
        income: incomeValue,
        categories: categoriesData,
      })
      
      setResult(response.data)
      
      // Выполняем финансовый анализ
      const analysis = analyzeBudget(incomeValue, categoriesData)
      setFinancialAnalysis(analysis)
      
      // Обновляем историю после создания нового планирования
      setTimeout(() => {
        fetchTransactionHistory()
      }, 1000)
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                {t('budget.title')}
              </h1>
              {budgetPlans.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={useLastBudget}
                  className="flex items-center gap-2"
                >
                  <Copy size={16} />
                  Использовать прошлый бюджет
                </Button>
              )}
            </div>
            
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
                            const value = e.target.value
                            const updated = [...categories]
                            updated[index] = { 
                              ...updated[index], 
                              name: value,
                              categoryId: null // Сбрасываем при изменении
                            }
                            setCategories(updated)
                          }}
                          onBlur={(e) => {
                            // При потере фокуса проверяем точное совпадение
                            const value = e.target.value.trim()
                            if (value) {
                              const matchedCategory = availableCategories.find(
                                c => c.name === value
                              )
                              if (matchedCategory) {
                                const updated = [...categories]
                                updated[index] = { 
                                  ...updated[index], 
                                  name: matchedCategory.name,
                                  categoryId: matchedCategory.id
                                }
                                setCategories(updated)
                              }
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-w-0"
                          autoComplete="off"
                        />
                        <datalist id={`category-list-${index}`}>
                          {availableCategories.map((cat) => (
                            <option key={cat.id} value={cat.name} />
                          ))}
                        </datalist>
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
                <p className="text-sm mb-4">{result.feedback}</p>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Совет:</strong> Планирование бюджета создает только план. Чтобы получить деньги, используйте кнопку &quot;Получить доход&quot; на дашборде.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Финансовый анализ */}
            {financialAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="text-primary" size={24} />
                    <h3 className="text-xl font-bold">Финансовый анализ</h3>
                  </div>

                  {/* Положительные моменты */}
                  {financialAnalysis.positives.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {financialAnalysis.positives.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        >
                          <p className="text-sm text-green-800 dark:text-green-200">
                            <span className="text-lg mr-2">{item.icon}</span>
                            {item.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Рекомендации */}
                  {financialAnalysis.recommendations.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {financialAnalysis.recommendations.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        >
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <span className="text-lg mr-2">{item.icon}</span>
                            {item.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Предупреждения */}
                  {financialAnalysis.warnings.length > 0 && (
                    <div className="space-y-2">
                      {financialAnalysis.warnings.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                        >
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            <span className="text-lg mr-2">{item.icon}</span>
                            {item.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </Card>

          {/* История планирований */}
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="text-primary" size={20} />
                <h2 className="text-xl font-bold">История планирований</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newShowHistory = !showHistory
                  setShowHistory(newShowHistory)
                  if (newShowHistory && budgetPlans.length === 0) {
                    fetchTransactionHistory()
                  }
                }}
              >
                {showHistory ? 'Скрыть' : 'Показать'}
              </Button>
            </div>

            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                    />
                  </div>
                ) : budgetPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <History size={48} className="mx-auto mb-2 opacity-50" />
                    <p>История планирований пуста</p>
                    <p className="text-sm mt-2">Создайте первое планирование бюджета выше</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {budgetPlans.map((plan) => {
                      const planId = `plan-${plan.id}`
                      const isExpanded = expandedPlans.has(planId)
                      const formattedDate = plan.date.toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      const balanceColor = plan.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      const balanceIcon = plan.balance >= 0 ? TrendingUp : TrendingDown

                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
                        >
                          {/* Заголовок карточки */}
                          <button
                            onClick={() => togglePlan(planId)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="text-primary" size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">Планирование от {formattedDate}</span>
                                  <Badge variant={plan.feedback.type === 'success' ? 'success' : plan.feedback.type === 'warning' ? 'warning' : 'default'}>
                                    {plan.feedback.type === 'success' ? 'Отлично' : plan.feedback.type === 'warning' ? 'Требует внимания' : 'Хорошо'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Доход: <strong className="text-green-600 dark:text-green-400">{plan.income.toFixed(2)} ₽</strong></span>
                                  <span>Расходы: <strong className="text-red-600 dark:text-red-400">{plan.totalExpenses.toFixed(2)} ₽</strong></span>
                                  <span className={balanceColor}>
                                    Баланс: <strong>{plan.balance >= 0 ? '+' : ''}{plan.balance.toFixed(2)} ₽</strong>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {isExpanded ? (
                                <ChevronUp className="text-gray-400" size={20} />
                              ) : (
                                <ChevronDown className="text-gray-400" size={20} />
                              )}
                            </div>
                          </button>

                          {/* Раскрывающийся контент */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
                            >
                              <div className="p-4 space-y-4">
                                {/* Категории */}
                                <div>
                                  <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">
                                    Категории расходов ({plan.categories.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {plan.categories.map((cat: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800/50"
                                      >
                                        <span className="text-sm">{cat.name}</span>
                                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                          {cat.amount.toFixed(2)} ₽
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Совет */}
                                <div className={`p-3 rounded-lg border-2 ${
                                  plan.feedback.type === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : plan.feedback.type === 'warning'
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}>
                                  <div className="flex items-start gap-2">
                                    <Lightbulb className={`mt-0.5 ${
                                      plan.feedback.type === 'success'
                                        ? 'text-green-600 dark:text-green-400'
                                        : plan.feedback.type === 'warning'
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                    }`} size={18} />
                                    <div className="flex-1">
                                      <p className={`text-sm font-medium mb-1 ${
                                        plan.feedback.type === 'success'
                                          ? 'text-green-800 dark:text-green-200'
                                          : plan.feedback.type === 'warning'
                                          ? 'text-orange-800 dark:text-orange-200'
                                          : 'text-blue-800 dark:text-blue-200'
                                      }`}>
                                        Совет:
                                      </p>
                                      <p className={`text-sm ${
                                        plan.feedback.type === 'success'
                                          ? 'text-green-700 dark:text-green-300'
                                          : plan.feedback.type === 'warning'
                                          ? 'text-orange-700 dark:text-orange-300'
                                          : 'text-blue-700 dark:text-blue-300'
                                      }`}>
                                        {plan.feedback.message}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Статистика */}
                                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Категорий</p>
                                    <p className="text-lg font-bold">{plan.categories.length}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Сбалансированность</p>
                                    <p className={`text-lg font-bold ${balanceColor}`}>
                                      {Math.abs((plan.balance / plan.income) * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Средний расход</p>
                                    <p className="text-lg font-bold">
                                      {plan.categories.length > 0 ? (plan.totalExpenses / plan.categories.length).toFixed(2) : '0.00'} ₽
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
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
      
      <div className="mt-16">
        <Footer />
      </div>
    </main>
  )
}
