'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedLayoutProps {
  children: React.ReactNode
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Start loading state on pathname change
    setIsLoading(true)
    // Fade in after short delay
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
