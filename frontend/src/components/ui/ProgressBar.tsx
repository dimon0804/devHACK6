import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max: number
}

export function ProgressBar({ value, max, className, ...props }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div
      className={clsx(
        'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
