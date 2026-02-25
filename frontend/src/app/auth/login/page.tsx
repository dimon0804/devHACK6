'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Footer } from '@/components/layout/Footer'
import { toNumber } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/v1/auth/login', {
        email,
        password,
      })

      const { access_token, refresh_token } = response.data
      setTokens(access_token, refresh_token)

      const userResponse = await api.get('/api/v1/auth/me')
      const userData = userResponse.data
      // Ensure numeric types
      setUser({
        ...userData,
        balance: toNumber(userData.balance, 0),
        level: toNumber(userData.level, 1),
        xp: toNumber(userData.xp, 0),
      })

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.detail || err.message || t('auth.loginFailed')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 py-12">
        <Card className="max-w-md w-full p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">
            {t('auth.signIn')}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.signIn')}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.dontHaveAccount')}{' '}
            <button
              onClick={() => router.push('/auth/register')}
              className="text-primary hover:underline"
            >
              {t('common.signUp')}
            </button>
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
