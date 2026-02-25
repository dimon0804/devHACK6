'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-primary">
          {t('common.fintechEducation')}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {t('common.learnFinancialLiteracy')}
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full"
            variant="primary"
          >
            {t('common.signIn')}
          </Button>
          <Button
            onClick={() => router.push('/auth/register')}
            className="w-full"
            variant="secondary"
          >
            {t('common.signUp')}
          </Button>
        </div>
      </Card>
    </main>
  )
}
