'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowRight, Info } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { t } = useTranslation()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card glow className="text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-primary-400 to-secondary bg-clip-text text-transparent"
            >
              {t('common.fintechEducation')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-gray-600 dark:text-gray-400 mb-8 text-lg"
            >
              {t('common.learnFinancialLiteracy')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
                variant="primary"
                size="lg"
              >
                {t('common.signIn')}
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                onClick={() => router.push('/auth/register')}
                className="w-full"
                variant="secondary"
                size="lg"
              >
                {t('common.signUp')}
              </Button>
              <Button
                onClick={() => router.push('/about')}
                variant="ghost"
                className="w-full"
                size="sm"
              >
                <Info size={16} className="mr-2" />
                {t('about.aboutPlatform')}
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
