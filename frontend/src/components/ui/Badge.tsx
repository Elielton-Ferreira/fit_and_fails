import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useTheme } from '../../modules/theme/ThemeProvider'

type BadgeProps = {
  label: string
  variant?: 'success' | 'warn' | 'info'
  icon?: ReactNode
  className?: string
}

const darkColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'border border-sky-300/50 bg-sky-500/20 text-sky-100',
  warn: 'border border-amber-300/50 bg-amber-500/15 text-amber-100',
  info: 'border border-sky-300/40 bg-sky-500/20 text-sky-100'
}

const lightColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'border border-sky-200 bg-sky-50 text-sky-700',
  warn: 'border border-amber-200 bg-amber-50 text-amber-700',
  info: 'border border-sky-200 bg-sky-50 text-sky-700'
}

const Badge = ({ label, icon, variant = 'info', className }: BadgeProps) => {
  const { theme } = useTheme()
  const palette = theme === 'light' ? lightColors : darkColors
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', palette[variant], className)}>
      {icon}
      {label}
    </span>
  )
}

export default Badge
