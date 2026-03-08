'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedLayoutProps {
  children: React.ReactNode
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => setIsReady(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Don't animate until after hydration
  if (!isReady) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0.95 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.25,
        ease: 'easeOut',
      }}
      className="flex-1"
    >
      {children}
    </motion.main>
  )
}
