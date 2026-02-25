'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'

export default function PrivacyPolicyPage() {
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
                  <Shield className="text-primary" size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {t('footer.privacyPolicy')}
                </h1>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">1. Общие положения</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей платформы FinTeen.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Используя платформу, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">2. Собираемые данные</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Мы собираем следующие персональные данные:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Email адрес</li>
                    <li>Имя пользователя</li>
                    <li>Данные о прогрессе обучения</li>
                    <li>Технические данные (IP-адрес, тип браузера)</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">3. Использование данных</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Персональные данные используются для:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Предоставления доступа к платформе</li>
                    <li>Отслеживания прогресса обучения</li>
                    <li>Улучшения качества сервиса</li>
                    <li>Связи с пользователями</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">4. Защита данных</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Мы применяем современные методы защиты данных, включая шифрование и безопасное хранение.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">5. Права пользователей</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Вы имеете право:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Получить доступ к своим данным</li>
                    <li>Исправить неточные данные</li>
                    <li>Удалить свои данные</li>
                    <li>Отозвать согласие на обработку данных</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">6. Контакты</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    По вопросам обработки персональных данных обращайтесь: support@finteen.ru
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
