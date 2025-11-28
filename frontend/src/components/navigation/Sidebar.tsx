import { NavLink } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'
import { useTheme } from '../../modules/theme/ThemeProvider'

const IconFeed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
    <path d="M9 21v-6h6v6" />
  </svg>
)

const IconCreate = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

const IconWater = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3s-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10Z" />
  </svg>
)

const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20" />
    <path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15a2.5 2.5 0 0 1 2.5 2.5H20V2Z" />
  </svg>
)

const IconDumbbell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6v12" />
    <path d="M18 6v12" />
    <path d="M9 4v16" />
    <path d="M15 4v16" />
    <path d="M3 10v4" />
    <path d="M21 10v4" />
    <path d="M3 12h18" />
  </svg>
)

const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3 4.5-4 8-4s6.5 1 8 4" />
  </svg>
)

const navItems = [
  { label: 'Feed', href: '/dashboard', icon: <IconFeed /> },
  { label: 'Criar', href: '/create', icon: <IconCreate /> },
  { label: 'Água', href: '/water', icon: <IconWater /> },
  { label: 'Livros', href: '/book', icon: <IconBook /> },
  { label: 'Exercícios', href: '/exercise', icon: <IconDumbbell /> },
  { label: 'Perfil', href: '/profile', icon: <IconProfile /> }
]

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()

  const handleNavClick = (href: string) => {
    if (href === '/dashboard') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <aside className="glass-panel hidden w-64 flex-col rounded-3xl border border-white/10 p-6 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.35)] lg:sticky lg:top-4 lg:flex">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Fit &amp; Fails</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">
          Disciplina com <span className="text-sky-300">humor</span>
        </h2>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="mb-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200/60 hover:bg-white/10"
      >
        {theme === 'dark' ? '🌙 Modo escuro' : '☀️ Modo claro'}
      </button>
      <nav className="mb-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition backdrop-blur-sm',
                isActive
                  ? 'border-sky-200/80 bg-white/10 text-white shadow-[0_12px_36px_rgba(63,124,255,0.3)]'
                  : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
              ].join(' ')
            }
            onClick={() => handleNavClick(item.href)}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
