import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-blue-400 via-blue-300 to-sky-200 text-slate-900 shadow-[0_12px_40px_rgba(91,141,255,0.35)] hover:shadow-[0_14px_48px_rgba(147,197,253,0.4)]',
  secondary: 'border border-white/15 bg-white/10 text-white hover:border-sky-200/60 hover:bg-white/15',
  ghost: 'border border-white/10 bg-transparent text-slate-200 hover:bg-white/5'
}

const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export default Button
