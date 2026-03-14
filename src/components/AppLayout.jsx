import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, Package, ShoppingCart, Users, ShoppingBag, MessageCircle, LogOut, Store } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { to: '/deudas', icon: Users, label: 'Deudas' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/chat', icon: MessageCircle, label: 'IA' },
]

export default function AppLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            <span className="font-black text-lg tracking-tight">Mi Tiendita</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold opacity-90 hidden sm:block">
              {usuario?.nombre?.split(' ')[0] || 'Hola'}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex border-t border-white/20">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24 md:pb-6 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-purple-100 shadow-lg">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                  isActive ? 'text-[#7C3AED]' : 'text-gray-400 hover:text-[#7C3AED]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-bold">{label}</span>
                  {isActive && <span className="absolute bottom-0 w-8 h-1 bg-[#7C3AED] rounded-t-full" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
