'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { useTheme } from 'next-themes'
import { Moon, Sun, Globe } from 'lucide-react'
import { formatBalance, toNumber } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [userData, setUserData] = useState<{
    id: number
    email: string
    username: string
    level: number
    xp: number
    balance: number
  } | null>(
    user
      ? {
          ...user,
          balance: toNumber(user.balance, 0),
          level: toNumber(user.level, 1),
          xp: toNumber(user.xp, 0),
        }
      : null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await api.get('/api/v1/users/me')
        const data = response.data
        // Ensure numeric types
        setUserData({
          ...data,
          balance: toNumber(data.balance, 0),
          level: toNumber(data.level, 1),
          xp: toNumber(data.xp, 0),
        })
      } catch {
        logout()
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [isAuthenticated, router, logout])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!userData) return null

  const xp = toNumber(userData.xp, 0)
  const xpInLevel = xp % 100
  const xpToNextLevel = 100 - xpInLevel

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-primary">FinTech Education</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Balance
            </h3>
            <p className="text-3xl font-bold text-primary">
              ${formatBalance(userData.balance)}
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Level
            </h3>
            <p className="text-3xl font-bold text-primary">{toNumber(userData.level, 1)}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              XP
            </h3>
            <p className="text-3xl font-bold text-primary">{xp}</p>
            <ProgressBar value={xpInLevel} max={100} className="mt-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {xpToNextLevel} XP to next level
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold mb-4">Budget Planning</h2>
            <Button
              onClick={() => router.push('/budget')}
              className="w-full"
              variant="primary"
            >
              Start Planning
            </Button>
          </Card>
          <Card>
            <h2 className="text-xl font-bold mb-4">Savings Goals</h2>
            <Button
              onClick={() => router.push('/savings')}
              className="w-full"
              variant="secondary"
            >
              Manage Goals
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
