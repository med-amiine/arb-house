'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface AnimatedLayoutProps {
  children: React.ReactNode
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname()

  return (
    <motion.main
      key={pathname}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
          },
        },
      }}
      className="flex-1"
    >
      {children}
    </motion.main>
  )
}

// Hook for child components to use stagger animation
export function useStaggerAnimation() {
  return {
    variants: {
      hidden: { opacity: 0, y: 15 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.35,
          ease: [0.25, 0.1, 0.25, 1] as const,
        }
      },
    },
  }
}
