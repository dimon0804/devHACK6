'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Home, Search, Smile, TrendingDown } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <Card glow className="p-12">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-8"
            >
              <div className="text-9xl font-bold bg-gradient-to-r from-primary via-primary-400 to-secondary bg-clip-text text-transparent mb-4">
                404
              </div>
              <div className="flex justify-center gap-2 mb-6">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Search className="text-primary" size={48} />
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.7, repeat: Infinity, repeatDelay: 2 }}
                >
                  <TrendingDown className="text-secondary" size={48} />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Страница потерялась в финансовом пространстве! 💸
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-400 mb-8"
            >
              Похоже, эта страница решила сэкономить и ушла в отпуск. 
              Но не расстраивайтесь — мы поможем вам вернуться на правильный путь!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                variant="primary"
                onClick={() => router.push('/')}
              >
                <Home size={20} className="mr-2" />
                Вернуться на главную
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.back()}
              >
                Назад
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 pt-8 border-t border-[var(--card-border)]"
            >
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-500">
                <Smile size={20} />
                <span className="text-sm">
                  Пока вы здесь, можете изучить основы финансовой грамотности!
                </span>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
