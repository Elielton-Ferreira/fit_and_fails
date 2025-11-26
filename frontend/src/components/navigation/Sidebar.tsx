import { NavLink } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'

const navItems = [
  { label: 'Feed', href: '/dashboard', icon: '📣' },
  { label: 'Criar', href: '/create', icon: '➕' },
  { label: 'Água', href: '/water', icon: '💧' },
  { label: 'Tempo de Tela', href: '/screen', icon: '⌛' },
  { label: 'Exercícios', href: '/exercise', icon: '💪' },
  { label: 'Perfil', href: '/profile', icon: '👤' }
]

const Sidebar = () => {
  const { user, logout } = useAuth()

  return (
    <aside className="glass-panel hidden w-64 flex-col rounded-3xl p-6 text-slate-100 lg:flex">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Fit &amp; Fails</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">
          Disciplina com <span className="text-primary">humor</span>
        </h2>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              ].join(' ')
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-10 rounded-2xl border border-white/10 p-4">
        <p className="text-sm text-slate-400">Logado como</p>
        <div className="mt-2 flex items-center gap-3 overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold uppercase">
              {user?.name?.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="max-w-[150px] truncate text-lg font-semibold text-white">{user?.name}</p>
            <p className="max-w-[150px] truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button className="mt-4 text-sm text-primary hover:underline" onClick={logout}>
          Encerrar sessão
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
