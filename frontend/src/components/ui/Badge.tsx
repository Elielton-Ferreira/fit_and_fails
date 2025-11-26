import type { ReactNode } from 'react'
import clsx from 'clsx'

type BadgeProps = {
  label: string
  variant?: 'success' | 'warn' | 'info'
  icon?: ReactNode
  className?: string
}

const colors: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  info: 'bg-sky-100 text-sky-800'
}

const Badge = ({ label, icon, variant = 'info', className }: BadgeProps) => (
  <span className={clsx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', colors[variant], className)}>
    {icon}
    {label}
  </span>
)

export default Badge
