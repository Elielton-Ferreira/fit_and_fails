import { NavLink } from 'react-router-dom'

const items = [
  { label: 'Feed', href: '/dashboard', icon: '📣' },
  { label: 'Criar', href: '/create', icon: '➕' },
  { label: 'Água', href: '/water', icon: '💧' },
  { label: 'Tela', href: '/screen', icon: '⌛' },
  { label: 'Treino', href: '/exercise', icon: '💪' },
  { label: 'Perfil', href: '/profile', icon: '👤' }
]

const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/10 bg-night/90 py-3 text-sm text-slate-200 backdrop-blur lg:hidden">
    {items.map((item) => (
      <NavLink
        key={item.href}
        to={item.href}
        className={({ isActive }) =>
          [
            'flex flex-col items-center gap-1 text-xs font-medium',
            isActive ? 'text-white' : 'text-slate-300'
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
