'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Footer } from '@/components/layout/Footer'
import {
  Info,
  Target,
  TrendingUp,
  Shield,
  Sparkles,
  CheckCircle,
  Users,
  Award,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation()

  const features = [
    {
      icon: Target,
      title: 'Планирование бюджета',
      description: 'Учитесь распределять доходы по категориям и создавать сбалансированный бюджет',
    },
    {
      icon: TrendingUp,
      title: 'Цели накоплений',
      description: 'Ставьте финансовые цели и учитесь копить, получая проценты на вклад',
    },
    {
      icon: Award,
      title: 'Система уровней',
      description: 'Зарабатывайте XP за правильные решения и повышайте свой уровень',
    },
    {
      icon: Shield,
      title: 'Безопасная среда',
      description: 'Виртуальные деньги и безопасное пространство для обучения',
    },
  ]

  const benefits = [
    'Интерактивные сценарии',
    'Геймификация обучения',
    'Отслеживание прогресса',
    'Персонализированный опыт',
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
              >
                <Sparkles className="text-primary" size={20} />
                <span className="text-sm font-semibold text-primary">
                  {t('common.tagline')}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-400 to-secondary bg-clip-text text-transparent"
              >
                {t('common.fintechEducation')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto"
              >
                {t('common.learnFinancialLiteracy')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => router.push('/auth/register')}
                  className="text-lg px-8 py-4"
                >
                  Начать бесплатно
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push('/about')}
                >
                  Узнать больше
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            >
              {[
                { value: '10K+', label: 'Активных пользователей' },
                { value: '50K+', label: 'Выполненных заданий' },
                { value: '95%', label: 'Довольных пользователей' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card glow className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-secondary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Что вы получите
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Все инструменты для изучения финансовой грамотности
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover glow className="h-full">
                    <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
                      <feature.icon className="text-primary" size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Почему выбирают FinTeen?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Современная платформа для изучения финансовой грамотности с
                  игровыми механиками и безопасной средой
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="p-1 bg-primary/10 rounded-lg">
                        <CheckCircle className="text-primary" size={20} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
              >
                <Card glow className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/5" />
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-primary/20 rounded-2xl">
                        <Users className="text-primary" size={32} />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">10,000+</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Довольных пользователей
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Присоединяйтесь к тысячам детей, которые уже изучают
                      финансовую грамотность через интерактивные игры и
                      безопасную среду
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card glow>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Готовы начать обучение?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Создайте аккаунт и начните свой путь к финансовой грамотности
                  уже сегодня
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => router.push('/auth/register')}
                  >
                    Создать аккаунт
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => router.push('/auth/login')}
                  >
                    Войти
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
