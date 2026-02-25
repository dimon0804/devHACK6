'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'

export default function PublicOfferPage() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-6"
            >
              Назад
            </Button>

            <Card glow className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileCheck className="text-primary" size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {t('footer.offer')}
                </h1>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">1. Предмет оферты</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Настоящая публичная оферта является официальным предложением FinTeen заключить договор на предоставление образовательных услуг.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">2. Акцепт оферты</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Акцептом настоящей оферты является регистрация на платформе и начало использования сервиса.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">3. Условия предоставления услуг</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Платформа предоставляет доступ к:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Интерактивным сценариям обучения</li>
                    <li>Инструментам планирования бюджета</li>
                    <li>Системе накоплений и целей</li>
                    <li>Отслеживанию прогресса</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">4. Стоимость услуг</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Базовый функционал платформы предоставляется бесплатно. Дополнительные функции могут быть платными.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">5. Права и обязанности сторон</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Пользователь обязуется:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                    <li>Использовать платформу в соответствии с назначением</li>
                    <li>Не нарушать права других пользователей</li>
                    <li>Соблюдать правила использования</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">6. Контактная информация</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    По вопросам оферты: support@finteen.ru
                  </p>
                </section>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
