import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-gradient-to-r from-primary to-secondary text-night',
  secondary: 'bg-night text-white border border-white/10',
  ghost: 'bg-transparent text-white border border-white/20'
}

const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 font-semibold transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export default Button
