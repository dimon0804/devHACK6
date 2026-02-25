'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import {
  HelpCircle,
  MessageCircle,
  Book,
  Video,
  Search,
  Mail,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SupportPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const faqCategories = [
    {
      icon: HelpCircle,
      title: 'Частые вопросы',
      items: [
        {
          question: 'Как создать аккаунт?',
          answer: 'Нажмите кнопку "Регистрация" на главной странице и заполните форму.',
        },
        {
          question: 'Как начать обучение?',
          answer: 'После регистрации перейдите в раздел "Планирование бюджета" или "Цели накоплений".',
        },
        {
          question: 'Как работает система XP?',
          answer: 'Вы получаете XP за выполнение заданий. Каждые 100 XP повышают ваш уровень.',
        },
      ],
    },
    {
      icon: Book,
      title: 'Обучение',
      items: [
        {
          question: 'Что такое планирование бюджета?',
          answer: 'Это сценарий, где вы учитесь распределять доходы по категориям расходов.',
        },
        {
          question: 'Как работают цели накоплений?',
          answer: 'Вы ставите финансовую цель и учитесь копить деньги, получая проценты на вклад.',
        },
      ],
    },
    {
      icon: MessageCircle,
      title: 'Техническая поддержка',
      items: [
        {
          question: 'Не могу войти в аккаунт',
          answer: 'Проверьте правильность email и пароля. Если проблема сохраняется, обратитесь в поддержку.',
        },
        {
          question: 'Проблемы с отображением',
          answer: 'Очистите кеш браузера или попробуйте другой браузер.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
              {t('footer.support')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Найдите ответы на ваши вопросы или свяжитесь с нами
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по вопросам..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: MessageCircle,
                title: 'Чат поддержки',
                description: 'Онлайн чат с нашей командой',
                action: 'Написать',
              },
              {
                icon: Mail,
                title: 'Email поддержка',
                description: 'support@finteen.ru',
                action: 'Написать',
              },
              {
                icon: Video,
                title: 'Видео-инструкции',
                description: 'Обучающие видео по платформе',
                action: 'Смотреть',
              },
            ].map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="text-center h-full">
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-4">
                    <action.icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {action.description}
                  </p>
                  <Button variant="secondary" size="sm">
                    {action.action}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <category.icon className="text-primary" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">{category.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item, itemIndex) => (
                    <Card key={itemIndex} className="h-full">
                      <h3 className="font-semibold mb-2">{item.question}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.answer}
                      </p>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Card glow className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Не нашли ответ на свой вопрос?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Свяжитесь с нашей службой поддержки
              </p>
              <Button variant="primary" size="lg" onClick={() => router.push('/contact')}>
                Связаться с нами
              </Button>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
