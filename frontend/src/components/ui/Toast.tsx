'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={clsx(
        'min-w-[300px] max-w-[500px] p-4 rounded-2xl shadow-glow-lg flex items-start gap-3 backdrop-blur-sm border-2',
        {
          'bg-green-500/90 text-white border-green-400/50': type === 'success',
          'bg-red-500/90 text-white border-red-400/50': type === 'error',
          'bg-blue-500/90 text-white border-blue-400/50': type === 'info',
          'bg-orange-500/90 text-white border-orange-400/50': type === 'warning',
        }
      )}
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Закрыть"
      >
        <X size={18} />
      </button>
    </motion.div>
  )
}
