'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValueEvent } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useMotionValueEvent(spring, 'change', (latest) => {
    setDisplay(latest.toFixed(decimals))
  })

  return (
    <motion.span className={className}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  )
}
