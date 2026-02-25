import { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function Badge({
  children,
  variant = 'default',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'px-2 py-1 text-xs font-medium rounded-full',
        {
          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200':
            variant === 'default',
          'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200':
            variant === 'success',
          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200':
            variant === 'warning',
          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200':
            variant === 'error',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
