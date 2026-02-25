import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
}

export function Card({ className, children, hover = false, glow = false, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={clsx(
        'glass rounded-3xl p-6 shadow-soft',
        hover && 'cursor-pointer',
        glow && 'shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
