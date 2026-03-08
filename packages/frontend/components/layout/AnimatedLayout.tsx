'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedLayoutProps {
  children: React.ReactNode
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname()
  const [isFirstMount, setIsFirstMount] = useState(true)

  useEffect(() => {
    // Skip animation on first mount (initial page load)
    setIsFirstMount(false)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={isFirstMount ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
