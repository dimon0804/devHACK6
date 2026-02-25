import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max: number
  showLabel?: boolean
}

export function ProgressBar({ value, max, className, showLabel = false, ...props }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={clsx('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="w-full h-3 bg-gray-200/50 dark:bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary to-primary-400 rounded-full shadow-inner-glow"
        />
      </div>
    </div>
  )
}
