import { NavLink } from 'react-router-dom'

const IconFeed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10h12" />
    <path d="M3 6h18" />
    <path d="M3 14h12" />
    <path d="M3 18h18" />
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

const items = [
  { label: 'Feed', href: '/dashboard', icon: <IconFeed /> },
  { label: 'Criar', href: '/create', icon: <IconCreate /> },
  { label: 'Água', href: '/water', icon: <IconWater /> },
  { label: 'Livros', href: '/book', icon: <IconBook /> },
  { label: 'Treino', href: '/exercise', icon: <IconDumbbell /> },
  { label: 'Perfil', href: '/profile', icon: <IconProfile /> }
]

const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/10 bg-[rgba(7,9,18,0.92)] py-3 text-sm text-slate-200 backdrop-blur lg:hidden">
    {items.map((item) => (
      <NavLink
        key={item.href}
        to={item.href}
        className={({ isActive }) =>
          [
            'flex flex-col items-center gap-1 rounded-xl px-2 text-xs font-medium transition',
            isActive ? 'text-white drop-shadow-[0_6px_22px_rgba(63,124,255,0.45)]' : 'text-slate-300 hover:text-white'
          ].join(' ')
        }
      >
        <span className="text-lg">{item.icon}</span>
        {item.label}
      </NavLink>
    ))}
  </nav>
)

export default BottomNav
