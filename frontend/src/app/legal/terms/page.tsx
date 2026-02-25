'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'

export default function TermsOfServicePage() {
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
                  <FileText className="text-primary" size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {t('footer.termsOfService')}
                </h1>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">1. Принятие условий</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Используя платформу FinTeen, вы соглашаетесь с настоящими Условиями использования.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">2. Описание сервиса</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    FinTeen — образовательная платформа для изучения финансовой грамотности через интерактивные игры и сценарии.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">3. Регистрация</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Для использования платформы необходимо:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Создать аккаунт с действительным email</li>
                    <li>Предоставить достоверную информацию</li>
                    <li>Соблюдать правила использования</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">4. Правила использования</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Запрещается:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Использовать платформу в незаконных целях</li>
                    <li>Попытки взлома или нарушения безопасности</li>
                    <li>Распространение вредоносного контента</li>
                    <li>Нарушение прав других пользователей</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">5. Интеллектуальная собственность</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Все материалы платформы защищены авторским правом и принадлежат FinTeen.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">6. Ответственность</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    Платформа предоставляется &quot;как есть&quot;. Мы не несем ответственности за возможные убытки, связанные с использованием платформы.
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
