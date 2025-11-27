import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 via-blue-400 to-sky-300 text-slate-900 shadow-[0_14px_50px_rgba(63,124,255,0.45)] hover:shadow-[0_16px_56px_rgba(127,180,255,0.55)]',
  secondary: 'border border-white/15 bg-white/10 text-white hover:border-sky-200/70 hover:bg-white/15',
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
