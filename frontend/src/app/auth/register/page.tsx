'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function RegisterPage() {
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/v1/auth/register', {
        email,
        username,
        password,
      })

      if (!response.data) {
        throw new Error('No data in response')
      }

      const { access_token, refresh_token } = response.data
      if (!access_token || !refresh_token) {
        throw new Error('Missing tokens in response')
      }

      setTokens(access_token, refresh_token)

      try {
        const userResponse = await api.get('/api/v1/auth/me')
        if (userResponse.data) {
          const userData = userResponse.data
          // Ensure numeric types
          setUser({
            ...userData,
            balance: Number(userData.balance || 0),
            level: Number(userData.level || 1),
            xp: Number(userData.xp || 0),
          })
        }
      } catch (userErr: any) {
        console.error('Failed to fetch user info:', userErr)
        // Continue anyway - user is registered
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">
          Sign Up
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Sign Up'}
          </Button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-primary hover:underline"
          >
            Sign In
          </button>
        </p>
      </Card>
    </main>
  )
}
