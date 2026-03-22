'use client'
import { useEffect } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved theme on mount
    const apply = (theme: string) => {
      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : theme
      document.documentElement.setAttribute('data-theme', resolved)
    }

    const saved = localStorage.getItem('leaf-theme') || 'dark'
    apply(saved)

    // Listen for system preference changes when theme = system
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onSystem = () => {
      if (localStorage.getItem('leaf-theme') === 'system') apply('system')
    }
    mq.addEventListener('change', onSystem)

    // Listen for theme changes from settings page
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'leaf-theme' && e.newValue) apply(e.newValue)
    }
    window.addEventListener('storage', onStorage)

    // Also expose a global setter for same-tab updates
    ;(window as any).__setLeafTheme = (theme: string) => {
      localStorage.setItem('leaf-theme', theme)
      apply(theme)
    }

    return () => {
      mq.removeEventListener('change', onSystem)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return <>{children}</>
}
